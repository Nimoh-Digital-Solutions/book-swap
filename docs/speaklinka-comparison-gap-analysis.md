# BookSwap vs SpeakLinka: Gap Analysis & Setup Plan

> **Date:** 2026-04-15
> **Last updated:** 2026-04-15
> **Purpose:** Compare BookSwap against the more mature SpeakLinka project to identify missing pieces and plan how to bring BookSwap to parity (and beyond).

---

## What SpeakLinka Is

SpeakLinka is a **two-sided marketplace** connecting French-speaking learners (West Africa) with English conversation partners. It features subscriptions, live video sessions (Agora / Google Meet), payments (Paystack + RevenueCat), and is hosted on a **Pi5 + Cloudflare Tunnel**.

It is the most mature nimoh-stack project — **four layers**: backend, frontend, mobile (Expo), and a shared package (`packages/shared/`).

### SpeakLinka Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Django 5 ASGI + DRF + nimoh-be-django-base 0.8.1, Channels, Celery, PostgreSQL, Redis, SendGrid, Agora token builder, Google Calendar/Meet API, Paystack, RevenueCat |
| Frontend | React 19 + Vite 7 + TypeScript, TanStack Query v5, Zustand v5, React Router 7, i18next (locale-prefixed routes), Tailwind v4, Sentry, PWA (Workbox injectManifest), Playwright E2E |
| Mobile | Expo SDK 54 + React Native 0.81 (New Arch), React Navigation, TanStack Query, Zustand, Agora RTC, RevenueCat, expo-notifications, expo-secure-store, PostHog, Sentry, EAS Build/Update |
| Shared | `@speaklinka/shared` — Zod schemas, TypeScript types, constants, i18n JSON |
| Infra | Docker Compose (dev/staging/prod per layer), Pi5 self-hosted runner, Cloudflare Tunnel, MinIO (object storage), GitHub Actions CI/CD |

---

## Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0 — Monorepo Foundation | ✅ Complete | 5/5 tasks |
| Phase 1 — Backend Hardening | ✅ Complete | 8/8 tasks |
| Phase 2 — Frontend Parity | ✅ Complete | 6/6 tasks |
| Phase 3 — Mobile App (Expo) | ✅ Complete | 9/9 tasks |
| Phase 4 — Production Polish | ✅ Complete | 8/8 tasks |

---

## Gap Analysis: What BookSwap Is Missing

### Legend

- ✅ BookSwap has this (done)
- ⚠️ BookSwap has a partial version (remaining work noted)
- ❌ BookSwap is missing this entirely

---

### 1. Mobile App (React Native / Expo)

| Item | Status | Notes |
|------|--------|-------|
| `mobile/` directory | ✅ | Full Expo SDK 54 + RN 0.81 app with SpeakLinka-parity architecture: navigation, auth, push, deep linking, biometric gate, Sentry, EAS Build/Update. *Completed in Phase 3.* |
| Mobile CI (type-check + lint + Jest) | ✅ | `ci.yml` includes mobile job with type-check, lint, and Jest. *Completed in Phase 3 + 4.* |
| Mobile deploy (EAS OTA) | ✅ | `deploy-staging.yml` publishes OTA updates via `eas-cli update`. *Completed in Phase 4.* |

### 2. Shared Package (`packages/shared/`)

| Item | Status | Notes |
|------|--------|-------|
| `packages/shared/` with Zod schemas | ✅ | Zod schemas, TypeScript types, constants, and shared translations. *Completed in Phase 0.* |
| Metro config for shared resolution | ✅ | Mobile `metro.config.js` uses `watchFolders` + `nodeModulesPaths`. *Completed in Phase 3.* |
| Vite alias for shared | ✅ | Frontend maps `@shared/*` → `../../packages/shared/src/*`. *Completed in Phase 0.* |

### 3. Monorepo Root Orchestration

| Item | Status | Notes |
|------|--------|-------|
| Root `package.json` | ✅ | Orchestrates install/dev/test/lint/type-check for all layers. *Completed in Phase 0.* |
| Root `README.md` | ✅ | Architecture diagram (Mermaid), quick start, repo layout. *Completed in Phase 0.* |
| Root `AGENTS.md` | ✅ | Project-level AGENTS.md covering all layers. *Completed in Phase 0.* |
| Root `Makefile` | ✅ | Expanded with quality checks for all layers (`check-backend`, `check-frontend`, `check-shared`). *Updated in Phase 0.* |
| `CONTRIBUTING.md` | ✅ | Contribution guidelines. *Completed in Phase 0.* |
| `DESIGN.md` (root) | ⚠️ | BookSwap has `frontend/src/styles/DESIGN.md` only; root-level design doc not yet created |

### 4. Production & Operations Documentation

| Item | Status | Notes |
|------|--------|-------|
| `PRODUCTION-READINESS.md` | ✅ | Living audit with 10 scored dimensions (3.3/5 overall), dated, prioritized next actions. *Completed in Phase 4.* |
| `APP-AUDIT.md` | ❌ | Sprint-backlog-style audit tracking; not yet created |
| `security-action-plan.md` | ✅ | SEC-001 through SEC-010 with severity, status, risk, and fix steps. *Completed in Phase 4.* |
| `docs/adr/` (Architecture Decision Records) | ✅ | 5 ADRs: JWT cookies, PostGIS/GeoDjango, Celery queue separation, UUID PKs, factory_boy. *Completed in Phase 1.* |
| `important-docs/` | ✅ | Product overview, feature catalogue, README index. *Completed in Phase 4.* |
| Deployment runbook | ✅ | Full `DEPLOYMENT-RUNBOOK.md`: Pi5 setup, env vars, migrations, rollback, health checks, troubleshooting, backups, monitoring, security checklist. *Completed in Phase 4.* |
| `docs/already-implemented/` | ❌ | Archive of completed plans; not yet created |

### 5. Backend Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| `backend/scripts/entrypoint.sh` | ✅ | Docker entrypoint with env validation. *Completed in Phase 1.* |
| `backend/scripts/check-env.sh` | ✅ | Validates required env vars per settings module. *Completed in Phase 1.* |
| `backend/scripts/migrate_with_lock.py` | ✅ | Redis advisory lock prevents concurrent migration runs. *Completed in Phase 1.* |
| `backend/config/gunicorn.py` | ✅ | UvicornWorker config with CPU-based worker count. *Completed in Phase 1.* |
| `backend/start.sh` | ✅ | Chains check-env → migrate_with_lock → collectstatic → gunicorn. *Completed in Phase 1.* |
| Celery queue separation | ✅ | Separated into `default`, `email`, `maintenance` queues. *Completed in Phase 1.* |
| Custom security headers middleware | ✅ | `BookSwapSecurityHeadersMiddleware` with admin CSP override. *Completed in Phase 1.* |
| `docker-compose.staging.yml` | ✅ | Both have staging compose |
| `docker-compose.prod.yml` | ✅ | Both have production compose |

### 6. Frontend Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Locale-prefixed routes (`/:lng`) | ✅ | `/:lng` prefix with `LanguageSync`. *Completed in Phase 2.* |
| Multiple FE docker-compose files | ✅ | dev + staging + prod compose. *Completed in Phase 2.* |
| HTTPS in dev (mkcert) | ✅ | `vite-plugin-mkcert` for local HTTPS. *Completed in Phase 2.* |
| nginx config with CSP templating | ✅ | `security_headers.conf` with `CSP_CONNECT_SRC` and `BACKEND_URL` env templating. *Completed in Phase 2.* |
| `auth-app/` secondary app | ✅ | Both have it |
| PWA custom service worker | ✅ | Both use Workbox `injectManifest` |
| Bundle analysis + compression | ✅ | Both have rollup visualizer + gzip/brotli compression |
| Playwright E2E | ⚠️ | BookSwap has 3 specs; expanding coverage is tracked in PRODUCTION-READINESS.md §7 |

### 7. CI/CD Pipeline

| Item | Status | Notes |
|------|--------|-------|
| Root `ci.yml` testing ALL layers | ✅ | Tests BE + FE + Mobile + Shared + E2E (Playwright). PostGIS image for GeoDjango. *Fixed in Phase 4 (speaklinka refs → bookswap).* |
| Backend coverage threshold in CI | ✅ | `--cov-fail-under=80` enforced. *Already present; verified in Phase 4.* |
| Bundle size gate in CI | ✅ | Fails CI if main JS chunk exceeds 200KB gzipped. *Already present; verified in Phase 4.* |
| `pip-audit` in CI | ✅ | Runs `pip-audit --strict --desc` in backend job. *Already present; verified in Phase 4.* |
| Deploy workflows with health checks | ✅ | Both staging and production workflows ping health endpoints + run smoke tests on BookSwap-specific API routes. *Rewritten in Phase 4 (speaklinka paths → bookswap).* |
| Shared package CI | ✅ | Dedicated `shared` job in `ci.yml`. *Completed in Phase 0 + 4.* |
| Mobile CI | ✅ | Dedicated `mobile` job in `ci.yml` (type-check + lint + test). *Completed in Phase 3 + 4.* |

### 8. Infrastructure (`infra/`)

| Item | Status | Notes |
|------|--------|-------|
| `infra/` directory | ✅ | README, MinIO docker-compose (planned), backup.sh script. *Completed in Phase 4.* |
| Object storage (MinIO / S3) | ⚠️ | `docker-compose.minio.yml` scaffolded but not wired into the app yet; `django-storages[s3]` integration pending |

---

## Can BookSwap Be More Polished Than SpeakLinka?

**Yes.** BookSwap has structural advantages:

1. **Simpler domain** — no video calls (Agora), no payment processing (Paystack/RevenueCat), no currency exchange rates. This means UX/maps/discovery can get more polish instead of fighting complex integrations.

2. **Stronger geo capabilities** — BookSwap already uses PostGIS/GeoDjango for real spatial queries, barcode scanning for books, and a map-based discovery flow. SpeakLinka's geo is simpler.

3. **Areas to surpass SpeakLinka:**
   - Use **pnpm workspaces** or **Turborepo** instead of SpeakLinka's manual `cd && npm install` scripts
   - Stricter shared package with auto-generated types from DRF serializers (e.g. `drf-spectacular` → OpenAPI → `openapi-typescript`)
   - Better E2E coverage (SpeakLinka's mobile E2E is still missing from CI)
   - Proper workspace-level TypeScript project references
   - Native modules done right from day one (Expo New Arch enabled)
   - Better offline support — book discovery with cached map tiles makes more sense than SpeakLinka's session booking offline

---

## Recommended Setup Plan

### Phase 0 — Monorepo Foundation ✅

| Task | Priority | Status |
|------|----------|--------|
| Create root `package.json` with workspace orchestration | P0 | ✅ Done |
| Create `packages/shared/` with Zod schemas, types, constants | P0 | ✅ Done |
| Create root `README.md` with Mermaid architecture diagram | P0 | ✅ Done |
| Create root `AGENTS.md` (project-level) | P0 | ✅ Done |
| Create `CONTRIBUTING.md` | P1 | ✅ Done |

### Phase 1 — Backend Hardening ✅

| Task | Priority | Status |
|------|----------|--------|
| Create `backend/scripts/entrypoint.sh` | P0 | ✅ Done |
| Create `backend/scripts/check-env.sh` | P0 | ✅ Done |
| Create `backend/scripts/migrate_with_lock.py` | P0 | ✅ Done |
| Create `backend/config/gunicorn.py` | P0 | ✅ Done |
| Create `backend/start.sh` | P0 | ✅ Done |
| Separate Celery queues (default, email, maintenance) | P1 | ✅ Done |
| Add custom security headers middleware | P1 | ✅ Done |
| Create `docs/adr/` with initial ADRs | P1 | ✅ Done |

### Phase 2 — Frontend Parity ✅

| Task | Priority | Status |
|------|----------|--------|
| Add locale-prefixed routes (`/:lng`) | P1 | ✅ Done |
| Create `frontend/docker-compose.staging.yml` | P0 | ✅ Done |
| Create `frontend/docker-compose.prod.yml` | P0 | ✅ Done |
| Add HTTPS dev support (mkcert) | P1 | ✅ Done |
| Create nginx config with CSP templating | P0 | ✅ Done |
| Expand Playwright E2E test suite | P1 | ✅ Done |

### Phase 3 — Mobile App (Expo) ✅

| Task | Priority | Status |
|------|----------|--------|
| Scaffold `mobile/` with Expo SDK 54+ | P0 | ✅ Done |
| Navigation (auth stack, role-based tabs, deep linking) | P0 | ✅ Done |
| Auth layer (secure token storage, refresh, biometric gate) | P0 | ✅ Done |
| API layer connected to same backend (with `X-Client-Type: mobile`) | P0 | ✅ Done |
| Push notifications (expo-notifications + backend `MobileDevice` model) | P0 | ✅ Done |
| Map integration (react-native-maps with clustering) | P0 | ✅ Done |
| Book scanner (expo-camera + barcode) | P1 | ✅ Done |
| EAS Build + Update configuration | P0 | ✅ Done |
| WebSocket integration for chat + notifications | P1 | ✅ Done |

### Phase 4 — Production Polish ✅

| Task | Priority | Status |
|------|----------|--------|
| Create `PRODUCTION-READINESS.md` | P0 | ✅ Done |
| Run security audit + create `security-action-plan.md` | P0 | ✅ Done |
| Create deployment runbook | P0 | ✅ Done |
| Add `--cov-fail-under=80` to CI | P0 | ✅ Done (already present) |
| Add bundle size gate to CI | P1 | ✅ Done (already present) |
| Add `pip-audit` to CI | P1 | ✅ Done (already present) |
| Create `infra/` for object storage | P2 | ✅ Done (scaffolded) |
| Create `important-docs/` for product/technical reference | P1 | ✅ Done |

---

## Remaining Gaps (post Phase 4)

These are minor items not covered by the original setup plan that are still open:

| Item | Priority | Notes |
|------|----------|-------|
| Root `DESIGN.md` | P2 | Root-level design doc (currently only `frontend/src/styles/DESIGN.md`) |
| `APP-AUDIT.md` | P2 | Sprint-backlog-style audit; `PRODUCTION-READINESS.md` covers similar ground |
| `docs/already-implemented/` | P3 | Archive of completed plans |
| MinIO wired into app (`django-storages[s3]`) | P2 | Compose scaffolded; backend integration pending |
| Expand Playwright E2E coverage | P1 | 3 specs today; tracked in `PRODUCTION-READINESS.md` §7 |
| Security action plan items | P0–P2 | SEC-001 through SEC-010; see `security-action-plan.md` for status and priorities |

---

## Reference: SpeakLinka Architecture (for replication)

```
speak-linka/
├── backend/                    # Django 5 ASGI + DRF + Channels + Celery
│   ├── apps/                   # Domain apps (learners, partners, sessions, ...)
│   ├── config/                 # Settings (base/dev/prod/test), gunicorn, celery, asgi
│   ├── scripts/                # entrypoint.sh, check-env.sh, migrate_with_lock.py
│   ├── speaklinka/             # Project app (User model, routing, consumers, urls)
│   ├── tests/                  # Root test utilities, factories
│   ├── Dockerfile
│   ├── docker-compose.yml      # Dev
│   ├── docker-compose.staging.yml
│   ├── docker-compose.prod.yml
│   ├── Makefile
│   ├── start.sh
│   └── requirements.txt
├── frontend/                   # React 19 + Vite 7 + TypeScript
│   ├── src/
│   │   ├── features/           # Feature-sliced modules
│   │   ├── components/         # Shared UI
│   │   ├── services/           # HTTP, WebSocket, query client
│   │   ├── routes/             # /:lng prefixed routing
│   │   ├── i18n/               # Custom fetch backend + language detector
│   │   ├── sw/                 # Service worker (Workbox)
│   │   └── test/               # Vitest setup, MSW, factories
│   ├── plugins/                # Custom Vite plugins (PWA, html-transform)
│   ├── e2e/                    # Playwright specs
│   ├── public/locales/         # i18n JSON files
│   ├── Dockerfile              # Multi-stage (build → nginx)
│   ├── docker-compose.yml
│   ├── docker-compose.staging.yml
│   └── docker-compose.prod.yml
├── mobile/                     # Expo SDK 54 + React Native 0.81
│   ├── src/
│   │   ├── features/           # Feature modules (auth, sessions, call, ...)
│   │   ├── navigation/         # React Navigation (stacks, tabs, deep linking)
│   │   ├── services/           # HTTP (axios), WebSocket, push tokens
│   │   ├── lib/                # Query client, storage, Sentry, i18n, RevenueCat
│   │   ├── components/         # Shared RN components
│   │   └── stores/             # Zustand (auth, theme, call)
│   ├── app.json                # Expo config
│   ├── eas.json                # EAS Build profiles
│   ├── metro.config.js         # Shared package resolution
│   └── package.json
├── packages/
│   └── shared/                 # @speaklinka/shared
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   ├── schemas/        # Zod validation schemas
│       │   ├── constants/      # Shared constants
│       │   └── i18n/           # Shared translations
│       └── package.json
├── infra/                      # MinIO compose, backup docs
├── important-docs/             # Product overview, feature catalogue, business model
├── docs/                       # ADRs, runbooks, gap analyses, archived plans
│   ├── adr/
│   ├── already-implemented/
│   └── ...
├── .github/workflows/          # ci.yml, deploy-staging.yml, deploy-production.yml
├── package.json                # Root orchestration
├── Makefile                    # Root dev commands
├── AGENTS.md
├── CONTRIBUTING.md
├── DESIGN.md
├── PRODUCTION-READINESS.md
├── APP-AUDIT.md
└── security-action-plan.md
```
