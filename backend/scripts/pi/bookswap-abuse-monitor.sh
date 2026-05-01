#!/usr/bin/env bash
# BookSwap Abuse Monitor — runs hourly via cron.
# Wraps `python manage.py print_abuse_digest --hours 1` (which lives in
# the backend repo and is unit-tested) and routes the output to the
# BookSwap Telegram channel — but only when there's something worth
# saying, to avoid 24 quiet pings per day.
#
# Cron entry:
#   23 * * * * /home/gnimoh001/scripts/bookswap-abuse-monitor.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-abuse.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-abuse-monitor.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

CONTAINER="bs_web_prod"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  log_msg "WARN" "${CONTAINER} is not running — skipping abuse digest"
  exit 0
fi

# JSON first so we can decide whether to telegram. Markdown second for
# the actual message body. Two passes is cheap (a single Django startup
# each) and keeps the decision logic in bash where the Telegram creds live.
JSON=$(docker exec "$CONTAINER" python manage.py print_abuse_digest --hours 1 --format json 2>&1)
JSON_EXIT=$?

if [[ $JSON_EXIT -ne 0 ]]; then
  ERR_MESSAGE="🔴 *BookSwap abuse digest failed*

Exit code: ${JSON_EXIT}
First line: $(echo "$JSON" | head -n 1)

$(footer)"
  send_telegram_bookswap "$(printf '%b' "$ERR_MESSAGE")"
  log_msg "ERROR" "abuse digest exited ${JSON_EXIT}"
  exit 1
fi

# Decide whether to ping. We surface the digest when ANY of the
# following is true; otherwise the run is silent (logged only):
#   - reports filed in the last hour > 0
#   - account lockouts in the last hour > 0
#   - signup spike detected
#   - reports queue backlog ≥ 5 (so we pulse once per hour while the
#     mod queue grows, encouraging triage)
SHOULD_PING=$(echo "$JSON" | python3 -c '
import json, sys
data = json.load(sys.stdin)
r = data["reports"]
l = data["lockouts"]
s = data["signups"]
ping = (
    r["filed_in_window"] > 0
    or l["in_window"] > 0
    or s["spike_detected"]
    or r["queue_open_total"] >= 5
)
print("yes" if ping else "no")
' 2>/dev/null || echo "no")

if [[ "$SHOULD_PING" != "yes" ]]; then
  log_msg "OK" "no abuse signals in last hour — silent run"
  exit 0
fi

DIGEST=$(docker exec "$CONTAINER" python manage.py print_abuse_digest --hours 1 --format markdown 2>&1)
MESSAGE="${DIGEST}

$(footer)"

send_telegram_bookswap "$(printf '%b' "$MESSAGE")"
log_msg "OK" "abuse digest sent"
