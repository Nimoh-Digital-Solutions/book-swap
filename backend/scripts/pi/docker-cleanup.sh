#!/usr/bin/env bash
# Docker proactive cleanup — runs every 4 hours via cron.
# Frees disk by pruning the SAFE set: dangling images, stopped containers,
# and old build cache. Volumes and networks are deliberately left alone:
#   - Volumes carry persistent data; pruning a briefly-unused volume during
#     a container restart can destroy a tenant's database. Pi-wide volume
#     prune is never run automatically.
#   - Networks rarely accumulate enough to matter and pruning one mid-deploy
#     can race with `docker compose up`.
#
# Cron entry (every 4 hours, on the 5th minute so we don't collide with the
# top-of-hour scripts):
#   5 */4 * * * /home/gnimoh001/scripts/docker-cleanup.sh \
#       >> /home/gnimoh001/monitor-state/docker-cleanup.log 2>&1
#
# Send a Telegram message only when the run actually freed >= NOTIFY_MIN
# bytes. Quiet runs are logged to the state log but don't ping the channel,
# matching the conventions of the other monitor scripts.
#
# Source of truth: this file in the BookSwap repo (`backend/scripts/pi/`).
# The Pi-side copy at ~/scripts/docker-cleanup.sh must mirror it. See
# docs/SCALING-PLAYBOOK.md → "Docker disk hygiene".

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

# Keep this much build-cache around so the next deploy's BuildKit run can
# reuse layers (otherwise every build is a cold rebuild). 2 GB has been
# enough to cover the largest project's BuildKit graph with headroom.
KEEP_BUILD_CACHE="2GB"

# Skip the Telegram ping unless we freed at least this much. Avoids spamming
# the channel every 4 h with "freed 0 B" while keeping the log honest.
NOTIFY_MIN=$((100 * 1024 * 1024))   # 100 MB

if ! command -v docker &>/dev/null; then
  log_msg "ERROR" "docker not found on PATH — aborting"
  exit 1
fi

# Sum the "reclaimable" bytes across all four resource types using
# `docker system df --format`. Output looks like:
#   Images        3.682GB (66%)
#   Containers    0B (0%)
#   Local Volumes 174.4MB (76%)
#   Build Cache   1.671GB
# We grab the leading byte value (before the optional " (NN%)") and
# convert. Sticking to --format avoids fragile regex on the human-readable
# table — an earlier version of this parser matched the (...) percentage
# instead of bytes and silently returned 0 for years.
total_reclaimable() {
  docker system df --format '{{.Reclaimable}}' 2>/dev/null \
    | awk '{
        # First whitespace-separated token is the size, e.g. "3.682GB".
        size = $1
        # Strip a trailing "B" so the unit is the last char of the size.
        sub(/[bB]$/, "", size)
        # Pull off the unit (last char of what is left); rest is the number.
        unit = substr(size, length(size), 1)
        num  = substr(size, 1, length(size) - 1) + 0
        if      (unit == "G" || unit == "g") num *= 1073741824
        else if (unit == "M" || unit == "m") num *= 1048576
        else if (unit == "K" || unit == "k") num *= 1024
        else if (unit ~ /[0-9]/)              num = size + 0   # plain bytes
        total += num
      } END { printf "%.0f", total + 0 }'
}

BEFORE_BYTES=$(total_reclaimable)
BEFORE_HUMAN=$(bytes_to_human "${BEFORE_BYTES:-0}")
log_msg "INFO" "starting cleanup — ${BEFORE_HUMAN} reclaimable"

ERRORS=""
# Capture stderr so we can surface it in Telegram on failure. stdout from
# the prune commands is just the freed-byte report which we'll compute
# ourselves from `docker system df` deltas anyway.
{
  docker container prune -f \
    || ERRORS="${ERRORS}container prune failed; "
  docker image prune -f \
    || ERRORS="${ERRORS}image prune failed; "
  docker builder prune -f --keep-storage "$KEEP_BUILD_CACHE" \
    || ERRORS="${ERRORS}builder prune failed; "
} > /dev/null 2>&1

AFTER_BYTES=$(total_reclaimable)
AFTER_HUMAN=$(bytes_to_human "${AFTER_BYTES:-0}")
FREED_BYTES=$(( BEFORE_BYTES - AFTER_BYTES ))
if (( FREED_BYTES < 0 )); then FREED_BYTES=0; fi
FREED_HUMAN=$(bytes_to_human "$FREED_BYTES")

log_msg "OK" "freed=${FREED_HUMAN} before=${BEFORE_HUMAN} after=${AFTER_HUMAN}"

if [[ -n "$ERRORS" ]]; then
  MESSAGE="🐳 *Docker cleanup error*

Some prune commands failed:
${ERRORS}

Before: ${BEFORE_HUMAN}
After:  ${AFTER_HUMAN}
Freed:  ${FREED_HUMAN}

$(footer)"
  send_telegram "$(printf '%b' "$MESSAGE")"
  exit 1
fi

if (( FREED_BYTES >= NOTIFY_MIN )); then
  MESSAGE="🐳 *Docker cleanup*

Freed *${FREED_HUMAN}* of disk
   • Before: ${BEFORE_HUMAN} reclaimable
   • After:  ${AFTER_HUMAN} reclaimable
   • Kept ${KEEP_BUILD_CACHE} of build cache for next deploys

Pruned: dangling images, stopped containers, old build cache.
Volumes and networks were not touched (data-loss risk).

$(footer)"
  send_telegram "$(printf '%b' "$MESSAGE")"
fi
