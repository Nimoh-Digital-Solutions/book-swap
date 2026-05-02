#!/usr/bin/env bash
# BookSwap App Store public-appearance monitor — runs every 30 minutes via
# cron until the iOS app shows up on Apple's public iTunes Lookup API,
# then disables itself for the rest of the day.
#
# Why this exists: when ASC review status flips to "Pending Developer
# Release" or after the operator clicks Release This Version, there's a
# 1–4 hour CDN propagation window before the app is actually downloadable
# globally. This script gives a single, unambiguous "the app is now live
# everywhere" Telegram ping by polling Apple's own public lookup endpoint
# (no auth needed). It's the most actionable signal for "open the App Store
# and see if it's there" — review-state pings come from Apple emails.
#
# Idempotency: SEEN_FILE marks the first successful detection. Once written
# the script no-ops on subsequent runs (silent — no Telegram noise) until
# the marker is manually cleared (e.g. before the next major version
# launch). Storefront checks are deliberately spread across BE/NL/FR
# because Apple's CDN propagates per-region.
#
# Cron entry:
#   */30 * * * * /home/gnimoh001/scripts/bookswap-asc-public-check.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-asc-public.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-asc-public-check.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

# Config — overridable via ~/.bookswap-monitor-env so we never hard-code
# the App Store ID inside the script (cleaner ops + same ID is already
# referenced from BUILD-AND-SUBMIT.md and eas.json).
ASC_APP_ID="${BOOKSWAP_ASC_APP_ID:-6762515297}"
APP_NAME="${BOOKSWAP_APP_NAME:-BookSwap}"
# Storefronts to probe. BE/NL/FR/LU mirror the launch markets we care about
# the most; US is included as the canonical "fully propagated" signal.
STOREFRONTS=("be" "nl" "fr" "lu" "us")

SEEN_FILE="$MONITOR_STATE/bookswap-asc-public-seen.txt"

# If we've already announced this app version, no-op silently. The marker
# file holds the version + first-seen timestamp; clearing it triggers a
# fresh announcement (useful when launching 1.1.0, 2.0.0, etc.).
if [[ -f "$SEEN_FILE" ]]; then
  log_msg "INFO" "marker exists ($(head -n1 "$SEEN_FILE")) — skipping"
  exit 0
fi

# Probe Apple's public Lookup API per storefront. The endpoint returns
# {"resultCount":0,"results":[]} when the app isn't visible in that region
# yet, and a populated `results[0]` once it propagates. We only need ONE
# storefront to succeed to know the app exists publicly somewhere; the
# others tell us how far CDN propagation has reached.
declare -A STOREFRONT_STATUS
APP_VERSION=""
APP_TRACK_NAME=""
APP_URL=""
HIT_COUNT=0

for COUNTRY in "${STOREFRONTS[@]}"; do
  URL="https://itunes.apple.com/lookup?id=${ASC_APP_ID}&country=${COUNTRY}"
  # 10s timeout because Apple's lookup occasionally takes 5–8s during
  # peak hours; we'd rather wait than mark a slow region as missing.
  BODY=$(curl -sf --max-time 10 "$URL" 2>/dev/null || echo "")

  if [[ -z "$BODY" ]]; then
    STOREFRONT_STATUS[$COUNTRY]="✗ network/timeout"
    continue
  fi

  COUNT=$(echo "$BODY" | jq -r '.resultCount // 0' 2>/dev/null || echo "0")

  if [[ "$COUNT" == "0" ]]; then
    STOREFRONT_STATUS[$COUNTRY]="✗ not yet"
    continue
  fi

  STOREFRONT_STATUS[$COUNTRY]="✓ live"
  (( HIT_COUNT++ )) || true

  # Capture metadata from the first storefront that returns a result.
  # Apple returns the same payload across regions for a given app, so
  # one capture is enough to populate the alert message.
  if [[ -z "$APP_VERSION" ]]; then
    APP_VERSION=$(echo "$BODY" | jq -r '.results[0].version // ""' 2>/dev/null)
    APP_TRACK_NAME=$(echo "$BODY" | jq -r '.results[0].trackName // ""' 2>/dev/null)
    APP_URL=$(echo "$BODY" | jq -r '.results[0].trackViewUrl // ""' 2>/dev/null)
  fi
done

if (( HIT_COUNT == 0 )); then
  # Quiet path — log only, don't ping. The whole point is "fire once when
  # the app shows up", so silent polling is the desired behaviour.
  log_msg "INFO" "not yet visible in any of: ${STOREFRONTS[*]}"
  exit 0
fi

# Announce. Build a per-storefront line so the operator can see which
# regions are already propagated vs. still catching up.
STOREFRONT_LINES=""
for COUNTRY in "${STOREFRONTS[@]}"; do
  STOREFRONT_LINES="${STOREFRONT_LINES}    ${COUNTRY^^} — ${STOREFRONT_STATUS[$COUNTRY]}\n"
done

NOW_ISO=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
TRACK_DISPLAY="${APP_TRACK_NAME:-$APP_NAME}"

MESSAGE="🎉 *${TRACK_DISPLAY} is LIVE on the App Store*

Version: \`${APP_VERSION:-unknown}\`
First detected: ${HIT_COUNT}/${#STOREFRONTS[@]} storefronts at $(human_time)

Storefront propagation:
${STOREFRONT_LINES}
🔗 ${APP_URL:-https://apps.apple.com/app/id${ASC_APP_ID}}

This monitor will now stop polling. Clear
~/monitor-state/bookswap-asc-public-seen.txt
to re-arm before the next version launch.

$(footer)"

send_telegram_bookswap "$(printf '%b' "$MESSAGE")"

# Persist the marker AFTER the Telegram send. If Telegram is down, we'd
# rather re-fire on the next cron tick than silently swallow the launch
# announcement.
mkdir -p "$(dirname "$SEEN_FILE")"
{
  echo "version=${APP_VERSION:-unknown}"
  echo "first_seen=${NOW_ISO}"
  echo "first_seen_storefronts=${HIT_COUNT}/${#STOREFRONTS[@]}"
  echo "url=${APP_URL:-https://apps.apple.com/app/id${ASC_APP_ID}}"
} > "$SEEN_FILE"

log_msg "INFO" "FIRED — version=${APP_VERSION:-unknown} storefronts=${HIT_COUNT}/${#STOREFRONTS[@]}"
