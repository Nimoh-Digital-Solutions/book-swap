#!/usr/bin/env bash
# BookSwap Ops Digest — runs every 4 hours via cron and sends a summary of
# users / books / exchanges / trust-safety queue to the operator's Telegram
# channel via the shared monitoring library on the pi.
#
# Deploy path on the pi: ~/scripts/bookswap-ops-digest.sh
# Crontab entry:         0 */4 * * * /home/gnimoh001/scripts/bookswap-ops-digest.sh \
#                          >> /home/gnimoh001/monitor-state/bookswap-digest.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

CONTAINER="bs_web_prod"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  log_msg "ERROR" "BookSwap backend container ($CONTAINER) is not running — skipping digest"
  exit 0
fi

# Capture both the formatted digest and a non-zero exit code so we can
# surface a clear error to Telegram instead of silently dropping the run.
DIGEST=$(docker exec "$CONTAINER" python manage.py print_ops_digest 2>&1)
EXIT_CODE=$?

if [[ $EXIT_CODE -ne 0 ]]; then
  ERR_MESSAGE="🔴 *BookSwap digest failed*

Exit code: ${EXIT_CODE}
First line: $(echo "$DIGEST" | head -n 1)

$(footer)"
  send_telegram "$(printf '%b' "$ERR_MESSAGE")"
  log_msg "ERROR" "Digest command exited ${EXIT_CODE}"
  exit 1
fi

# Pi resource snapshot — this is the periodic capacity readout that lets the
# operator track headroom over time without having to ssh in. The thresholds
# in pi-health.sh page on hot conditions; this section is the *background*
# trend so we can spot drift before it becomes a page.
LOAD5=$(awk '{print $2}' /proc/loadavg)
MEM_TOTAL=$(awk '/MemTotal/ {printf "%.0f", $2/1024}' /proc/meminfo)
MEM_AVAIL=$(awk '/MemAvailable/ {printf "%.0f", $2/1024}' /proc/meminfo)
MEM_USED=$(( MEM_TOTAL - MEM_AVAIL ))
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
SWAP_TOTAL=$(awk '/SwapTotal/ {print $2}' /proc/meminfo)
SWAP_FREE=$(awk '/SwapFree/ {print $2}' /proc/meminfo)
if (( SWAP_TOTAL > 0 )); then
  SWAP_PCT=$(( (SWAP_TOTAL - SWAP_FREE) * 100 / SWAP_TOTAL ))
else
  SWAP_PCT=0
fi
TEMP_RAW=$(vcgencmd measure_temp 2>/dev/null | grep -oP '[0-9.]+' || echo "?")
NVME_PCT=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')

# bs_* container CPU% + RAM% — the share of the Pi this app actually uses
# right now. Useful both for capacity planning and for spotting noisy
# neighbours (we want bs_* + sl_* + vgf_* to add up to << 100%).
BS_STATS=$(docker stats --no-stream --format '{{.Name}} {{.CPUPerc}} {{.MemUsage}}' \
  2>/dev/null | grep '^bs_.*_prod ' || true)
BS_CPU_TOTAL=$(echo "$BS_STATS" | awk '{gsub(/%/,"",$2); s+=$2} END {printf "%.1f", s+0}')

PI_SECTION="
*🖥 Pi resource snapshot*
   • Load (5m): *${LOAD5}* / 4 cores
   • Memory: *${MEM_PCT}%* used (${MEM_USED} / ${MEM_TOTAL} MB)
   • Swap: ${SWAP_PCT}% used
   • Temp: ${TEMP_RAW}°C  ·  NVMe: ${NVME_PCT}% full
   • bs_* prod containers CPU: *${BS_CPU_TOTAL}%* of host"

# Append the standard footer used by every other monitor script so the
# digest is visually consistent in the Telegram channel.
MESSAGE="${DIGEST}
${PI_SECTION}

$(footer)"

send_telegram "$(printf '%b' "$MESSAGE")"
log_msg "OK" "BookSwap digest sent"
