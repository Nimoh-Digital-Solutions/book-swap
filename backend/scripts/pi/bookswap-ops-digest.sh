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

# Append the standard footer used by every other monitor script so the
# digest is visually consistent in the Telegram channel.
MESSAGE="${DIGEST}

$(footer)"

send_telegram "$(printf '%b' "$MESSAGE")"
log_msg "OK" "BookSwap digest sent"
