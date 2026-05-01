#!/usr/bin/env bash
# Pi System Health Monitor — runs every 15 minutes via cron.
# Checks: CPU temp, load, memory, swap, disk (NVMe + external),
#          Docker disk waste (auto-prune >2GB), unexpected reboot.
#
# Source of truth: this file in the BookSwap repo. The deployed copy at
# ~/scripts/pi-health.sh on the Pi must mirror it. See docs/SCALING-PLAYBOOK.md
# for the rationale on threshold choices and the wider monitoring stack.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_monitor-lib.sh"

ALERT_TEMP=70
# Load > 3.0 sustained means > 75% of the Pi's 4 cores are queued. That's the
# zone where request latency starts climbing visibly; alert before users feel
# it instead of after.
ALERT_LOAD=3.0
ALERT_MEM_AVAIL=1024   # MB
# Swap usage > 60% on a Pi running 5 projects is the canary that one of them
# is leaking or the system is over-committed. Prior threshold (80%) only
# fired after the box was already in trouble.
ALERT_SWAP_PCT=60
ALERT_NVME_PCT=70
ALERT_MEDIA_PCT=90
ALERT_DOCKER_WASTE=$((2 * 1024 * 1024 * 1024))  # 2 GB
REBOOT_WINDOW=600      # seconds

ALERTS=""
add_alert() { ALERTS="${ALERTS}${1}\n\n"; }

# --- CPU Temperature ---
TEMP_RAW=$(vcgencmd measure_temp 2>/dev/null | grep -oP '[0-9.]+' || echo "0")
TEMP=${TEMP_RAW%%.*}
if check_threshold "CPU temp" "$TEMP_RAW" "$ALERT_TEMP"; then
  add_alert "🔥 CPU temperature is ${TEMP_RAW}°C
   Throttle kicks in at 80°C — threshold set to ${ALERT_TEMP}°C"
fi

# --- CPU Load (5-min average) ---
LOAD5=$(awk '{print $2}' /proc/loadavg)
if check_threshold "Load avg" "$LOAD5" "$ALERT_LOAD"; then
  add_alert "⚡ CPU load is high at ${LOAD5}
   5-minute average on 4 cores (threshold: ${ALERT_LOAD})
   This is the early-warning zone — if sustained, request latency will follow"
fi

# --- Memory Available ---
MEM_AVAIL=$(awk '/MemAvailable/ {printf "%.0f", $2/1024}' /proc/meminfo)
if (( MEM_AVAIL < ALERT_MEM_AVAIL )); then
  MEM_TOTAL=$(awk '/MemTotal/ {printf "%.0f", $2/1024}' /proc/meminfo)
  MEM_USED=$(( MEM_TOTAL - MEM_AVAIL ))
  add_alert "💾 Memory is running low
   ${MEM_AVAIL} MB available out of ${MEM_TOTAL} MB (${MEM_USED} MB in use)
   Threshold: < ${ALERT_MEM_AVAIL} MB free"
fi

# --- Swap Usage ---
SWAP_TOTAL=$(awk '/SwapTotal/ {print $2}' /proc/meminfo)
SWAP_FREE=$(awk '/SwapFree/ {print $2}' /proc/meminfo)
if (( SWAP_TOTAL > 0 )); then
  SWAP_PCT=$(( (SWAP_TOTAL - SWAP_FREE) * 100 / SWAP_TOTAL ))
  if (( SWAP_PCT > ALERT_SWAP_PCT )); then
    add_alert "🔄 Swap usage is at ${SWAP_PCT}%
   Threshold: ${ALERT_SWAP_PCT}% — sustained swap means a tenant is leaking
   or the box is over-committed; check \`docker stats\` for the culprit"
  fi
fi

# --- NVMe Disk (/) ---
NVME_PCT=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
if (( NVME_PCT > ALERT_NVME_PCT )); then
  NVME_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
  NVME_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
  add_alert "💿 NVMe disk is ${NVME_PCT}% full
   ${NVME_AVAIL} remaining of ${NVME_TOTAL}
   Threshold: ${ALERT_NVME_PCT}%"
fi

# --- External Media Disk (/mnt/media) ---
if mountpoint -q /mnt/media 2>/dev/null; then
  MEDIA_PCT=$(df /mnt/media | awk 'NR==2 {gsub(/%/,""); print $5}')
  if (( MEDIA_PCT > ALERT_MEDIA_PCT )); then
    MEDIA_AVAIL=$(df -h /mnt/media | awk 'NR==2 {print $4}')
    MEDIA_TOTAL=$(df -h /mnt/media | awk 'NR==2 {print $2}')
    add_alert "📀 External drive is ${MEDIA_PCT}% full
   ${MEDIA_AVAIL} remaining of ${MEDIA_TOTAL}
   Threshold: ${ALERT_MEDIA_PCT}%"
  fi
fi

# --- Docker Disk Waste ---
if command -v docker &>/dev/null; then
  TOTAL_RECLAIM_RAW=$(docker system df 2>/dev/null \
    | awk 'NR>1 {
        match($0, /\(([0-9.]+[kKmMgGtT]?[bB]?)\)/, a);
        if (a[1] != "") {
          val = a[1];
          gsub(/[bB]$/, "", val);
          unit = substr(val, length(val), 1);
          num = substr(val, 1, length(val)-1) + 0;
          if (unit == "G" || unit == "g") num *= 1073741824;
          else if (unit == "M" || unit == "m") num *= 1048576;
          else if (unit == "K" || unit == "k") num *= 1024;
          total += num;
        }
      } END {printf "%.0f", total+0}')

  RECLAIMABLE_BYTES="${TOTAL_RECLAIM_RAW:-0}"

  if (( RECLAIMABLE_BYTES > ALERT_DOCKER_WASTE )); then
    RECLAIM_HUMAN=$(bytes_to_human "$RECLAIMABLE_BYTES")
    log_msg "WARN" "Docker reclaimable space: ${RECLAIM_HUMAN} — auto-pruning"

    docker image prune -f > /dev/null 2>&1 || true
    docker volume prune -f > /dev/null 2>&1 || true

    AFTER_RECLAIM=$(docker system df 2>/dev/null \
      | awk 'NR>1 {
          match($0, /\(([0-9.]+[kKmMgGtT]?[bB]?)\)/, a);
          if (a[1] != "") {
            val = a[1];
            gsub(/[bB]$/, "", val);
            unit = substr(val, length(val), 1);
            num = substr(val, 1, length(val)-1) + 0;
            if (unit == "G" || unit == "g") num *= 1073741824;
            else if (unit == "M" || unit == "m") num *= 1048576;
            else if (unit == "K" || unit == "k") num *= 1024;
            total += num;
          }
        } END {printf "%.0f", total+0}')

    FREED=$(( RECLAIMABLE_BYTES - ${AFTER_RECLAIM:-0} ))
    FREED_HUMAN=$(bytes_to_human "$FREED")
    add_alert "🐳 Docker auto-cleanup ran
   ${RECLAIM_HUMAN} of reclaimable space detected (threshold: 2 GB)
   Freed ${FREED_HUMAN} by pruning dangling images + unused volumes"
  fi
fi

# --- Unexpected Reboot ---
UPTIME_SEC=$(awk '{printf "%.0f", $1}' /proc/uptime)
if (( UPTIME_SEC < REBOOT_WINDOW )); then
  UPTIME_HUMAN=$(seconds_to_human "$UPTIME_SEC")
  add_alert "🔁 Pi just rebooted
   Uptime is only ${UPTIME_HUMAN} — this may be an unexpected restart"
fi

# --- Send alerts or log quiet ---
if [[ -n "$ALERTS" ]]; then
  HEADER="⚠️ Pi Health Alert"
  MESSAGE="${HEADER}\n\n${ALERTS}$(footer)"
  send_telegram "$(printf '%b' "$MESSAGE")"
  log_msg "ALERT" "Health alert sent"
else
  log_msg "OK" "temp=${TEMP_RAW}°C load=${LOAD5} mem_avail=${MEM_AVAIL}MB nvme=${NVME_PCT}% uptime=${UPTIME_SEC}s"
fi
