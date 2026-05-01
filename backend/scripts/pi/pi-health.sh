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
# Subset of alerts that also get mirrored to the BookSwap Telegram
# channel because they affect BookSwap availability (OOM risk, disk full,
# unexpected reboot, missing mem cgroup). Routine operational signals
# (CPU temp, docker disk waste, builder cache, external media) stay
# operator-only — those don't move the needle for an end-user.
BOOKSWAP_ALERTS=""

add_alert() { ALERTS="${ALERTS}${1}\n\n"; }
add_alert_critical() {
  ALERTS="${ALERTS}${1}\n\n"
  BOOKSWAP_ALERTS="${BOOKSWAP_ALERTS}${1}\n\n"
}

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
  # Mirrored to BookSwap channel: low memory will OOM-kill bs_* containers.
  add_alert_critical "💾 Memory is running low
   ${MEM_AVAIL} MB available out of ${MEM_TOTAL} MB (${MEM_USED} MB in use)
   Threshold: < ${ALERT_MEM_AVAIL} MB free"
fi

# --- Swap Usage ---
SWAP_TOTAL=$(awk '/SwapTotal/ {print $2}' /proc/meminfo)
SWAP_FREE=$(awk '/SwapFree/ {print $2}' /proc/meminfo)
if (( SWAP_TOTAL > 0 )); then
  SWAP_PCT=$(( (SWAP_TOTAL - SWAP_FREE) * 100 / SWAP_TOTAL ))
  if (( SWAP_PCT > ALERT_SWAP_PCT )); then
    # Mirrored: sustained swap pressure tanks request latency app-wide.
    add_alert_critical "🔄 Swap usage is at ${SWAP_PCT}%
   Threshold: ${ALERT_SWAP_PCT}% — sustained swap means a tenant is leaking
   or the box is over-committed; check \`docker stats\` for the culprit"
  fi
fi

# --- NVMe Disk (/) ---
NVME_PCT=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
if (( NVME_PCT > ALERT_NVME_PCT )); then
  NVME_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
  NVME_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
  # Mirrored: a full NVMe stops Postgres writes, kills logs, breaks deploys.
  add_alert_critical "💿 NVMe disk is ${NVME_PCT}% full
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
# Sum reclaimable bytes via `docker system df --format` (the human-readable
# table puts a percentage like "(71%)" inside parentheses; an earlier regex
# greedily matched THAT instead of the byte value, silently returning 0 and
# making this whole block dead code for months. The new parser uses --format
# which gives one "Reclaimable" value per resource on its own line and is
# stable across docker versions).
docker_reclaimable_bytes() {
  docker system df --format '{{.Reclaimable}}' 2>/dev/null \
    | awk '{
        size = $1
        sub(/[bB]$/, "", size)
        unit = substr(size, length(size), 1)
        num  = substr(size, 1, length(size) - 1) + 0
        if      (unit == "G" || unit == "g") num *= 1073741824
        else if (unit == "M" || unit == "m") num *= 1048576
        else if (unit == "K" || unit == "k") num *= 1024
        else if (unit ~ /[0-9]/)              num = size + 0
        total += num
      } END { printf "%.0f", total + 0 }'
}

if command -v docker &>/dev/null; then
  RECLAIMABLE_BYTES=$(docker_reclaimable_bytes)
  RECLAIMABLE_BYTES="${RECLAIMABLE_BYTES:-0}"

  if (( RECLAIMABLE_BYTES > ALERT_DOCKER_WASTE )); then
    RECLAIM_HUMAN=$(bytes_to_human "$RECLAIMABLE_BYTES")
    log_msg "WARN" "Docker reclaimable space: ${RECLAIM_HUMAN} — auto-pruning"

    # Safe-set prune only — never touch volumes here. A briefly-unused
    # tenant volume during a container restart could be destroyed,
    # taking that project's database with it. Routine cleanup runs in
    # docker-cleanup.sh every 4 h with the same conservative set.
    docker container prune -f > /dev/null 2>&1 || true
    docker image prune -f > /dev/null 2>&1 || true
    docker builder prune -f --keep-storage 2GB > /dev/null 2>&1 || true

    AFTER_RECLAIM=$(docker_reclaimable_bytes)
    FREED=$(( RECLAIMABLE_BYTES - ${AFTER_RECLAIM:-0} ))
    FREED_HUMAN=$(bytes_to_human "$FREED")

    # Only Telegram-alert when the prune actually accomplished something.
    # On this Pi most of the "reclaimable" bytes are old TAGGED images
    # held for rollback (not dangling) and active build cache that's
    # locked — neither gets touched by a default prune. A 100 MB floor
    # is generous enough to skip the noise but catches anything that
    # would matter to an operator.
    MIN_FREED=$((100 * 1024 * 1024))
    if (( FREED >= MIN_FREED )); then
      add_alert "🐳 Docker auto-cleanup ran
   ${RECLAIM_HUMAN} of reclaimable space detected (threshold: 2 GB)
   Freed ${FREED_HUMAN} by pruning images, stopped containers, and old build cache.
   Volumes were not touched (tenant data-loss risk)."
    else
      log_msg "INFO" "Auto-prune freed ${FREED_HUMAN} (< 100 MB) — silent run; \
remaining reclaimable is mostly old tagged images and locked build cache. \
Run docker-cleanup.sh manually with --aggressive if you need that space back."
    fi
  fi
fi

# --- Unexpected Reboot ---
UPTIME_SEC=$(awk '{printf "%.0f", $1}' /proc/uptime)
if (( UPTIME_SEC < REBOOT_WINDOW )); then
  UPTIME_HUMAN=$(seconds_to_human "$UPTIME_SEC")
  # Mirrored: a Pi reboot means BookSwap was down for ~2 min.
  add_alert_critical "🔁 Pi just rebooted
   Uptime is only ${UPTIME_HUMAN} — this may be an unexpected restart"
fi

# --- Memory cgroup sanity ---
# Raspberry Pi OS ships with the memory cgroup disabled by default, which
# silently neuters every Docker `mem_limit:` directive. We added
# `cgroup_enable=memory cgroup_memory=1` to /boot/firmware/cmdline.txt and
# rely on it staying there. If a kernel update or accidental edit ever
# removes it, container memory caps stop being enforced — exactly the kind
# of regression we'd never notice without an explicit check.
#
# Detection has to handle both cgroup versions:
#   - v2 (this Pi, unified hierarchy): controllers in /sys/fs/cgroup/cgroup.controllers
#   - v1 (legacy split hierarchy):     controllers in /proc/cgroups
# A v2 system reports v1 names in /proc/cgroups too, but `memory` only shows
# up there on actual v1 systems — so checking v2 first is the correct order.
MEMORY_CGROUP_OK=0
if [[ -f /sys/fs/cgroup/cgroup.controllers ]] \
   && grep -qw memory /sys/fs/cgroup/cgroup.controllers 2>/dev/null; then
  MEMORY_CGROUP_OK=1
elif grep -q '^memory' /proc/cgroups 2>/dev/null; then
  MEMORY_CGROUP_OK=1
fi
if (( MEMORY_CGROUP_OK == 0 )); then
  # Mirrored: without memory cgroup, BookSwap's mem_limit caps don't apply.
  add_alert_critical "🧱 Memory cgroup is disabled
   Docker mem_limit directives are not being enforced — a single tenant
   leaking RAM can take the Pi down. Check /boot/firmware/cmdline.txt for
   'cgroup_enable=memory cgroup_memory=1' and reboot if missing.
   See docs/SCALING-PLAYBOOK.md → Step 1.1."
fi

# --- Send alerts or log quiet ---
if [[ -n "$ALERTS" ]]; then
  HEADER="⚠️ Pi Health Alert"
  MESSAGE="${HEADER}\n\n${ALERTS}$(footer)"
  send_telegram "$(printf '%b' "$MESSAGE")"

  # Critical subset → BookSwap channel too. Don't mirror the boring
  # operational stuff (temp, docker waste, builder cache) — those
  # don't move the needle for an end-user.
  if [[ -n "$BOOKSWAP_ALERTS" ]]; then
    BS_HEADER="⚠️ *Pi-wide alert affecting BookSwap*"
    BS_MESSAGE="${BS_HEADER}\n\n${BOOKSWAP_ALERTS}$(footer)"
    send_telegram_bookswap "$(printf '%b' "$BS_MESSAGE")"
  fi

  log_msg "ALERT" "Health alert sent (op + bookswap=$([ -n "$BOOKSWAP_ALERTS" ] && echo yes || echo no))"
else
  log_msg "OK" "temp=${TEMP_RAW}°C load=${LOAD5} mem_avail=${MEM_AVAIL}MB nvme=${NVME_PCT}% uptime=${UPTIME_SEC}s"
fi
