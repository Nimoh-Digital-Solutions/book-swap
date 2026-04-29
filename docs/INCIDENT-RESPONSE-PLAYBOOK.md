# BookSwap — Incident Response Playbook

> **Owner**: Gnimoh (sole on-call) · **Last reviewed**: 2026-04-29  
> **Cross-ref**: [DEPLOYMENT-RUNBOOK.md](../DEPLOYMENT-RUNBOOK.md) (rollback procedures) · [PRODUCTION-READINESS.md](../PRODUCTION-READINESS.md) (gap tracker)

---

## 1. Severity matrix

| Level | Definition | Example | Target response | Target resolution |
|-------|-----------|---------|-----------------|-------------------|
| **SEV-1** | Full outage — production is unreachable or data is at risk | API returns 5xx for all requests; Pi down; Cloudflare tunnel broken; DB corrupt | 15 min | 1 h |
| **SEV-2** | Major feature broken — core user flows fail for all users | Login fails; book search returns 500; mobile can't connect to WebSocket; push notifications not delivered | 30 min | 4 h |
| **SEV-3** | Degraded — feature broken for a subset of users or non-core path | Map tiles don't load for Android; one language locale broken; email delivery slow | 2 h | 24 h |
| **SEV-4** | Cosmetic / minor — visible bug with no functional impact | Spacing regression; wrong icon; stale cache on one page | Next deploy | Next sprint |

---

## 2. On-call

| Role | Who | How to reach |
|------|-----|--------------|
| Primary on-call | **Gnimoh** | info@nimoh-ict.nl · personal phone |

There is currently one on-call person. Escalation path: fix it yourself, or invoke the escape hatch (roll back + status post) and fix in the next deploy window.

---

## 3. Alert sources

| Source | What it watches | Where to check |
|--------|----------------|----------------|
| **UptimeRobot** (set up PROD-A3) | External HTTP uptime for API + frontend | Email alert → https://uptimerobot.com |
| **Sentry — backend** | Unhandled exceptions, error rate spikes, Celery failures | https://sentry.io/organizations/nimoh-digital-solutions/projects/bookswap-be/ |
| **Sentry — frontend** | Browser JS errors, unhandled promise rejections | https://sentry.io/organizations/nimoh-digital-solutions/projects/bookswap-fe/ |
| **Sentry — mobile** | Native + JS crashes, ANRs, OOM | https://sentry.io/organizations/nimoh-digital-solutions/projects/bookswap-mobile/ |
| **GitHub Actions** | Failed deploy workflow | https://github.com/Nimoh-Digital-Solutions/book-swap/actions |
| **Docker health checks** | Container-level liveness on Pi | `ssh pi5 "docker ps --format 'table {{.Names}}\t{{.Status}}'"` |

---

## 4. First 15 minutes — SEV-1 / SEV-2

Work through this checklist top-to-bottom. Stop at the first positive signal and go to the matching fix section.

```
[ ] 1. Open UptimeRobot — is the API and/or frontend monitor red?
        YES → go to §5.1 (Cloudflare / Pi down)
        NO  → continue

[ ] 2. Open Sentry backend project — filter to production, last 15 min.
        Error spike? New SEV error?
        YES → go to §5.2 (Application error)
        NO  → continue

[ ] 3. Check the failing deploy workflow in GitHub Actions.
        Red deploy job? OTA publish failed?
        YES → go to §5.3 (Bad deploy)
        NO  → continue

[ ] 4. SSH to the Pi and check container health.
        ssh gnimoh001@<pi5-hostname>
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "bookswap|NAMES"
        Any container not "Up" or "healthy"?
        YES → go to §5.4 (Container crashed)
        NO  → continue

[ ] 5. Tail the live backend log for errors.
        cd /home/gnimoh001/apps/bookswap/backend
        docker compose -p bs_prod -f docker-compose.prod.yml logs --tail=100 web
        5xx / exception in the last few minutes?
        YES → go to §5.2 (Application error)
        NO  → continue

[ ] 6. Check disk and memory on the Pi.
        df -h && free -h
        Disk > 90%? Swap used heavily?
        YES → go to §5.5 (Resource exhaustion)
        NO  → continue

[ ] 7. Issue is not yet identified. Escalate wait time to SEV-3, continue investigating
        with longer log windows (last 1 h). Post a holding status message if users are
        reporting issues.
```

---

## 5. Fix procedures

### 5.1 Cloudflare Tunnel / Pi unreachable

```bash
# On the Pi (or via console if SSH is down)
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared   # confirm active

# If Pi itself is unreachable, power-cycle via physical access or Pi remote management.
# After reboot, Docker containers should restart automatically (restart: unless-stopped).
# Verify:
docker ps --format "table {{.Names}}\t{{.Status}}"
```

If the tunnel is up but DNS is wrong: check Cloudflare dashboard → DNS → confirm A/CNAME records for `api.book-swaps.com` and `book-swaps.com` point to the tunnel.

---

### 5.2 Application error (Django / Celery)

```bash
cd /home/gnimoh001/apps/bookswap/backend

# Live logs
docker compose -p bs_prod -f docker-compose.prod.yml logs -f --tail=200 web
docker compose -p bs_prod -f docker-compose.prod.yml logs -f --tail=200 celery

# If a migration is missing (e.g. after a deploy where migration wasn't run):
docker compose -p bs_prod -f docker-compose.prod.yml exec web python manage.py migrate --check
docker compose -p bs_prod -f docker-compose.prod.yml exec web python manage.py migrate
```

If the error is in production code (not infrastructure): invoke the rollback procedure in §6.

---

### 5.3 Bad deploy (failed GitHub Actions job or OTA)

**Native build/deploy failure** — the previous containers are still running (the deploy workflow doesn't tear down until after the new build succeeds). No user impact unless you also removed old containers. Check the workflow logs for the specific step that failed, fix the root cause, and re-trigger.

**OTA update pushed with a bug** (mobile JS-only):

```bash
# Revert by publishing the previous good JS bundle to the production branch.
# From your local machine:
cd mobile
# Identify the last good update group ID from expo.dev → Updates
eas update:republish --branch production --group <good-group-id>
```

If `eas update:republish` is unavailable in your CLI version, publish the reverted code directly:

```bash
git revert HEAD --no-edit
cd mobile
yarn update:production "revert: rollback bad OTA — <description>"
```

---

### 5.4 Container crashed

```bash
cd /home/gnimoh001/apps/bookswap/backend

# Which container exited?
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -v "Up"

# Read its last logs before exit
docker logs bookswap-be-web --tail=100
# or: bookswap-be-celery | bookswap-be-redis | bookswap-be-celery-beat

# Restart the specific container
docker compose -p bs_prod -f docker-compose.prod.yml restart web
# or restart all:
docker compose -p bs_prod -f docker-compose.prod.yml up -d

# Confirm health
docker ps --format "table {{.Names}}\t{{.Status}}"
curl -sf http://localhost:8071/api/v1/health/ && echo "Backend healthy ✓"
```

Common causes: OOM kill (check `dmesg | grep -i oom`); disk full; bad env var after a deploy (check `docker compose config`).

---

### 5.5 Resource exhaustion (disk / memory)

```bash
# Disk — clear Docker build cache and old images
docker system prune -f
# Disk — clear old log files
journalctl --vacuum-time=7d

# Memory — identify top consumers
ps aux --sort=-%mem | head -20

# If Postgres WAL is ballooning, check for long-running transactions:
# (from inside the db container or via psql)
docker compose -p bs_prod -f docker-compose.prod.yml exec web \
  python manage.py dbshell -- \
  -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;"
```

---

## 6. Rollback procedure

Use when a bad deploy has reached production and cannot be hot-fixed. Full procedure is in [DEPLOYMENT-RUNBOOK.md](../DEPLOYMENT-RUNBOOK.md). Summary:

```bash
# 1. Identify the last known-good commit on the production branch
git log origin/production --oneline | head -10

# 2. Revert on production branch (or force-reset to the good SHA)
git revert <bad-commit-sha> --no-edit
git push origin production

# 3. The deploy-production workflow triggers automatically on push.
#    Monitor at: https://github.com/Nimoh-Digital-Solutions/book-swap/actions

# 4. Verify health after deploy
curl -sf https://api.book-swaps.com/api/v1/health/ && echo "✓"
curl -sf https://book-swaps.com/ | grep -o "<title>.*</title>"
```

Target rollback time: ≤ 10 minutes from decision to healthy production.

---

## 7. Mobile-specific incidents

### App crashes on launch (after a bad OTA)

Users on the production EAS channel will receive the bad JS bundle. Fix:

1. Identify the bad update group in the Expo dashboard → Updates → production branch.
2. Republish the last good group (see §5.3).
3. Clients auto-fetch the fix on next foreground + network check (expo-updates default: check on launch).
4. If the crash is in native code (not JS), a new EAS build + store re-submission is required — there is no OTA fix path. Invoke the SEV-1/2 comms template below.

### Push notifications not delivered

```bash
# Check Expo push notification receipts
# Backend: look for failed push tasks in Celery logs
docker compose -p bs_prod -f docker-compose.prod.yml logs celery | grep -i "push\|notification\|expo"

# Check APNs / FCM credentials in Expo dashboard:
# https://expo.dev/accounts/info_nimoh/projects/bookswap/credentials
```

---

## 8. Communication template

Post in internal channel (or email if no channel) within 15 min of SEV-1/2 detection.

**Initial post**

```
[INCIDENT SEV-X] <one-line description>
- Detected: HH:MM UTC
- Impact: <who/what is affected>
- Status: Investigating
- Next update: HH:MM UTC (15 min)
```

**Resolution post**

```
[RESOLVED SEV-X] <one-line description>
- Resolved: HH:MM UTC  
- Duration: X min
- Root cause: <brief>
- Fix applied: <brief>
- Follow-up actions: <link to postmortem or issue>
```

---

## 9. Postmortem template

Create `docs/postmortems/YYYY-MM-DD-<slug>.md` within 48 h of resolution.

```markdown
## What happened
<Timeline of events, including when the issue was introduced vs when detected.>

## Detection
<How was it detected? User report, alert, monitoring? Time from introduction to detection.>

## Response
<Steps taken, by whom, in what order. What worked, what didn't.>

## Impact
<Users affected, features broken, duration.>

## Root cause
<Technical root cause. Why did this happen?>

## Contributing factors
<Anything that made this worse or harder to detect.>

## Action items
| Action | Owner | Due |
|--------|-------|-----|
| | | |

## Lessons learned
<What did this incident teach us?>
```

---

## 10. Useful one-liners (bookmark these)

```bash
# Full container status on Pi
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "bookswap|NAMES"

# Backend health check
curl -sf https://api.book-swaps.com/api/v1/health/ | python3 -m json.tool

# Backend logs (live)
ssh pi5 "cd /home/gnimoh001/apps/bookswap/backend && docker compose -p bs_prod -f docker-compose.prod.yml logs -f --tail=100 web"

# Celery task queue depth (Redis)
ssh pi5 "docker exec bookswap-be-redis redis-cli llen celery"

# Disk usage
ssh pi5 "df -h / && docker system df"

# Recent DB connections
ssh pi5 "docker compose -p bs_prod -f docker-compose.prod.yml exec web python manage.py dbshell -- -c 'SELECT count(*), state FROM pg_stat_activity GROUP BY state;'"

# Trigger manual production deploy (from GitHub Actions UI or):
gh workflow run deploy-production.yml --ref production
```

---

*Updated by: Gnimoh · 2026-04-29 · Created from PRODUCTION-READINESS.md Track A (PROD-A5)*
