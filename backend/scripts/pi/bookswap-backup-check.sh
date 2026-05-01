#!/usr/bin/env bash
# BookSwap Backup Verification — runs daily at 06:30 UTC, 30 min after the
# pi-wide backup-monitor.sh which actually performs the dumps. This script
# does NOT redo the dump — it cross-checks that the bs_prod / bs_staging
# files exist on both NVMe and external SSD, are the right shape, and pass
# pg_restore --list integrity checks. Reports to the BookSwap channel.
#
# Cron entry:
#   30 6 * * * /home/gnimoh001/scripts/bookswap-backup-check.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-backup.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-backup-check.sh.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

# Override strict mode — per-DB failures should be reported, not fatal.
set +e

NVME_DIR="$HOME/backups/db"
EXTERNAL_DIR="/mnt/media/backups/db"
TODAY=$(date -u '+%Y-%m-%d')
DATABASES=("bs_prod" "bs_staging")

# Soft warning floor — anything smaller than this is *worth a comment* but
# not a failure. BookSwap launched 2026-04-30; the prod database is < 1 MB
# at the start, so a strict 1 MB threshold would warn for the wrong reason.
# Bump as the dataset grows.
MIN_DUMP_BYTES=$((100 * 1024))
# Hard error floor — a dump this small is almost certainly broken regardless
# of dataset size (a 1 KB pg_dump custom-format file is just the header).
ABS_FLOOR_BYTES=$((10 * 1024))

LINES=""
FAILURES=0
WARNINGS=0
add_line() { LINES="${LINES}${1}\n"; }

for DB in "${DATABASES[@]}"; do
  NVME_PATH="${NVME_DIR}/${DB}_${TODAY}.dump"
  EXT_PATH="${EXTERNAL_DIR}/${DB}_${TODAY}.dump"

  # NVMe presence + size + integrity
  if [[ ! -f "$NVME_PATH" ]]; then
    add_line "❌ ${DB} — NVMe dump missing for ${TODAY}"
    (( FAILURES++ ))
    continue
  fi

  NVME_SIZE=$(stat -c%s "$NVME_PATH" 2>/dev/null || echo 0)
  NVME_HUMAN=$(bytes_to_human "$NVME_SIZE")

  if (( NVME_SIZE < ABS_FLOOR_BYTES )); then
    add_line "❌ ${DB} — NVMe dump catastrophically small (${NVME_HUMAN})"
    (( FAILURES++ ))
    continue
  elif (( NVME_SIZE < MIN_DUMP_BYTES )); then
    add_line "⚠️ ${DB} — NVMe dump suspiciously small (${NVME_HUMAN})"
    (( WARNINGS++ ))
  fi

  if ! pg_restore --list "$NVME_PATH" > /dev/null 2>&1; then
    add_line "❌ ${DB} — NVMe dump fails pg_restore --list (corruption?)"
    (( FAILURES++ ))
    continue
  fi

  # External mirror presence + size match
  if [[ ! -f "$EXT_PATH" ]]; then
    add_line "❌ ${DB} — external mirror missing for ${TODAY}"
    (( FAILURES++ ))
    continue
  fi

  EXT_SIZE=$(stat -c%s "$EXT_PATH" 2>/dev/null || echo 0)
  if [[ "$NVME_SIZE" != "$EXT_SIZE" ]]; then
    add_line "⚠️ ${DB} — NVMe (${NVME_HUMAN}) ≠ external ($(bytes_to_human "$EXT_SIZE"))"
    (( WARNINGS++ ))
  fi

  add_line "   ${DB} — ${NVME_HUMAN} ✓ (NVMe + external, integrity OK)"
done

# Storage summary so the operator sees the trend over time.
NVME_TOTAL=$(du -sh "$NVME_DIR" 2>/dev/null | awk '{print $1}' || echo "?")
EXT_TOTAL=$(du -sh "$EXTERNAL_DIR" 2>/dev/null | awk '{print $1}' || echo "?")

if (( FAILURES > 0 )); then
  HEADER="❌ *BookSwap backup check — ${FAILURES} failure(s)*"
elif (( WARNINGS > 0 )); then
  HEADER="⚠️ *BookSwap backup check — ${WARNINGS} warning(s)*"
else
  HEADER="✅ *BookSwap backup verified*"
fi

MESSAGE="${HEADER}\n
${LINES}
📁 NVMe: ${NVME_TOTAL}
📀 External: ${EXT_TOTAL}

$(footer)"

send_telegram_bookswap "$(printf '%b' "$MESSAGE")"
log_msg "INFO" "Backup check complete. Failures=${FAILURES} Warnings=${WARNINGS}"
