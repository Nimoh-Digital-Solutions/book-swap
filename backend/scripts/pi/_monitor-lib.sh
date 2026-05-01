#!/usr/bin/env bash
# Shared monitoring library — sourced by every pi-monitor script.
# Two channels are supported:
#   1. Operator (default)  — credentials in ~/.monitor-env
#   2. BookSwap-specific   — credentials in ~/.bookswap-monitor-env
#
# Pi-wide scripts (pi-health, container-monitor, etc.) use `send_telegram`
# which targets the operator channel. BookSwap-specific scripts use
# `send_telegram_bookswap` which targets the BookSwap channel. A few
# critical pi-health alerts mirror to BOTH so a BookSwap-only operator
# still hears about disk-full / OOM events that would take the app down.
#
# Source of truth: backend/scripts/pi/_monitor-lib.sh in the BookSwap repo.
# The deployed copy at ~/scripts/_monitor-lib.sh on the Pi must mirror it.

set -euo pipefail

MONITOR_ENV="$HOME/.monitor-env"
BOOKSWAP_MONITOR_ENV="$HOME/.bookswap-monitor-env"
MONITOR_STATE="$HOME/monitor-state"

if [[ -f "$MONITOR_ENV" ]]; then
  # shellcheck source=/dev/null
  source "$MONITOR_ENV"
fi

if [[ -f "$BOOKSWAP_MONITOR_ENV" ]]; then
  # shellcheck source=/dev/null
  source "$BOOKSWAP_MONITOR_ENV"
fi

: "${TELEGRAM_BOT_TOKEN:=}"
: "${TELEGRAM_CHAT_ID:=}"
: "${BOOKSWAP_TELEGRAM_BOT_TOKEN:=}"
: "${BOOKSWAP_TELEGRAM_CHAT_ID:=}"

mkdir -p "$MONITOR_STATE"

# Low-level send. Posts a Markdown message to a specific (token, chat_id)
# pair. Returns silently on failure (telegram outage shouldn't break
# monitoring — the calling script should still write its log).
_send_telegram_to() {
  local TOKEN="$1"
  local CHAT_ID="$2"
  local MESSAGE="$3"
  if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
    echo "[WARN] missing telegram creds for chat=${CHAT_ID:-?} — skipping"
    return 0
  fi
  curl -sf -X POST \
    "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${MESSAGE}" \
    -d "parse_mode=Markdown" \
    -d "disable_web_page_preview=true" > /dev/null 2>&1 || true
}

# Operator channel (pi-wide).
send_telegram() {
  _send_telegram_to "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID" "$1"
}

# BookSwap channel — used by every bookswap-*.sh script. Falls back to a
# warning log if the bookswap env file is missing so we don't silently
# drop alerts on a fresh Pi.
send_telegram_bookswap() {
  if [[ -z "$BOOKSWAP_TELEGRAM_BOT_TOKEN" ]]; then
    echo "[WARN] BOOKSWAP_TELEGRAM_BOT_TOKEN not set — is ~/.bookswap-monitor-env present?"
    return 0
  fi
  _send_telegram_to "$BOOKSWAP_TELEGRAM_BOT_TOKEN" "$BOOKSWAP_TELEGRAM_CHAT_ID" "$1"
}

# Mirror to BOTH channels — for pi-health alerts that affect BookSwap
# availability (OOM, disk full, unexpected reboot). Routine pi-wide alerts
# (CPU temp, docker disk waste) should keep using `send_telegram` only.
send_telegram_both() {
  send_telegram "$1"
  send_telegram_bookswap "$1"
}

log_msg() {
  local LEVEL="$1"
  shift
  printf "[%s] [%s] %s\n" "$(date -u '+%Y-%m-%d %H:%M UTC')" "$LEVEL" "$*"
}

check_threshold() {
  local LABEL="$1"
  local CURRENT="$2"
  local MAX="$3"
  local UNIT="${4:-}"

  if (( $(echo "$CURRENT > $MAX" | bc -l) )); then
    return 0  # threshold breached
  fi
  return 1    # within limits
}

bytes_to_human() {
  local BYTES="$1"
  if (( BYTES >= 1073741824 )); then
    printf "%.1f GB" "$(echo "$BYTES / 1073741824" | bc -l)"
  elif (( BYTES >= 1048576 )); then
    printf "%.0f MB" "$(echo "$BYTES / 1048576" | bc -l)"
  elif (( BYTES >= 1024 )); then
    printf "%.0f KB" "$(echo "$BYTES / 1024" | bc -l)"
  else
    printf "%d B" "$BYTES"
  fi
}

human_date() {
  date -u '+%b %-d, %Y at %H:%M UTC'
}

human_time() {
  date -u '+%H:%M UTC'
}

footer() {
  printf "🖥 %s · %s" "$(hostname)" "$(human_date)"
}

# Convert ISO timestamp to short human form (16:42 UTC)
iso_to_short() {
  local ISO="$1"
  local TRIMMED="${ISO%%.*}"       # strip fractional seconds
  date -u -d "$TRIMMED" '+%H:%M UTC' 2>/dev/null || echo "$ISO"
}

# Calculate seconds between two ISO timestamps
iso_diff_seconds() {
  local FROM="$1" TO="$2"
  local F="${FROM%%.*}" T="${TO%%.*}"
  local FS TS
  FS=$(date -u -d "$F" '+%s' 2>/dev/null || echo 0)
  TS=$(date -u -d "$T" '+%s' 2>/dev/null || echo 0)
  echo $(( TS - FS ))
}

# Seconds to human duration (e.g. 3661 → "1h 1m")
seconds_to_human() {
  local S="$1"
  if (( S < 0 )); then S=$(( -S )); fi
  if (( S < 60 )); then
    echo "~${S}s"
  elif (( S < 3600 )); then
    echo "~$(( S / 60 ))m"
  elif (( S < 86400 )); then
    local H=$(( S / 3600 )) M=$(( (S % 3600) / 60 ))
    if (( M > 0 )); then echo "~${H}h ${M}m"; else echo "~${H}h"; fi
  else
    local D=$(( S / 86400 )) H=$(( (S % 86400) / 3600 ))
    if (( H > 0 )); then echo "~${D}d ${H}h"; else echo "~${D}d"; fi
  fi
}
