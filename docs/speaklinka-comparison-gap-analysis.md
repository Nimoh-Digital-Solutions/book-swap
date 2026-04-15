# BookSwap vs SpeakLinka: Gap Analysis & Setup Plan

> **Date:** 2026-04-15
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

## Gap Analysis: What BookSwap Is Missing

### Legend

- ✅ BookSwap already has this
- ⚠️ BookSwap has a partial version
- ❌ BookSwap is missing this entirely

---

### 1. Mobile App (React Native / Expo)

| Item | Status | Notes |
|------|--------|-------|
| `mobile/` directory | ❌ | SpeakLinka has a full Expo app with navigation, auth, push notifications, deep linking, biometric gate, Agora calls, RevenueCat subs, SSL pinning, Sentry, EAS Build/Update |
| Mobile CI (type-check + lint + Jest) | ❌ | SpeakLinka runs mobile checks in root `ci.yml` |
| Mobile deploy (EAS OTA) | ❌ | SpeakLinka pushes OTA updates in staging deploy workflow |

### 2. Shared Package (`packages/shared/`)

| Item | Status | Notes |
|------|--------|-------|
| `packages/shared/` with Zod schemas | ❌ | SpeakLinka shares types, Zod validation schemas, constants, and i18n JSON between frontend and mobile via `@shared/*` alias |
| Metro config for shared resolution | ❌ | SpeakLinka's mobile uses `watchFolders` + `nodeModulesPaths` in `metro.config.js` |
| Vite alias for shared | ❌ | SpeakLinka frontend maps `@shared/*` → `../../packages/shared/src/*` |

### 3. Monorepo Root Orchestration

| Item | Status | Notes |
|------|--------|-------|
| Root `package.json` | ❌ | SpeakLinka orchestrates install/dev/test/lint for all layers from root |
| Root `README.md` | ❌ | SpeakLinka has architecture diagram (Mermaid), quick start, repo layout |
| Root `AGENTS.md` | ⚠️ | BookSwap only has `frontend/AGENTS.md`; SpeakLinka has project-level root AGENTS.md |
| Root `Makefile` | ✅ | Both have it; BookSwap's is basic (`make start` → BE + FE) |
| `CONTRIBUTING.md` | ❌ | SpeakLinka has contribution guidelines |
| `DESIGN.md` (root) | ⚠️ | BookSwap has `frontend/src/styles/DESIGN.md` only; SpeakLinka has root-level design doc |

### 4. Production & Operations Documentation

| Item | Status | Notes |
|------|--------|-------|
| `PRODUCTION-READINESS.md` | ❌ | SpeakLinka has a living audit with scores, feature/security/testing gaps, dated resolutions |
| `APP-AUDIT.md` | ❌ | SpeakLinka has sprint-backlog-style audit tracking P1–P4 priorities |
| `security-action-plan.md` | ❌ | SpeakLinka has SEC-001–006, all resolved with implementation notes |
| `docs/adr/` (Architecture Decision Records) | ❌ | SpeakLinka has 5 ADRs (JWT cookies, date/time fields, password reset, factory_boy, PII encryption) |
| `important-docs/` | ❌ | SpeakLinka has product overview, feature catalogue, business model docs |
| Deployment runbook | ❌ | SpeakLinka has `DEPLOYMENT-RUNBOOK.md` (Pi, staging vs prod, rollback, migrations) |
| `docs/already-implemented/` | ❌ | SpeakLinka archives completed plans here with a clear README |

### 5. Backend Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| `backend/scripts/entrypoint.sh` | ❌ | SpeakLinka has Docker entrypoint script |
| `backend/scripts/check-env.sh` | ❌ | SpeakLinka validates required env vars before deploy |
| `backend/scripts/migrate_with_lock.py` | ❌ | SpeakLinka prevents concurrent migration runs |
| `backend/config/gunicorn.py` | ❌ | SpeakLinka has UvicornWorker config with CPU-based worker count; BookSwap uses inline Dockerfile args |
| `backend/start.sh` | ❌ | SpeakLinka chains migrations → gunicorn startup |
| Celery queue separation | ❌ | SpeakLinka separates `default`, `email`, `maintenance` queues; BookSwap uses single default queue |
| Custom security headers middleware | ❌ | SpeakLinka has `SpeakLinkaSecurityHeadersMiddleware` with admin CSP override |
| `docker-compose.staging.yml` | ✅ | Both have staging compose |
| `docker-compose.prod.yml` | ✅ | Both have production compose |

### 6. Frontend Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Locale-prefixed routes (`/:lng`) | ❌ | SpeakLinka enforces `/:lng` prefix with `LanguageSync`; BookSwap uses flat paths (`/login`, `/catalogue`) |
| Multiple FE docker-compose files | ❌ | SpeakLinka has dev + staging + prod compose; BookSwap has only dev |
| HTTPS in dev (mkcert) | ❌ | SpeakLinka uses `vite-plugin-mkcert` for local HTTPS (needed for media APIs, secure cookies) |
| nginx config with CSP templating | ❌ | SpeakLinka has `security_headers.conf` with `CSP_CONNECT_SRC` and `BACKEND_URL` env templating |
| `auth-app/` secondary app | ✅ | Both have it |
| PWA custom service worker | ✅ | Both use Workbox `injectManifest` |
| Bundle analysis + compression | ✅ | Both have rollup visualizer + gzip/brotli compression |
| Playwright E2E | ⚠️ | BookSwap has 3 specs; SpeakLinka has extensive coverage (auth, dashboard, sessions, subscriptions, a11y, smoke) |

### 7. CI/CD Pipeline

| Item | Status | Notes |
|------|--------|-------|
| Root `ci.yml` testing ALL layers | ⚠️ | BookSwap has `ci.yml` but scope may not cover all layers like SpeakLinka (BE + FE + mobile + shared + E2E) |
| Backend coverage threshold in CI | ❌ | SpeakLinka enforces `--cov-fail-under=80` |
| Bundle size gate in CI | ❌ | SpeakLinka fails CI if main JS chunk exceeds 200KB gzipped |
| `pip-audit` in CI | ❌ | SpeakLinka runs `pip-audit` for known vulnerabilities |
| Deploy workflows with health checks | ⚠️ | SpeakLinka pings API + FE health endpoints post-deploy; verify BookSwap does the same |
| Shared package CI | ❌ | N/A until `packages/shared/` exists |
| Mobile CI | ❌ | N/A until `mobile/` exists |

### 8. Infrastructure (`infra/`)

| Item | Status | Notes |
|------|--------|-------|
| `infra/` directory | ❌ | SpeakLinka has MinIO compose for object storage on Pi, backup documentation |
| Object storage (MinIO / S3) | ❌ | SpeakLinka uses MinIO on Pi with `django-storages[s3]`; BookSwap serves media locally |

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

### Phase 0 — Monorepo Foundation

| Task | Priority |
|------|----------|
| Create root `package.json` with workspace orchestration | P0 |
| Create `packages/shared/` with Zod schemas, types, constants | P0 |
| Create root `README.md` with Mermaid architecture diagram | P0 |
| Create root `AGENTS.md` (project-level) | P0 |
| Create `CONTRIBUTING.md` | P1 |

### Phase 1 — Backend Hardening

| Task | Priority |
|------|----------|
| Create `backend/scripts/entrypoint.sh` | P0 |
| Create `backend/scripts/check-env.sh` | P0 |
| Create `backend/scripts/migrate_with_lock.py` | P0 |
| Create `backend/config/gunicorn.py` | P0 |
| Create `backend/start.sh` | P0 |
| Separate Celery queues (default, email, maintenance) | P1 |
| Add custom security headers middleware | P1 |
| Create `docs/adr/` with initial ADRs | P1 |

### Phase 2 — Frontend Parity

| Task | Priority |
|------|----------|
| Add locale-prefixed routes (`/:lng`) | P1 |
| Create `frontend/docker-compose.staging.yml` | P0 |
| Create `frontend/docker-compose.prod.yml` | P0 |
| Add HTTPS dev support (mkcert) | P1 |
| Create nginx config with CSP templating | P0 |
| Expand Playwright E2E test suite | P1 |

### Phase 3 — Mobile App (Expo)

| Task | Priority |
|------|----------|
| Scaffold `mobile/` with Expo SDK 54+ | P0 |
| Navigation (auth stack, role-based tabs, deep linking) | P0 |
| Auth layer (secure token storage, refresh, biometric gate) | P0 |
| API layer connected to same backend (with `X-Client-Type: mobile`) | P0 |
| Push notifications (expo-notifications + backend `MobileDevice` model) | P0 |
| Map integration (react-native-maps with clustering) | P0 |
| Book scanner (expo-camera + barcode) | P1 |
| EAS Build + Update configuration | P0 |
| WebSocket integration for chat + notifications | P1 |

### Phase 4 — Production Polish

| Task | Priority |
|------|----------|
| Create `PRODUCTION-READINESS.md` | P0 |
| Run security audit + create `security-action-plan.md` | P0 |
| Create deployment runbook | P0 |
| Add `--cov-fail-under=80` to CI | P0 |
| Add bundle size gate to CI | P1 |
| Add `pip-audit` to CI | P1 |
| Create `infra/` for object storage | P2 |
| Create `important-docs/` for product/technical reference | P1 |

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
