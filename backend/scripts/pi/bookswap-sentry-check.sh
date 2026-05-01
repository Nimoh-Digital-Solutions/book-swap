#!/usr/bin/env bash
# BookSwap Sentry Issue Monitor — runs every 4 hours via cron.
# Polls Sentry for new unresolved issues across the BookSwap projects.
# For each first-time-seen issue: log it, send Telegram, AND open a
# GitHub tracking issue (via `gh issue create`) so triage has a
# permanent home outside Sentry's auto-resolve window.
#
# Idempotency: `seen-issues.txt` dedup is the source of truth for "first
# detection" — Sentry's `lastSeen` field bumps on every recurrence, but
# we only ever ping/file once per Sentry shortId. If the alert recurs
# you'll see it in the Sentry event count, not as a new GitHub issue.
#
# To disable the GitHub side-effect, unset BOOKSWAP_GH_REPO in
# ~/.bookswap-monitor-env — the Telegram path keeps running.
#
# Cron entry (offset from top-of-hour to spread cron load):
#   17 */4 * * * /home/gnimoh001/scripts/bookswap-sentry-check.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-sentry.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-sentry-check.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

# Sentry token comes from ~/.sentryclirc (same token used by sentry-cli
# for release management). Org-wide so it covers BookSwap too.
SENTRY_TOKEN=$(grep "^token=" "$HOME/.sentryclirc" 2>/dev/null | cut -d= -f2 || true)
if [[ -z "$SENTRY_TOKEN" ]]; then
  log_msg "ERROR" "no Sentry token in ~/.sentryclirc — aborting"
  exit 1
fi

# These come from ~/.bookswap-monitor-env (sourced via _monitor-lib.sh).
ORG="${BOOKSWAP_SENTRY_ORG:-nimoh-digital-solutions}"
PROJECTS_CSV="${BOOKSWAP_SENTRY_PROJECTS:-bookswap-frontend,bookswap-backend,bookswap-mobile}"
IFS=',' read -ra PROJECTS <<< "$PROJECTS_CSV"

# GitHub repo for auto-filed issues. Empty disables the side-effect.
GH_REPO="${BOOKSWAP_GH_REPO:-}"

# Open a GitHub issue for a fresh Sentry alert. Best-effort: any failure
# (no `gh` on PATH, auth expired, repo not reachable) logs a warning and
# returns 0 so the Telegram path still completes. Idempotency lives at
# the SEEN_FILE layer above — by the time we get here we know this
# short_id has never been processed before.
file_github_issue() {
  local SHORT_ID="$1" TITLE="$2" PROJECT="$3" LEVEL="$4"
  local EVENT_COUNT="$5" USER_COUNT="$6" PERMALINK="$7"

  if [[ -z "$GH_REPO" ]]; then
    return 0
  fi
  if ! command -v gh &>/dev/null; then
    log_msg "WARN" "gh not on PATH — skipping GitHub issue for $SHORT_ID"
    return 0
  fi

  # Truncate title so it fits inside the 256-char GitHub limit even
  # after we prepend the [Sentry] prefix and the short id.
  local SAFE_TITLE="${TITLE:0:200}"
  local ISSUE_TITLE="[Sentry] ${SHORT_ID} — ${SAFE_TITLE}"

  local BODY
  BODY=$(cat <<EOF
> Auto-filed by \`bookswap-sentry-check.sh\` on $(human_date).
> Sentry is the source of truth — close this issue once the underlying
> alert is resolved (or auto-resolved) in Sentry.

| | |
|---|---|
| **Sentry ID** | \`${SHORT_ID}\` |
| **Project** | \`${PROJECT}\` |
| **Level** | \`${LEVEL}\` |
| **Events** | ${EVENT_COUNT} |
| **Users affected** | ${USER_COUNT} |
| **First detected by monitor** | $(human_date) |

[Open in Sentry →](${PERMALINK})

---

### Triage checklist
- [ ] Reproduced locally / on staging
- [ ] Root cause identified
- [ ] Fix merged + deployed
- [ ] Sentry issue marked resolved
EOF
)

  if gh issue create \
      --repo "$GH_REPO" \
      --title "$ISSUE_TITLE" \
      --body "$BODY" \
      --label sentry \
      --label auto \
      > /dev/null 2>&1; then
    log_msg "OK" "filed GitHub issue for $SHORT_ID in $GH_REPO"
  else
    log_msg "WARN" "gh issue create failed for $SHORT_ID (auth? rate-limit? repo gone?)"
  fi
}

API="https://sentry.io/api/0"
STATE_DIR="$MONITOR_STATE/bookswap-sentry"
SEEN_FILE="$STATE_DIR/seen-issues.txt"

mkdir -p "$STATE_DIR"
touch "$SEEN_FILE"

NOW=$(date -u +"%Y-%m-%d %H:%M UTC")
NEW_COUNT=0

for PROJECT in "${PROJECTS[@]}"; do
  # `environment:production` keeps staging / preview / dev issues out of
  # the BookSwap operator channel. The same Sentry projects are shared
  # across environments, so without this filter we'd ping for every
  # staging exception too.
  QUERY=$(printf '%s' 'is:unresolved environment:production' | jq -sRr @uri)
  RESPONSE=$(curl -sf \
    -H "Authorization: Bearer $SENTRY_TOKEN" \
    "$API/projects/$ORG/$PROJECT/issues/?query=${QUERY}&sort=date&limit=25" \
    2>/dev/null || echo "[]")

  COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null || echo "0")
  [ "$COUNT" = "0" ] && continue

  echo "$RESPONSE" | jq -c '.[]' 2>/dev/null | while read -r ISSUE; do
    SHORT_ID=$(echo "$ISSUE" | jq -r '.shortId')
    TITLE=$(echo "$ISSUE" | jq -r '.title')
    LEVEL=$(echo "$ISSUE" | jq -r '.level')
    LAST_SEEN=$(echo "$ISSUE" | jq -r '.lastSeen')
    EVENT_COUNT=$(echo "$ISSUE" | jq -r '.count')
    USER_COUNT=$(echo "$ISSUE" | jq -r '.userCount // 0')
    PERMALINK=$(echo "$ISSUE" | jq -r '.permalink')

    # Skip if already alerted on. The seen file gives at-most-once
    # delivery per issue ID across runs — exactly what we want for
    # Telegram (re-occurrences just bump the event count in Sentry,
    # they don't need a fresh ping).
    if grep -qF "$SHORT_ID" "$SEEN_FILE" 2>/dev/null; then
      continue
    fi
    echo "$SHORT_ID" >> "$SEEN_FILE"

    EMOJI="🔴"
    [ "$LEVEL" = "warning" ] && EMOJI="🟡"
    [ "$LEVEL" = "info" ] && EMOJI="🔵"

    TG_MSG="${EMOJI} *New Sentry issue* — \`${SHORT_ID}\`
${TITLE}

Project: \`${PROJECT}\`
Level: \`${LEVEL}\` · Events: ${EVENT_COUNT} · Users: ${USER_COUNT}
[View in Sentry](${PERMALINK})"

    send_telegram_bookswap "$TG_MSG"

    # Side-effect: open a tracking issue on GitHub. Runs after the
    # Telegram send so a flaky `gh` call never blocks the operator
    # alert; it logs a warning and continues on any failure.
    file_github_issue "$SHORT_ID" "$TITLE" "$PROJECT" "$LEVEL" \
      "$EVENT_COUNT" "$USER_COUNT" "$PERMALINK"
  done

  # The while loop above runs in a subshell (because of the pipe), so
  # variable assignments don't leak out. We instead measure new-issue
  # count by counting NEW lines added to the seen file in this run —
  # captured via timestamp comparison below.
done

# Trim the seen file to the last 5000 issue IDs to keep grep fast and
# disk usage bounded. Old IDs falling off doesn't matter because
# Sentry's auto-resolve usually closes them well before that.
if [[ $(wc -l < "$SEEN_FILE") -gt 5000 ]]; then
  tail -5000 "$SEEN_FILE" > "$SEEN_FILE.tmp" && mv "$SEEN_FILE.tmp" "$SEEN_FILE"
fi

# Always log so the operator can see the script ran and how many issues
# it surfaced. The actual NEW_COUNT can't be tallied here (subshell
# scoping above) so we log the run timestamp and the seen-file size.
SEEN_TOTAL=$(wc -l < "$SEEN_FILE" 2>/dev/null || echo 0)
log_msg "OK" "Sentry check complete. Seen-issues total: ${SEEN_TOTAL}"
