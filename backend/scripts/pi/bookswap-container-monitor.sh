#!/usr/bin/env bash
# BookSwap Container Monitor — runs every 5 minutes via cron.
# Watches only bs_*_prod containers and reports to the BookSwap Telegram
# channel. Pi-wide container monitoring (sl_*, vgf_*, etc.) is handled by
# the existing ~/scripts/container-monitor.sh which keeps targeting the
# operator channel.
#
# Cron entry:
#   */5 * * * * /home/gnimoh001/scripts/bookswap-container-monitor.sh \
#       >> /home/gnimoh001/monitor-state/bookswap-container.log 2>&1
#
# Source of truth: backend/scripts/pi/bookswap-container-monitor.sh.
# Deployed copy: ~/scripts/bookswap-container-monitor.sh on the Pi.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

STARTS_FILE="$MONITOR_STATE/bookswap-container-starts.txt"

# CPU% threshold — relative to the host (4 cores). 200% = a single
# container using ~half the box. Burst-OK during deploys, sustained
# is what we'd want to know about.
ALERT_CPU=200

# Memory% threshold — relative to the container's own cgroup limit.
# >85% sustained means we're close to OOM-kill on that container.
ALERT_MEM_PCT=85

EXPECTED_CONTAINERS=(
  "bs_web_prod"
  "bs_celery_prod"
  "bs_beat_prod"
  "bs_frontend_prod"
)

ALERTS=""
add_alert() { ALERTS="${ALERTS}${1}\n\n"; }

RUNNING=$(docker ps --format '{{.Names}}' 2>/dev/null || true)

# --- Missing containers ---
for CONTAINER in "${EXPECTED_CONTAINERS[@]}"; do
  if ! echo "$RUNNING" | grep -qx "$CONTAINER"; then
    add_alert "🔴 *${CONTAINER}* is down
   Not found in running containers — check \`docker ps -a\`"
  fi
done

# --- Health status ---
for CONTAINER in "${EXPECTED_CONTAINERS[@]}"; do
  echo "$RUNNING" | grep -qx "$CONTAINER" || continue
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$CONTAINER" 2>/dev/null || echo "unknown")
  if [[ "$STATUS" == "unhealthy" ]]; then
    add_alert "🟡 *${CONTAINER}* is unhealthy
   Docker health check is failing — \`docker logs $CONTAINER --tail 50\`"
  fi
done

# --- Restart detection ---
touch "$STARTS_FILE"
CURRENT_STARTS=""
for CONTAINER in "${EXPECTED_CONTAINERS[@]}"; do
  echo "$RUNNING" | grep -qx "$CONTAINER" || continue
  START=$(docker inspect --format='{{.State.StartedAt}}' "$CONTAINER" 2>/dev/null || echo "")
  [[ -z "$START" ]] && continue
  CURRENT_STARTS+="${CONTAINER} ${START}"$'\n'

  PREV=$(grep "^${CONTAINER} " "$STARTS_FILE" 2>/dev/null | awk '{print $2}' || true)
  if [[ -n "$PREV" && "$PREV" != "$START" ]]; then
    PREV_SHORT=$(iso_to_short "$PREV")
    NOW_SHORT=$(iso_to_short "$START")
    UPTIME_SECS=$(iso_diff_seconds "$PREV" "$START")
    UPTIME_HUMAN=$(seconds_to_human "$UPTIME_SECS")

    add_alert "🔄 *${CONTAINER}* restarted
   Was running since ${PREV_SHORT} → restarted at ${NOW_SHORT}
   (uptime before restart: ${UPTIME_HUMAN})
   Crash-loop indicator: less than 5 m of uptime → check logs immediately"
  fi
done

printf "%s" "$CURRENT_STARTS" > "$STARTS_FILE"

# --- CPU + Memory pressure ---
# `docker stats --no-stream` returns one row per container with values
# like "1.23%" (CPU%) and "289.9MiB / 1.5GiB" (mem usage / limit).
STATS=$(docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemPerc}}' 2>/dev/null || true)

while IFS='|' read -r NAME CPU MEM_PCT; do
  [[ -z "$NAME" ]] && continue
  echo "${EXPECTED_CONTAINERS[*]}" | grep -qw "$NAME" || continue

  CPU_NUM=${CPU//%/}
  CPU_INT=${CPU_NUM%%.*}
  if (( CPU_INT > ALERT_CPU )); then
    add_alert "🔥 *${NAME}* — CPU at ${CPU}
   Sustained > ${ALERT_CPU}% suggests a hot loop or runaway query
   Inspect with \`docker stats $NAME\`"
  fi

  MEM_NUM=${MEM_PCT//%/}
  MEM_INT=${MEM_NUM%%.*}
  if (( MEM_INT > ALERT_MEM_PCT )); then
    add_alert "💾 *${NAME}* — memory at ${MEM_PCT} of cgroup limit
   Threshold ${ALERT_MEM_PCT}% — OOM-kill risk if it keeps climbing
   Either bump \`mem_limit\` or find the leak"
  fi
done <<< "$STATS"

# --- Send or log ---
if [[ -n "$ALERTS" ]]; then
  HEADER="🐳 *BookSwap Container Alert*"
  MESSAGE="${HEADER}\n\n${ALERTS}$(footer)"
  send_telegram_bookswap "$(printf '%b' "$MESSAGE")"
  log_msg "ALERT" "BookSwap container issues detected"
else
  RUNNING_COUNT=$(echo "$RUNNING" | grep -E '^bs_.*_prod$' | wc -l)
  log_msg "OK" "${RUNNING_COUNT}/${#EXPECTED_CONTAINERS[@]} bs_* prod containers running, all healthy"
fi
