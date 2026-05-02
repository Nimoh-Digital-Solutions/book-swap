#!/usr/bin/env bash
# BookSwap App Store Review-State Monitor — runs every 15 minutes via cron
# while a submission is in Apple's review pipeline. Polls the App Store
# Connect API for the current review state of the live iOS submission and
# pings Telegram on every transition (Waiting for Review → In Review →
# Pending Developer Release → Ready for Sale). Goes silent once the app
# is Ready for Sale or rejected (until the next submission flips it back
# into review).
#
# Companion of bookswap-asc-public-check.sh:
#   - review-monitor:  ASC-side state changes (auth required, internal)
#   - public-check:    public store appearance (no auth, external CDN signal)
# Use both together for full visibility.
#
# Setup (one-time, see docs/RELEASE-DAY-RUNBOOK.md § ASC API key setup):
#   1. Generate an App Store Connect API key (Admin or App Manager role)
#   2. Save the .p8 file to ~/.appstoreconnect/private_keys/AuthKey_<ID>.p8
#      with mode 600
#   3. Add to ~/.bookswap-monitor-env:
#        BOOKSWAP_ASC_KEY_ID="<10-char ID from ASC>"
#        BOOKSWAP_ASC_ISSUER_ID="<UUID from ASC users page>"
#        BOOKSWAP_ASC_KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_<ID>.p8"
#        # ASC_APP_ID is reused from BOOKSWAP_ASC_APP_ID (already in env)
#
# Cron entry (lives next to the public-check entry):
#   */15 * * * * /home/gnimoh001/scripts/bookswap-asc-review-monitor.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-asc-review.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-asc-review-monitor.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

# Required env (set in ~/.bookswap-monitor-env). Bail loudly if missing —
# silent failures here would mean we never notice approval for hours.
KEY_ID="${BOOKSWAP_ASC_KEY_ID:-}"
ISSUER_ID="${BOOKSWAP_ASC_ISSUER_ID:-}"
KEY_PATH="${BOOKSWAP_ASC_KEY_PATH:-}"
ASC_APP_ID="${BOOKSWAP_ASC_APP_ID:-6762515297}"

if [[ -z "$KEY_ID" || -z "$ISSUER_ID" || -z "$KEY_PATH" ]]; then
  log_msg "ERROR" "missing ASC API config in ~/.bookswap-monitor-env"
  log_msg "ERROR" "required: BOOKSWAP_ASC_KEY_ID, BOOKSWAP_ASC_ISSUER_ID, BOOKSWAP_ASC_KEY_PATH"
  exit 1
fi

if [[ ! -f "$KEY_PATH" ]]; then
  log_msg "ERROR" "ASC private key not found at $KEY_PATH"
  exit 1
fi

# ASC API requires a JWT signed with ES256. We avoid pulling in jwt-cli
# / pyjwt as a dependency by inlining the signing logic in Python — it's
# always available on the Pi. Token is valid for 19 minutes (ASC max is
# 20 minutes; we leave a 1-min safety margin so a slow API call near
# expiry doesn't 401).
JWT=$(python3 - <<PYEOF
import base64
import json
import sys
import time
from pathlib import Path

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import (
        decode_dss_signature,
    )
except ImportError:
    sys.stderr.write("ERROR: python3-cryptography not installed. Run: sudo apt install python3-cryptography\n")
    sys.exit(1)


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


key_id = "${KEY_ID}"
issuer_id = "${ISSUER_ID}"
key_path = Path("${KEY_PATH}")

header = {"alg": "ES256", "kid": key_id, "typ": "JWT"}
now = int(time.time())
payload = {
    "iss": issuer_id,
    "iat": now,
    "exp": now + 19 * 60,
    "aud": "appstoreconnect-v1",
}

signing_input = (
    b64url(json.dumps(header, separators=(",", ":")).encode())
    + "."
    + b64url(json.dumps(payload, separators=(",", ":")).encode())
).encode("ascii")

private_key = serialization.load_pem_private_key(key_path.read_bytes(), password=None)
der_signature = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
r, s = decode_dss_signature(der_signature)

# DER → fixed 64-byte (r || s) for JWT/JOSE.
sig_bytes = r.to_bytes(32, "big") + s.to_bytes(32, "big")
print(signing_input.decode() + "." + b64url(sig_bytes))
PYEOF
)

if [[ -z "$JWT" ]]; then
  log_msg "ERROR" "JWT generation failed"
  exit 1
fi

# Ask ASC for all app store versions of our app. The 'state' field on
# appStoreVersions is the review state we care about. ASC returns the
# versions in chronological order (newest last); we filter to the most
# recent createdDate client-side because ASC rejects `sort` and
# `fields[appStoreVersions]` on the nested /apps/{id}/appStoreVersions
# endpoint with PARAMETER_ERROR.ILLEGAL.
RESPONSE=$(curl -s --max-time 15 \
  -H "Authorization: Bearer ${JWT}" \
  "https://api.appstoreconnect.apple.com/v1/apps/${ASC_APP_ID}/appStoreVersions" \
  2>/dev/null)

if [[ -z "$RESPONSE" ]]; then
  log_msg "ERROR" "ASC API returned empty (network failure?)"
  exit 1
fi

# Surface API errors instead of swallowing them — easier to diagnose
# revoked keys, expired tokens, or schema changes from Apple.
if echo "$RESPONSE" | jq -e '.errors' >/dev/null 2>&1; then
  log_msg "ERROR" "ASC API returned errors:"
  echo "$RESPONSE" | jq '.errors' >&2
  exit 1
fi

# Parse the latest version's state. ASC's `appStoreState` enum values:
#   PREPARE_FOR_SUBMISSION         — draft, not submitted
#   WAITING_FOR_REVIEW             — submitted, in queue
#   IN_REVIEW                      — reviewer actively testing
#   PENDING_CONTRACT               — contract issue (rare)
#   PENDING_DEVELOPER_RELEASE      — APPROVED — operator must click Release
#   PROCESSING_FOR_APP_STORE       — released, propagating to CDN
#   READY_FOR_SALE                 — live on App Store
#   REJECTED                       — Apple rejected (metadata or binary)
#   METADATA_REJECTED              — metadata rejection (text/screenshot/url)
#   REMOVED_FROM_SALE              — operator pulled the app
#   DEVELOPER_REJECTED             — operator cancelled the submission
#   INVALID_BINARY                 — binary failed validation
# Pick the version with the latest createdDate (sort client-side because
# ASC won't accept `sort` server-side on this endpoint). `sort_by` returns
# ascending; `[-1]` grabs the newest entry.
LATEST=$(echo "$RESPONSE" | jq '[.data[] | {versionString: .attributes.versionString, appStoreState: .attributes.appStoreState, createdDate: .attributes.createdDate, releaseType: .attributes.releaseType}] | sort_by(.createdDate) | last')
VERSION=$(echo "$LATEST" | jq -r '.versionString // "unknown"')
STATE=$(echo "$LATEST" | jq -r '.appStoreState // "unknown"')
RELEASE_TYPE=$(echo "$LATEST" | jq -r '.releaseType // "unknown"')

if [[ "$STATE" == "unknown" ]]; then
  log_msg "ERROR" "could not parse appStoreState from ASC response"
  echo "$RESPONSE" | jq . >&2 2>/dev/null || echo "$RESPONSE" >&2
  exit 1
fi

# State transition tracking — only ping when state CHANGES, not every
# poll. The marker file is plain text "VERSION|STATE" so the next run
# can compare in O(1) without parsing JSON state.
STATE_FILE="$MONITOR_STATE/bookswap-asc-review-state.txt"
mkdir -p "$(dirname "$STATE_FILE")"

CURRENT_KEY="${VERSION}|${STATE}"
LAST_KEY=""
if [[ -f "$STATE_FILE" ]]; then
  LAST_KEY=$(cat "$STATE_FILE" 2>/dev/null || echo "")
fi

if [[ "$CURRENT_KEY" == "$LAST_KEY" ]]; then
  log_msg "INFO" "no change — version=${VERSION} state=${STATE}"
  exit 0
fi

# State has changed. Build a contextual Telegram message and route by
# severity (info / warning / success). Each transition has a dedicated
# emoji + message so the operator can grok the situation at a glance
# without expanding the notification.
case "$STATE" in
  WAITING_FOR_REVIEW)
    EMOJI="📨"
    HEADLINE="*Waiting for Review*"
    DETAIL="${VERSION} is in Apple's queue. Typical wait: 24–48h before reviewer picks it up."
    ;;
  IN_REVIEW)
    EMOJI="🔍"
    HEADLINE="*In Review*"
    DETAIL="Apple is actively reviewing ${VERSION}. Typical duration: 2–12h. Reviewer is signing in as reviewer@bookswaps.com."
    ;;
  PENDING_DEVELOPER_RELEASE)
    EMOJI="✅"
    HEADLINE="*APPROVED — Pending Developer Release*"
    DETAIL="Apple approved ${VERSION}. Click *Release This Version* in App Store Connect when you're ready to go live. See docs/RELEASE-DAY-RUNBOOK.md § When Apple Approves."
    ;;
  PROCESSING_FOR_APP_STORE)
    EMOJI="⏳"
    HEADLINE="*Released — Processing*"
    DETAIL="${VERSION} is being processed by Apple's CDN. Public visibility in 1–4h. The asc-public-check monitor will ping when it appears live."
    ;;
  READY_FOR_SALE)
    EMOJI="🎉"
    HEADLINE="*LIVE on the App Store*"
    DETAIL="${VERSION} is now downloadable. https://apps.apple.com/app/id${ASC_APP_ID}"
    ;;
  REJECTED|METADATA_REJECTED|INVALID_BINARY)
    EMOJI="❌"
    HEADLINE="*${STATE//_/ }*"
    DETAIL="${VERSION} was rejected. Open App Store Connect → App Review for the rejection note. Fix flow in docs/RELEASE-DAY-RUNBOOK.md § When Apple Rejects."
    ;;
  DEVELOPER_REJECTED)
    EMOJI="🛑"
    HEADLINE="*Submission cancelled (by operator)*"
    DETAIL="${VERSION} was cancelled before review completed. Resubmit when ready."
    ;;
  REMOVED_FROM_SALE)
    EMOJI="⚠️"
    HEADLINE="*Removed from Sale*"
    DETAIL="${VERSION} is no longer downloadable. Existing installs continue to run. Restore via Pricing and Availability."
    ;;
  PREPARE_FOR_SUBMISSION)
    # Quiet transition — the operator just opened a draft. Don't ping.
    log_msg "INFO" "draft state — ${VERSION} not yet submitted, no ping"
    echo "$CURRENT_KEY" > "$STATE_FILE"
    exit 0
    ;;
  *)
    EMOJI="ℹ️"
    HEADLINE="*State: ${STATE}*"
    DETAIL="${VERSION} transitioned to an unfamiliar state. Check ASC."
    ;;
esac

MESSAGE="${EMOJI} ${HEADLINE}

Version: \`${VERSION}\`
State: \`${STATE}\`
Release type: \`${RELEASE_TYPE}\`

${DETAIL}

$(footer)"

send_telegram_bookswap "$(printf '%b' "$MESSAGE")"

# Persist the new state AFTER the Telegram send so a Telegram outage
# results in a re-fire on the next cron tick rather than a swallowed
# transition.
echo "$CURRENT_KEY" > "$STATE_FILE"
log_msg "INFO" "TRANSITION — ${LAST_KEY:-<none>} → ${CURRENT_KEY}"
