# BookSwap Scaling Playbook — Pi 5 production

> **Status**: living document
> **Owner**: solo operator
> **Last reviewed**: 2026-05-01 (T+1 after launch)
> **Audience**: future-you, when traffic starts climbing and you have to make a call

This is the document I wished I had on day one. It captures **what BookSwap currently runs on, where the bottlenecks are, what we already did to buy headroom, and the precise triggers that should make us move to the next rung of the ladder**. It is deliberately opinionated — when traffic actually arrives you will not have time to research.

---

## TL;DR

- BookSwap runs on a **single Raspberry Pi 5 (16 GB RAM, 4 cores, NVMe)** that also hosts SpeakLinka, Vineyard Group, Nimoh Digital, BeBase, and a couple of test apps. Everyone shares one host Postgres and one Redis.
- **Today's headroom is fine** (load 0.36 / 4 cores, 9.9 GB RAM available, 19% NVMe used). The Pi is not the bottleneck — the architecture around the Pi is.
- The bottlenecks that will bite first (in order): **(1) noisy-neighbour starvation**, (2) Postgres ceiling on a single host, (3) cold-cache asset traffic, (4) Celery serialising fan-outs, (5) lack of redundancy.
- Step 1 (this commit) closes (1), (4), and adds the visibility we need to spot (2) and (3) early. It cost a few hours, no money, and is fully reversible.
- The next steps cost real money and real focus — only take them when the **trigger conditions** below are tripped.

---

## Current production topology

```
                     Cloudflare (DNS + WAF + CDN)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            book-swaps.com         api.book-swaps.com
            (cf-cache HIT          (cf BYPASS — passes
             on /assets/*)          through to origin)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                  Cloudflare Tunnel (no open ports)
                              │
                ┌─────────────┼─────────────────────────┐
                ▼             ▼                         ▼
          bs_frontend_prod  bs_web_prod              bs_celery_prod
          (nginx + SPA)    (gunicorn x8 + uvicorn)   (4 workers)
                              │                         │
                              └────────┬────────────────┘
                                       ▼
                            redis_shared (one container,
                            16 logical DBs, all tenants)
                                       │
                                       ▼
                        Host Postgres 17 (one cluster,
                        one disk, 11 databases)
```

**Key facts**

- All five projects share **one host Postgres cluster** and **one Redis container** (`redis_shared`).
- BookSwap uses Redis logical DBs `14/15/4` (cache / broker / result backend).
- Postgres data lives on the Pi's internal NVMe; user uploads live on `/mnt/media` (external SSD).
- BookSwap traffic enters via Cloudflare Tunnel → nginx (SPA static + reverse proxy) → gunicorn 8-worker WSGI for HTTP, uvicorn for WebSockets via the same `start.sh`.
- Outbound email goes via SendGrid; push goes via Expo's HTTPS endpoint (no inbound open).

---

## Bottleneck inventory (in priority order)

### 1. Noisy-neighbour starvation — _addressed Step 1_

**The problem.** Compose's `deploy.resources.limits.memory` is silently ignored in standalone (non-Swarm) mode. Verified with `docker inspect bs_web_prod --format '{{.HostConfig.Memory}}'` → returned `0`. If SpeakLinka leaked, it could have OOM-killed BookSwap and there was nothing stopping it.

**The fix (Step 1.1).** Replaced every `deploy.resources.limits` block in BookSwap compose files with the top-level keys (`cpus`, `mem_limit`, `mem_reservation`). CPU caps activated on redeploy. Memory caps surfaced a deeper issue: the Pi's kernel had the **memory cgroup disabled** (Raspberry Pi OS default — `docker info` printed `WARNING: No memory limit support`). Added `cgroup_enable=memory cgroup_memory=1` to `/boot/firmware/cmdline.txt`, rebooted the Pi, and force-recreated the bs_* prod containers so they picked up the compose limits.

Result (verified live): `docker stats` reports real `MEM USAGE / LIMIT` figures on every container — `bs_web_prod 290 MiB / 1.5 GiB`, `bs_celery_prod 363 MiB / 1 GiB`, etc. Every project on the Pi gets memory accounting now, not just BookSwap.

**The trigger to revisit.** If a Sentry "transaction p95 latency > 1.5 s" alert fires AND `docker stats bs_web_prod` shows MemUsage at the cap, raise `mem_limit` first; if CPU is also pinned, that's your signal to look at Step 2 (move Postgres) or Step 3 (separate VM).

---

### 2. Postgres on a single shared host

**The problem.** All 11 databases (BookSwap prod + staging, plus 4 other projects' prod + staging + test) live in one Postgres 17 cluster on one disk. There is no read replica, no automated failover, no point-in-time recovery beyond `pg_dump`. A bad query in any tenant blocks everyone. A disk failure on the Pi takes _all_ apps down.

**Today's mitigation.** `pg_stat_statements` is now enabled on `bs_prod` and `bs_staging`. We can ask the database "what queries are eating my CPU?" with one psql command (see Runbook below). This was the missing piece — previously you could only see Postgres health from the outside.

**The trigger.** Move BookSwap to a managed Postgres (DigitalOcean, Supabase, or Neon free tier) **the moment any of these is true**:

- `pg_stat_statements` shows a single query > 30% of total time spent and you cannot fix it.
- Sentry shows DB connection pool exhaustion (`OperationalError: too many connections`).
- A second project on the same Pi has an outage caused by Postgres load spikes.
- You sign your first paying B2B customer and need an SLA you cannot personally guarantee at 3am.

Cost: $15–$25/mo for managed Postgres; ~2h migration window during a low-traffic Tuesday morning.

---

### 3. Cold-cache asset traffic

**The problem.** Every uncached asset request hits the Pi through Cloudflare Tunnel. If Cloudflare doesn't aggressively cache, you're paying tunnel bandwidth + nginx CPU for files that never change.

**Today's state — verified live.** Hashed assets (`/assets/*-<hash>.js`, `.css`) return:

```
cache-control: public, max-age=31536000, immutable
cf-cache-status: HIT
```

So Cloudflare _is_ caching them with a year-long TTL. The SPA `index.html` correctly returns `no-cache` so users always pick up new builds. **No action required today.** If you ever migrate to a different CDN or add image-heavy endpoints, re-verify with the curl probe in Runbook.

**The trigger.** If `bs_frontend_prod` CPU% climbs past ~10% sustained on the ops-digest snapshot, something is bypassing CF cache. Inspect with `cf-cache-status` headers on the suspicious URL.

---

### 4. Celery worker concurrency — _addressed Step 1_

**The problem.** With `--concurrency=2`, fan-out tasks (push notifications to many devices, batch emails) serialised. After 100 users, a single push fan-out for "new exchange request" could block other emails for tens of seconds.

**The fix (Step 1.2).** Bumped `--concurrency=2` → `--concurrency=4` in `bs_celery_prod`. The Pi has 4 cores; matching concurrency to cores is the standard rule of thumb for I/O-bound tasks (which all of BookSwap's are — they're hitting Redis, Postgres, SendGrid, or Expo). The new memory cap (1 GB) leaves 256 MB per worker, comfortably above what they need.

**The trigger to go further.** If Celery queue depth (`celery -A config.celery inspect active_queues` shows backlog > 100) is sustained for > 5 minutes during normal traffic, split the worker into two containers: one for `email,maintenance` (slow, can wait) and one for `default,celery` (user-facing, must be fast). That's a 30-minute compose change, not a rewrite.

---

### 5. Lack of redundancy

**The problem.** The Pi is a single point of failure. If it dies, BookSwap is down until we either (a) restore from backup onto a new device or (b) repair the Pi. There's no DNS failover, no warm standby, no read replica.

**Today's state.** Daily `pg_dump` backups go to `/mnt/media/backups` (external SSD). Last restore drill: never. Sentry will tell us within 60s that the Pi is unreachable. The recovery procedure is documented in `docs/production-launch-action-plan.md` Track A row "DR plan".

**The trigger.** Move to a redundant host (Hetzner CX21, DO basic droplet, or a second Pi as cold standby) **the moment**:

- Pi has had 2+ unplanned reboots in a month (check `pi-health.sh` reboot alerts in Telegram).
- You have paying users with an SLA expectation.
- BookSwap user count > 1,000 active monthly users.

Cost: $5–$10/mo for a small VPS as cold-standby with rsync replication; significantly more for hot standby.

---

## The scaling ladder

These rungs go in order. Don't skip rungs. Each one buys you the visibility to know whether the next is needed.

| Rung | Action | Cost ($/mo) | When | Effort |
|------|--------|-------------|------|--------|
| **1** | **Today's tuning** (this commit) — cgroup limits, Celery=4, pg_stat_statements, lower pi-health thresholds, Pi snapshot in ops digest | 0 | Now | done |
| **2** | Move Postgres to managed (Neon free tier or DO managed) | 0–25 | Trigger 2.1, 2.2, or 2.3 above | ~2 h migration |
| **3** | Move BookSwap stack to its own VPS (Hetzner CX21 or DO 2GB) | 5–10 | Pi noisy-neighbour incidents > 1/month | ~4 h migration |
| **4** | Add Postgres read replica + cold-standby VPS for BookSwap | +5 | Paying users on SLA, or > 1k MAU | ~1 day |
| **5** | Move object storage off `/mnt/media` to S3-compatible (Cloudflare R2, MinIO already scaffolded) | 0–5 | `/mnt/media` > 100 GB or media access becomes hot | ~1 day |
| **6** | Horizontal-scale gunicorn behind a load balancer | $$ | Real revenue, real users, real on-call | weeks |

You should not be on rung 6 without a co-founder.

---

## What we did today (Step 1 — 2026-05-01)

The five immediate, low-cost actions, with what was changed and how it's verified:

### 1.1 Resource caps that actually apply

- **Files**: `backend/docker-compose.{prod,stag}.yml`, `frontend/docker-compose.{prod,staging}.yml`
- **Change**: replaced `deploy.resources.limits` (silently ignored in standalone Compose) with `cpus`/`mem_limit`/`mem_reservation` (top-level, the modern v2 idiom).
- **Kernel-level fix**: appended `cgroup_enable=memory cgroup_memory=1` to `/boot/firmware/cmdline.txt` (backup at `/boot/firmware/cmdline.txt.bak-YYYYMMDD`), rebooted the Pi, force-recreated the bs_* prod containers. Raspberry Pi OS ships with the memory cgroup disabled by default; without this arg every `mem_limit:` is a no-op regardless of Compose flags.
- **Verify after the reboot**:
  ```bash
  ssh piserver
  grep memory /sys/fs/cgroup/cgroup.controllers   # cgroups v2: must list `memory`
  docker info 2>&1 | grep -i memory               # must NOT say 'No memory limit support'
  docker inspect bs_web_prod --format '{{.HostConfig.Memory}}'  # 1610612736
  docker stats --no-stream                                       # MEM USAGE / LIMIT shows real numbers
  ```
- **Sized for the workload**:

  | Container         | CPU  | Memory  | Why                                                                  |
  | ----------------- | ---- | ------- | -------------------------------------------------------------------- |
  | `bs_web_prod`     | 2.0  | 1536 MB | 8 gunicorn workers × ~150 MB peak ≈ 1.2 GB; cap leaves ~25% headroom |
  | `bs_celery_prod`  | 1.5  | 1024 MB | concurrency=4 (was 2); each worker ~150 MB + buffer for fan-outs     |
  | `bs_beat_prod`    | 0.25 | 256 MB  | Beat is a single small process                                       |
  | `bs_frontend_prod`| 0.5  | 256 MB  | nginx serving static SPA — sized to be shockingly small              |

  Total prod budget: **4.25 CPU-shares, 3.0 GB** on a 16 GB / 4-core Pi. CPU values are caps, not reservations.
- **Rollback**: `git revert` + `docker compose up -d --force-recreate` removes the compose limits; `sudo cp /boot/firmware/cmdline.txt.bak-* /boot/firmware/cmdline.txt && sudo reboot` removes the kernel-level fix.

### 1.2 Celery concurrency 2 → 4

- **File**: `backend/docker-compose.prod.yml`
- **Change**: `--concurrency=2` → `--concurrency=4` for `bs_celery_prod` only (staging stays at 2 because traffic is trivial there).
- **Verify**: `ssh piserver "docker exec bs_celery_prod celery -A config.celery inspect stats | grep concurrency"`.
- **Reversible?** Yes — one-line change, redeploy.

### 1.3 `pg_stat_statements` enabled

- **Action**: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` on `bs_prod` and `bs_staging`. The host's `shared_preload_libraries = pg_stat_statements` was already configured.
- **Verify**: `ssh piserver "sudo -u postgres psql -d bs_prod -c 'SELECT extname, extversion FROM pg_extension WHERE extname=\\'pg_stat_statements\\';'"` returns `1.11`.
- **Reversible?** Yes — `DROP EXTENSION pg_stat_statements;`. Costs roughly nothing in steady state.

### 1.4 Cloudflare cache verified (no change needed)

- Origin already returns `cache-control: public, max-age=31536000, immutable` for `/assets/*` and `no-cache` for `index.html`.
- Cloudflare honours these by default — `cf-cache-status: HIT` confirmed.
- No action taken; documented for future-you so you don't re-verify needlessly.

### 1.5 Earlier-warning thresholds + capacity snapshot

- **File**: `backend/scripts/pi/pi-health.sh` (host copy at `~/scripts/pi-health.sh`)
  - `ALERT_LOAD`: 3.5 → 3.0 (alert when ≥ 75% of 4 cores queued, before users feel it)
  - `ALERT_SWAP_PCT`: 80 → 60 (sustained swap > 60% means a tenant is leaking; previous threshold only fired after the box was already in trouble)
- **File**: `backend/scripts/pi/bookswap-ops-digest.sh` (host copy at `~/scripts/bookswap-ops-digest.sh`)
  - Appended a "Pi resource snapshot" section to every 4-hourly Telegram digest: load, mem%, swap%, temp, NVMe%, and bs\_\* container CPU% sum. This is the **trend** signal pi-health doesn't give us — pi-health pages on hot conditions; the digest shows drift over time.
- **Verify**: `ssh piserver "~/scripts/bookswap-ops-digest.sh"` should send a Telegram message that ends with the new "🖥 Pi resource snapshot" block.
- **Reversible?** Yes — restore from git.

---

## Runbook — quick commands when something feels off

```bash
# Where is the heat right now? (run on the Pi)
docker stats --no-stream

# What's eating Postgres CPU?
ssh piserver
sudo -u postgres psql -d bs_prod -c "
  SELECT round(total_exec_time::numeric, 2) AS total_ms,
         calls,
         round(mean_exec_time::numeric, 2) AS mean_ms,
         left(query, 120) AS query
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10;"

# Is the Celery queue backed up?
docker exec bs_celery_prod celery -A config.celery inspect active_queues
docker exec bs_celery_prod celery -A config.celery inspect stats \
  | grep -E "concurrency|total"

# Are the cgroup limits actually in effect?
docker inspect bs_web_prod --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}'
# expect (after the cgroup-memory reboot):  1610612736 2000000000   (1.5 GB, 2 CPU)
# until the reboot:                         0 2000000000             (CPU only)
# If Memory shows 0 long-term, double-check the kernel:
#   grep memory /proc/cgroups            # must show a `memory` row
#   docker info 2>&1 | grep -i memory   # must NOT say 'No memory limit support'

# Is Cloudflare caching what we think it's caching?
curl -sI "https://book-swaps.com/assets/$(curl -s https://book-swaps.com/ \
  | grep -oE 'assets/index-[^"]+\.js' | head -1)" \
  | grep -iE 'cache-control|cf-cache-status'
# expect: cache-control: public, max-age=31536000, immutable
#         cf-cache-status: HIT (after the second request)

# Reset pg_stat_statements after investigating (so the next look is fresh)
sudo -u postgres psql -d bs_prod -c "SELECT pg_stat_statements_reset();"
```

---

## Things that are NOT bottlenecks (don't be tricked)

- **NVMe disk speed.** Pi 5's NVMe does ~1 GB/s read; we're nowhere near it. Do not optimise here.
- **Pi temperature.** With the active cooler we sit at ~49°C. Throttling kicks in at 80°C. We have a 31°C buffer.
- **Network.** Cloudflare Tunnel + the Pi's gigabit ethernet handle far more than current traffic.
- **Python performance.** ASGI + gunicorn is appropriate for this scale. Do not rewrite in Go because someone on Hacker News told you to.

The thing that **will** bite first is operational, not technical: an incident at 3am while you're solo on-call. The scaling ladder above is sequenced to delay that moment as cheaply as possible.

---

## How to update this document

Append a dated entry to "What we did" each time you take a rung. Don't rewrite history — future-you wants to see the order things happened in. If a trigger fires and you decide _not_ to act, write down why; that is just as important as the action.
