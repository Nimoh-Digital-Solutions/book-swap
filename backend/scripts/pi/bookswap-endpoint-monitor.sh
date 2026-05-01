#!/usr/bin/env bash
# BookSwap HTTP Endpoint Monitor — runs every 5 minutes via cron.
# Probes only the public BookSwap surfaces (book-swaps.com + api). The
# pi-wide endpoint-monitor.sh keeps running too — it covers the other
# tenants and uses localhost ports. This one goes through Cloudflare so
# we also exercise the tunnel + DNS path.
#
# Cron entry:
#   */5 * * * * /home/gnimoh001/scripts/bookswap-endpoint-monitor.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-endpoint.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-endpoint-monitor.sh.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

STATUS_FILE="$MONITOR_STATE/bookswap-endpoint-status.txt"
TLS_STATE_FILE="$MONITOR_STATE/bookswap-tls-warned.txt"

# Anything slower than this in the global p50 is worth knowing about. We
# go through Cloudflare → tunnel → Pi, so 3 s already accounts for a
# generous edge-cache miss path.
ALERT_RESPONSE_TIME=3
# TLS warning window — alert once when cert has < 14 days left.
TLS_DAYS_WARNING=14

# name|url|expected_codes
ENDPOINTS=(
  "Web SPA|https://book-swaps.com/|200"
  "API health|https://api.book-swaps.com/api/v1/health/|200"
  "Admin login|https://api.book-swaps.com/admin/|200,301,302"
)

ALERTS=""
add_alert() { ALERTS="${ALERTS}${1}\n\n"; }

touch "$STATUS_FILE" "$TLS_STATE_FILE"
NEW_STATUS=""

for ENTRY in "${ENDPOINTS[@]}"; do
  IFS='|' read -r NAME URL EXPECTED <<< "$ENTRY"

  RESULT=$(curl -sf -o /dev/null \
    -w "%{http_code}|%{time_total}" \
    --connect-timeout 10 --max-time 15 \
    "$URL" 2>&1 || echo "000|0")
  HTTP_CODE=$(echo "$RESULT" | cut -d'|' -f1)
  RESP_TIME=$(echo "$RESULT" | cut -d'|' -f2)

  CODE_OK=false
  IFS=',' read -ra CODES <<< "$EXPECTED"
  for CODE in "${CODES[@]}"; do
    if [[ "$HTTP_CODE" == "$CODE" ]]; then
      CODE_OK=true
      break
    fi
  done

  PREV_STATUS=$(grep "^${NAME}|" "$STATUS_FILE" 2>/dev/null | cut -d'|' -f2 || true)

  if [[ "$CODE_OK" == "false" ]]; then
    if [[ "$HTTP_CODE" == "000" ]]; then
      add_alert "🔴 *${NAME}* is unreachable
   Connection failed — Cloudflare, tunnel, or origin is down
   URL: ${URL}"
    else
      add_alert "🟡 *${NAME}* returned HTTP ${HTTP_CODE}
   Expected: ${EXPECTED}
   URL: ${URL}"
    fi
    NEW_STATUS="${NEW_STATUS}${NAME}|DOWN|${HTTP_CODE}\n"
  else
    if check_threshold "response time" "$RESP_TIME" "$ALERT_RESPONSE_TIME" 2>/dev/null; then
      add_alert "🐢 *${NAME}* is slow — ${RESP_TIME}s
   Threshold: ${ALERT_RESPONSE_TIME}s. Likely cold cache, DB pressure,
   or a worker hot-loop. Cross-check \`/digest\` and Sentry."
    fi

    if [[ "$PREV_STATUS" == "DOWN" ]]; then
      add_alert "✅ *${NAME}* recovered
   Now responding with HTTP ${HTTP_CODE} (${RESP_TIME}s)"
    fi
    NEW_STATUS="${NEW_STATUS}${NAME}|UP|${HTTP_CODE}\n"
  fi
done

# --- TLS expiry on the apex domain ---
# Probes the production cert directly (not the Cloudflare-fronted one
# the browser sees — that's auto-renewed by Cloudflare). What we care
# about is the origin cert behind the tunnel.
if command -v openssl &>/dev/null; then
  EXPIRY=$(echo | openssl s_client -servername api.book-swaps.com \
    -connect api.book-swaps.com:443 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | cut -d= -f2)
  if [[ -n "$EXPIRY" ]]; then
    EXPIRY_TS=$(date -u -d "$EXPIRY" '+%s' 2>/dev/null || echo 0)
    NOW_TS=$(date -u '+%s')
    DAYS_LEFT=$(( (EXPIRY_TS - NOW_TS) / 86400 ))
    # Only alert once per warning event — avoid daily noise.
    LAST_WARNED=$(cat "$TLS_STATE_FILE" 2>/dev/null || echo 999)
    if (( DAYS_LEFT <= TLS_DAYS_WARNING )) && (( DAYS_LEFT < LAST_WARNED )); then
      add_alert "🔒 TLS cert expires in *${DAYS_LEFT}* day(s)
   api.book-swaps.com — renew via the cert provider (Cloudflare normally
   auto-renews; if it hasn't, check the dashboard)
   Certificate not_after: ${EXPIRY}"
      echo "$DAYS_LEFT" > "$TLS_STATE_FILE"
    elif (( DAYS_LEFT > TLS_DAYS_WARNING )); then
      # Reset the warned counter once we're back outside the window so a
      # future re-entry alerts again.
      echo 999 > "$TLS_STATE_FILE"
    fi
  fi
fi

printf "%b" "$NEW_STATUS" > "$STATUS_FILE"

if [[ -n "$ALERTS" ]]; then
  HEADER="🌐 *BookSwap Endpoint Alert*"
  MESSAGE="${HEADER}\n\n${ALERTS}$(footer)"
  send_telegram_bookswap "$(printf '%b' "$MESSAGE")"
  log_msg "ALERT" "BookSwap endpoint issues detected"
else
  log_msg "OK" "All ${#ENDPOINTS[@]} BookSwap endpoints responding normally"
fi
