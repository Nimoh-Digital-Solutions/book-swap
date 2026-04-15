# BookSwap — Deployment Runbook

Operational guide for deploying **BookSwap** to a **Raspberry Pi 5** with **Docker Compose**, **Cloudflare Tunnel**, and a **self-hosted GitHub Actions** runner. Use this with the canonical app root on the Pi:

```text
/home/gnimoh001/apps/bookswap
```

---

## Architecture (reference)

| Layer | Stack | Notes |
|--------|--------|--------|
| **Backend** | Django 5 ASGI, DRF, Celery + Celery Beat, Gunicorn | PostGIS via PostgreSQL; Redis for cache, Celery, migration lock |
| **Frontend** | React 19 + Vite 7 | Built static assets served by **nginx** in Docker |
| **Mobile** | Expo SDK 54, EAS Build, EAS Update (OTA) | Staging deploys can publish OTA updates to the `staging` branch |
| **Infra** | Pi5, Docker Compose, Cloudflare Tunnel, self-hosted `runs-on: [self-hosted, pi5]` | GitHub Actions workflows drive deploys |

---

## Environments & ports

| Environment | Where | Backend (host) | Frontend (host) | Branches / deploy |
|-------------|--------|----------------|------------------|-------------------|
| **Development** | Your machine | `8070` | `3070` | Local only |
| **Staging** | Pi5 Docker | `8070` | `3070` | `staging` → auto-deploy |
| **Production** | Pi5 Docker | `8071` | `3071` | `production` → auto-deploy (CI must be green) |

**Public URLs (from deploy workflows)**

- Staging API: `https://api-stag.bookswap.app` — Frontend: `https://stag.bookswap.app`
- Production API: `https://api.bookswap.app` — Frontend: `https://bookswap.app`

---

## 1. Prerequisites

### 1.1 Raspberry Pi 5

- Raspberry Pi OS (64-bit) or another supported 64-bit Linux for Pi5
- Adequate storage for Docker images, PostgreSQL data, and logs (monitor disk; see [§11](#11-monitoring))
- Static hostname or DNS for internal use; outbound HTTPS for GitHub, Docker Hub, Cloudflare, Expo

### 1.2 Docker & Docker Compose

Install Docker Engine and Compose plugin (vendor docs). Verify:

```bash
docker --version
docker compose version
```

### 1.3 PostgreSQL with PostGIS

BookSwap expects **PostgreSQL** with the **PostGIS** extension. The database may run:

- On the same Pi (common for self-hosting), or  
- On another host reachable from the Pi (`DATABASE_URL` must be reachable from backend containers)

Create databases and roles for **staging** and **production** separately; do not share credentials across environments.

### 1.4 Cloudflare Tunnel (`cloudflared`)

- Cloudflare account with the zones for `bookswap.app` (and staging subdomains as configured)
- `cloudflared` installed and authenticated (`cloudflared tunnel login`)
- Tunnel configuration mapping public hostnames to **local** services, for example:
  - Staging: HTTP to `127.0.0.1:3070` (frontend) and `127.0.0.1:8070` (API), or a single ingress with path rules — match whatever nginx/API split you use
  - Production: HTTP to `127.0.0.1:3071` and `127.0.0.1:8071`

Typical config location:

```text
~/.cloudflared/config.yml
```

After edits:

```bash
sudo systemctl restart cloudflared
# or your chosen process manager
```

### 1.5 Self-hosted GitHub Actions runner

- Runner labels must include **`self-hosted`** and **`pi5`** (see `.github/workflows/deploy-staging.yml` and `deploy-production.yml`)
- Runner user (e.g. `gnimoh001`) must:
  - Read/write `/home/gnimoh001/apps/bookswap`
  - Run Docker commands (often `docker` group membership)
  - Access secrets configured in GitHub **Environments** (`staging`, `production`)

Install the runner per GitHub documentation; confirm it picks up jobs from the repo.

### 1.6 Tooling on the runner (for mobile OTA)

Staging deploy installs Node and runs `npm ci` / `npx eas-cli` in `mobile/`. Ensure Node 22+ is available where the workflow expects it (the workflow uses `actions/setup-node` for mobile steps).

---

## 2. Environment variables

Authoritative templates live in the repo:

- **Backend:** `backend/.env.example` — copy to `.env` for local/dev; production on the Pi may use a protected file such as `~/envs/bookswap.backend.prod.env` copied to `backend/.env.production` during deploy (see production workflow)
- **Frontend:** `frontend/.env.example` — build-time `VITE_*` variables; Docker builds often receive Sentry DSN via CI secrets

### 2.1 Backend (`backend/.env` or env injected by Compose)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret; unique per environment |
| `DEBUG` | Dev | `False` in staging/production |
| `ALLOWED_HOSTS` | Yes | Comma-separated hosts (API domain, tunnel hostnames, `localhost` as needed) |
| `DATABASE_URL` | Yes | PostgreSQL URL including PostGIS-capable database |
| `REDIS_URL` | Yes | Redis for general use (containers often use `redis://redis:6379/0`) |
| `CELERY_BROKER_URL` | Often set | Broker DB index (e.g. `/1`) |
| `CELERY_RESULT_BACKEND` | Often set | Result backend (e.g. `/2`) |
| `HEALTH_CHECK_CELERY` | Optional | `false` locally without workers; `true` when Celery runs (affects `/api/v1/health/`) |
| `SENDGRID_API_KEY` | Prod email | Required for outbound mail where SendGrid is used |
| `SUPPORT_EMAIL` | Staging/prod | Required by `scripts/check-env.sh` for production/staging settings |
| `NOREPLY_EMAIL` | Staging/prod | Same |
| `CORS_ALLOWED_ORIGINS` | Staging/prod | Frontend origins (HTTPS URLs in prod) |
| `FRONTEND_URL` | Staging/prod | Canonical web app URL (social auth redirects, emails) |
| `TRUSTED_PROXY_IPS` | Optional | Cloudflare / tunnel source IPs for `X-Forwarded-*` |
| `APP_VERSION` | Optional | Surfaced in health/metadata where configured |

**Docker Compose** (`backend/docker-compose.stag.yml`, `backend/docker-compose.prod.yml`) passes through these and sets `DJANGO_SETTINGS_MODULE` per environment.

`scripts/check-env.sh` enforces: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, and for production/staging modules also `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `SUPPORT_EMAIL`, `NOREPLY_EMAIL`.

### 2.2 Frontend (build / nginx container)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Dev: e.g. `http://localhost:8070`. Prod/staging builds often use same-origin `/api/` via nginx — follow `frontend/.env.example` |
| `VITE_WS_URL` | Optional WebSocket base; can be derived from API URL |
| `VITE_APP_TITLE` | App name in UI / PWA |
| `VITE_SENTRY_DSN` | Optional; CI passes `secrets.VITE_SENTRY_DSN_STAGING` / `VITE_SENTRY_DSN_PROD` in deploy workflows |
| `VITE_SENTRY_ENVIRONMENT` | e.g. `staging`, `production` |

Docker Compose for frontend documents:

- `BACKEND_URL` — origin nginx proxies `/api/` and `/ws/` to
- `CSP_CONNECT_SRC` — CSP `connect-src` additions

### 2.3 Mobile (EAS / Expo)

Staging OTA step uses (from `.github/workflows/deploy-staging.yml`):

| Secret / env | Purpose |
|----------------|---------|
| `EXPO_TOKEN` | EAS CLI authentication |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry for OTA-published JS |
| `EXPO_PUBLIC_API_URL_STAGING` | Staging API base for the update bundle |

`mobile/eas.json` defines channels (`staging`, `production`) and `EXPO_PUBLIC_API_URL` per profile.

### 2.4 GitHub Actions (repository secrets)

Examples referenced by workflows:

- `VITE_SENTRY_DSN_STAGING`, `VITE_SENTRY_DSN_PROD`
- `EXPO_TOKEN`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_API_URL_STAGING`

Production workflow copies `~/envs/bookswap.backend.prod.env` to `backend/.env.production` before building — keep that file **outside git** with strict permissions.

---

## 3. First-time setup (Pi)

### 3.1 Clone the repository

```bash
sudo mkdir -p /home/gnimoh001/apps
sudo chown gnimoh001:gnimoh001 /home/gnimoh001/apps
cd /home/gnimoh001/apps
git clone <your-repo-url> bookswap
cd bookswap
```

### 3.2 Configure remotes and branches

```bash
git fetch origin
git checkout staging
git pull origin staging
# Repeat for production when ready
```

The self-hosted runner uses `git reset --hard origin/staging` or `origin/production` — no local commits on the Pi; treat it as a deploy target.

### 3.3 Backend env files

```bash
cd /home/gnimoh001/apps/bookswap/backend
cp .env.example .env
# Edit .env — never commit secrets
```

For production, maintain `~/envs/bookswap.backend.prod.env` and ensure the deploy workflow can copy it to `backend/.env.production` (see `.github/workflows/deploy-production.yml`).

### 3.4 Frontend env (if building locally on Pi)

```bash
cd /home/gnimoh001/apps/bookswap/frontend
cp .env.example .env.local
# Set VITE_* as needed for the target environment
```

### 3.5 Database initialization

On the PostgreSQL host (Pi or elsewhere):

```bash
# Example: create DB and enable PostGIS (exact commands depend on your Postgres setup)
createdb bookswap_staging
psql bookswap_staging -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Point `DATABASE_URL` at this database.

### 3.6 Migrations and superuser

**Option A — rely on container startup (recommended for Docker)**

The backend image runs `start.sh`, which executes `migrate_with_lock.py` before Gunicorn. First deploy after DB exists should apply migrations automatically.

**Option B — manual one-off**

```bash
cd /home/gnimoh001/apps/bookswap/backend
export DJANGO_SETTINGS_MODULE=config.settings.production  # or staging module if present
export DATABASE_URL="postgresql://..."
python manage.py migrate
python manage.py createsuperuser
```

For Docker:

```bash
docker compose -p bs_staging -f docker-compose.stag.yml run --rm web python manage.py createsuperuser
```

Adjust project name (`-p`) and compose file to match your stack.

### 3.7 Shared Docker network (optional FE↔BE)

If frontend nginx must reach the backend by Docker DNS name (`web:8000`):

```bash
cd /home/gnimoh001/apps/bookswap/backend
make network-create
```

Uncomment and align `networks` sections in backend and frontend compose files so both stacks attach to `bookswap-network`.

---

## 4. Deployment flow (automated)

### 4.1 CI on GitHub (`main`)

Workflow: `.github/workflows/ci.yml`

- Runs on **push** and **pull_request** to **`main`**
- Backend: ruff, migrations check, pytest, etc.
- Frontend: type-check, lint, test, build, E2E
- Mobile + shared packages: tests

**Habit:** merge feature work to `main` and wait for CI to pass before promoting to staging/production.

### 4.2 Staging — merge to `staging`

Workflow: `.github/workflows/deploy-staging.yml`

- **Trigger:** push to `staging`, or **workflow_dispatch** with optional “deploy all layers”
- **Runner:** `runs-on: [self-hosted, pi5]`
- **Working directory:** `/home/gnimoh001/apps/bookswap`
- Steps (summary):
  1. `git fetch` + `git reset --hard origin/staging`
  2. Check GitHub **commit status** for CI — **warning only** if not `success` or `pending`
  3. **Detect changes** under `backend/`, `frontend/`, `mobile/` or `packages/shared/` (or force full deploy)
  4. **Backend:** build `backend/docker-compose.stag.yml`, recreate services
  5. **Frontend:** build `frontend/docker-compose.staging.yml`, recreate
  6. **Mobile:** if mobile/shared changed (or manual all): `npm ci` in `mobile/`, then `eas update --branch staging ...`
  7. Health checks on `http://localhost:8070` and `http://localhost:3070`
  8. Smoke: `GET /api/v1/health/`, `/api/v1/books/`, `/api/v1/exchanges/`

### 4.3 Production — merge to `production`

Workflow: `.github/workflows/deploy-production.yml`

- **Trigger:** push to `production`, or workflow_dispatch
- **Runner:** same Pi labels
- **CI gate:** if commit **status** is not **`success`**, the deploy **aborts** (stricter than staging)
- Deploys **backend** and **frontend** only (no mobile OTA in this workflow)
- Copies `~/envs/bookswap.backend.prod.env` → `backend/.env.production` before backend build
- Health: `http://localhost:8071/api/v1/health/`, `http://localhost:3071/`

### 4.4 Mobile OTA (staging)

When the staging workflow publishes an update:

- Branch: **`staging`** (EAS Update)
- Requires `EXPO_TOKEN` and related secrets
- Uses `--no-bytecode` per workflow

Production native builds and production EAS channels follow `mobile/eas.json` and your release process (store submissions are outside this runbook’s auto-deploy).

---

## 5. Manual deployment

Replace project names (`-p`) with `bs_staging` / `bs_prod` and frontend `bs_frontend_staging` / `bs_frontend_prod` if you align with CI.

### 5.1 Pull code

```bash
cd /home/gnimoh001/apps/bookswap
git fetch origin
git checkout staging   # or production
git reset --hard origin/staging
```

### 5.2 Backend — staging

```bash
cd /home/gnimoh001/apps/bookswap/backend
docker compose -p bs_staging -f docker-compose.stag.yml build --no-cache
docker compose -p bs_staging -f docker-compose.stag.yml up -d --force-recreate web celery celery-beat
```

List service names exactly as in the compose file:

```bash
docker compose -f docker-compose.stag.yml config --services
```

### 5.3 Backend — production

```bash
cp ~/envs/bookswap.backend.prod.env /home/gnimoh001/apps/bookswap/backend/.env.production
cd /home/gnimoh001/apps/bookswap/backend
docker compose -p bs_prod -f docker-compose.prod.yml build --no-cache
docker compose -p bs_prod -f docker-compose.prod.yml up -d --force-recreate web celery celery-email celery-maintenance celery-beat
```

### 5.4 Frontend — staging

```bash
cd /home/gnimoh001/apps/bookswap/frontend
docker compose -p bs_frontend_staging -f docker-compose.staging.yml build --no-cache
docker compose -p bs_frontend_staging -f docker-compose.staging.yml up -d --force-recreate
```

### 5.5 Frontend — production

Ensure host port **3071** is mapped on the Pi (align `frontend/docker-compose.prod.yml` or an override if your repo still defaults to another port).

```bash
cd /home/gnimoh001/apps/bookswap/frontend
docker compose -p bs_frontend_prod -f docker-compose.prod.yml build --no-cache
docker compose -p bs_frontend_prod -f docker-compose.prod.yml up -d --force-recreate
```

### 5.6 Mobile OTA (manual)

```bash
cd /home/gnimoh001/apps/bookswap/mobile
npm ci
export EXPO_TOKEN="***"
export EXPO_PUBLIC_SENTRY_DSN="***"
export EXPO_PUBLIC_API_URL="https://api-stag.bookswap.app/api/v1"
npx eas-cli update \
  --branch staging \
  --message "manual OTA $(date -u +'%Y-%m-%d %H:%M')" \
  --no-bytecode \
  --non-interactive
```

---

## 6. Database migrations

### 6.1 How they run in Docker

`backend/start.sh` runs:

```bash
python scripts/migrate_with_lock.py --noinput
```

`migrate_with_lock.py` uses a **Redis advisory lock** (`bookswap:migrate_lock`) so multiple containers do not migrate concurrently. If Redis is unreachable, migrations still run (without lock), with a warning.

### 6.2 Manual migration

```bash
cd /home/gnimoh001/apps/bookswap/backend
docker compose -p bs_prod -f docker-compose.prod.yml exec web \
  python manage.py migrate
```

### 6.3 Failure handling

1. Read **web** container logs — migration errors appear during startup.
2. Fix forward: deploy a migration fix, or adjust DB state only with a reviewed plan.
3. **Lock stuck:** if a deploy crashed, the Redis key may expire after `LOCK_TTL` (600s). If needed, inspect Redis and delete `bookswap:migrate_lock` only when no migration is running.

### 6.4 Rollback strategy

Django does not auto-rollback migrations. Preferred approach:

- **Forward fix:** new migration that reverses schema changes, or restore DB from backup (see [§10](#10-backup--recovery)).
- **Code rollback:** check out previous **git** tag/commit and redeploy **without** running destructive migrations on a newer DB — often inconsistent; prefer restoring DB + code together.

---

## 7. Rollback procedures

### 7.1 Backend

1. Identify last good commit on `staging` or `production`.
2. On the Pi:

```bash
cd /home/gnimoh001/apps/bookswap
git fetch origin
git checkout <branch>
git reset --hard <good-sha>
```

3. Rebuild and recreate containers (same commands as [§5](#5-manual-deployment)).
4. If migrations ran that must be reversed, coordinate with DB restore or a compensating migration — do not assume old code works with new schema.

### 7.2 Frontend

Same git reset + rebuild frontend compose stack. Static assets are in the image; no DB.

### 7.3 Mobile (EAS Update)

- Use **Expo dashboard** to roll back or repoint a channel to a prior update, or publish a new OTA that reverts client logic.
- **Native binaries** require a new store build if native code changed; OTA only applies to JS/assets within compatibility rules.

---

## 8. Health checks

### 8.1 Backend

| Check | URL / command |
|--------|----------------|
| Health endpoint | `GET /api/v1/health/` |
| Staging (Pi) | `curl -sf http://localhost:8070/api/v1/health/` |
| Production (Pi) | `curl -sf http://localhost:8071/api/v1/health/` |
| Public | `curl -sf https://api-stag.bookswap.app/api/v1/health/` or production API URL |

`nimoh_base` monitoring may include version info when `APP_VERSION` is set.

### 8.2 Frontend

| Environment | Check |
|-------------|--------|
| Staging | `curl -sf http://localhost:3070/` |
| Production | `curl -sf http://localhost:3071/` |

Nginx health inside the image may use `/health` on port 8080 internally (see `frontend/docker-compose*.yml`).

### 8.3 Smoke tests (API)

As in CI:

```bash
BASE="http://localhost:8070/api/v1"   # staging
for path in health/ books/ exchanges/; do
  curl -sf -o /dev/null -w "%{http_code} $path\n" "$BASE/$path"
done
```

### 8.4 Celery

Confirm worker and beat containers are `Up` and logs show no crash loops. Health endpoint may reflect Celery when `HEALTH_CHECK_CELERY` is enabled.

---

## 9. Troubleshooting

### 9.1 Container exits immediately

```bash
docker ps -a
docker logs <container_name>
```

Common causes: missing env (`check-env.sh` failure), wrong `DATABASE_URL`, Postgres not listening, PostGIS not installed on DB.

### 9.2 Migration errors

- Inspect web logs during startup.
- Run `showmigrations` inside the container:

```bash
docker compose -p bs_staging -f docker-compose.stag.yml exec web python manage.py showmigrations
```

### 9.3 Migration conflicts (multiple developers)

- On `main`, CI runs `makemigrations --check --dry-run` — fix conflicts before merging.
- If two branches merged incompatible migrations, resolve in a new branch and generate a merge migration.

### 9.4 Port already in use

```bash
sudo ss -tlnp | grep -E '8070|8071|3070|3071'
```

Stop the conflicting process or adjust compose port mappings.

### 9.5 Cloudflare Tunnel down or 502

```bash
sudo systemctl status cloudflared
journalctl -u cloudflared -n 100 --no-pager
```

Verify local backends respond on `127.0.0.1` and tunnel ingress hostnames match TLS/SNI configuration.

### 9.6 GitHub Actions deploy skipped

- **No layer changed:** push-only deploys may skip if no files under `backend/`, `frontend/`, or `mobile/` / `packages/shared/` changed. Use **workflow_dispatch** with “deploy all” on staging when needed.

### 9.7 Production deploy fails “CI has not passed”

Production requires GitHub **commit status** `success`. Ensure the commit was tested on `main` (or whatever your branch protection uses) and required checks are green.

### 9.8 Redis / Celery

```bash
docker compose -p bs_staging -f docker-compose.stag.yml logs redis celery celery-beat
```

### 9.9 Compose service names vs GitHub Actions

`backend/docker-compose.stag.yml` defines services named **`web`**, **`celery`**, and **`celery-beat`**. If the **Deploy — Staging** workflow fails with `no such service: celery_worker` (or similar), the workflow’s `docker compose up` service list is out of sync — align it with:

```bash
docker compose -f /home/gnimoh001/apps/bookswap/backend/docker-compose.stag.yml config --services
```

Manual commands in [§5](#5-manual-deployment) use the names from the compose file.

---

## 10. Backup & recovery

### 10.1 PostgreSQL (logical dump)

Run from a host that can reach the DB (replace connection and filename):

```bash
export PGHOST=...
export PGUSER=...
export PGPASSWORD=...
export PGDATABASE=bookswap_prod
pg_dump -Fc -f "/home/gnimoh001/backups/bookswap_prod_$(date +%Y%m%d_%H%M).dump"
```

Store dumps **off the Pi** (encrypted object storage or another machine).

### 10.2 Restore (example)

```bash
pg_restore --clean --if-exists -d bookswap_prod /path/to/backup.dump
```

Test restores on a **non-production** database first.

### 10.3 Media files

Django serves user uploads from `MEDIA_ROOT` (`mediafiles/` relative to backend per `config/settings/base.py`). If media are on disk on the Pi:

```bash
rsync -avz --delete /path/to/mediafiles/ backup-host:/backups/bookswap-media/
```

If you later add **Docker volumes** for `mediafiles`, back up that volume path instead.

### 10.4 Redis

Usually ephemeral (caches, Celery broker). No backup required for typical BookSwap operation unless you store non-reproducible data in Redis.

---

## 11. Monitoring

### 11.1 Container status

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker compose -p bs_staging -f /home/gnimoh001/apps/bookswap/backend/docker-compose.stag.yml ps
```

### 11.2 Logs

```bash
docker logs -f bookswap-be-web
# or compose:
cd /home/gnimoh001/apps/bookswap/backend && docker compose -p bs_staging -f docker-compose.stag.yml logs -f web
```

Production JSON logging is configured in `config/settings/production.py` for aggregation-friendly output.

### 11.3 Disk space

```bash
df -h
docker system df
```

Prune cautiously:

```bash
docker image prune -a
```

### 11.4 GitHub Actions

Inspect the **Actions** tab for `Deploy — Staging` / `Deploy — Production` and expand failed steps.

---

## 12. Security checklist (pre-deploy)

- [ ] **Secrets:** not in git; production file `~/envs/bookswap.backend.prod.env` permissions restricted (`chmod 600`)
- [ ] **SECRET_KEY:** unique per environment; rotated after any leak
- [ ] **DATABASE_URL:** strong password; DB reachable only from Pi (firewall / bind address)
- [ ] **HTTPS:** public traffic terminates at Cloudflare; `CORS_ALLOWED_ORIGINS` / `FRONTEND_URL` use HTTPS in production
- [ ] **ALLOWED_HOSTS:** only real API hostnames (no wildcards in production unless intentional)
- [ ] **Dependencies:** CI runs `pip-audit` and npm audits — review high-severity items before prod
- [ ] **GitHub:** production environment protected (required reviewers) if available
- [ ] **Tunnel:** authenticated `cloudflared`; dashboard access restricted
- [ ] **Docker:** images rebuilt from known Dockerfiles; avoid pulling untrusted images
- [ ] **Mobile:** `EXPO_TOKEN` scoped; OTA channels match staging vs production

---

## Quick reference — paths & workflows

| Item | Location |
|------|----------|
| App root (Pi) | `/home/gnimoh001/apps/bookswap` |
| Backend compose (staging) | `backend/docker-compose.stag.yml` |
| Backend compose (production) | `backend/docker-compose.prod.yml` |
| Frontend compose (staging) | `frontend/docker-compose.staging.yml` |
| Frontend compose (production) | `frontend/docker-compose.prod.yml` |
| Deploy workflows | `.github/workflows/deploy-staging.yml`, `deploy-production.yml` |
| CI workflow | `.github/workflows/ci.yml` |
| Env template (backend) | `backend/.env.example` |
| Env template (frontend) | `frontend/.env.example` |
| Migration + lock | `backend/start.sh`, `backend/scripts/migrate_with_lock.py` |

---

*This runbook reflects the repository layout and workflows at the time of writing. When in doubt, compare against the latest `.github/workflows/*.yml` and `docker-compose*.yml` files.*
