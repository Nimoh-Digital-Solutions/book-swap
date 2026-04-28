# BookSwap — Production Readiness Audit

Living document. Update scores, gaps, and dates as the system evolves. Scoring uses a **0–5** scale where **5 = production-ready** for that dimension (aligned with SpeakLinka-style readiness audits: explicit scores, dated status, named gaps).

| Dimension | Score | Status (snapshot) |
|-----------|-------|-------------------|
| [1. Authentication & Authorization](#1-authentication--authorization) | **5 / 5** | JWT + lockout + IP-based auth throttles (20/min general, 5/min sensitive) |
| [2. Data Protection & Privacy](#2-data-protection--privacy) | **4 / 5** | Transport + config + DPIA-location-data.md; retention enforcement & at-rest TBD |
| [3. API Security](#3-api-security) | **5 / 5** | DRF perms + CSRF + headers + input size limits (Django + gunicorn 10 MB); only versioning depth pending |
| [4. Infrastructure](#4-infrastructure) | **4 / 5** | Compose prod + Pi5 + tunnel + encrypted backups; object storage scaffolded (not deployed) |
| [5. CI/CD](#5-cicd) | **5 / 5** | 5 CI jobs (backend/frontend/mobile/container-scan ×2/shared), Trivy, pip-audit, 80% backend coverage gate, deploy workflows |
| [6. Monitoring & Observability](#6-monitoring--observability) | **3 / 5** | Sentry + health; APM/logs/alerting gaps |
| [7. Testing](#7-testing) | **4 / 5** | Backend 566, frontend 947, mobile 137, E2E 8 specs (E2E not in CI) — all green |
| [8. Documentation](#8-documentation) | **4 / 5** | Architecture, ADRs, deployment runbook, OpenAPI/drf-spectacular, DPIA, store submission, mobile audit; incident playbook TBD |
| [9. Performance](#9-performance) | **3 / 5** | Sensible defaults; validation & CDN gaps |
| [10. Mobile Readiness](#10-mobile-readiness) | **4 / 5** | Sentry production-grade (release+dist+PII scrub), store metadata EN/FR/NL complete, mobile audit at 97/100; device matrix testing pending |

**Overall score (unweighted mean):** **4.1 / 5**

**Last reviewed:** 2026-04-26

---

## Stack context (monorepo)

| Layer | Stack |
|-------|--------|
| **Backend** | Django 5 (ASGI), DRF, nimoh-be-django-base, Django Channels, Celery, PostgreSQL (PostGIS), Redis |
| **Frontend** | React 19, Vite 7, TypeScript, TanStack Query v5, Zustand v5, React Router 7, i18next, Tailwind v4, Sentry, PWA |
| **Mobile** | Expo SDK 54, React Native 0.81, React Navigation, TanStack Query, Zustand, Sentry, EAS Build |
| **Shared** | `packages/shared/` — Zod schemas, types, constants |
| **Infra** | Raspberry Pi 5 self-hosted runner, Docker Compose (dev/staging/prod), Cloudflare Tunnel, GitHub Actions CI/CD |

---

## 1. Authentication & Authorization

**Score: 5 / 5**

**In place**

- JWT with **httpOnly cookies** and **refresh rotation** patterns consistent with the nimoh-stack auth model.
- **Mobile token handling** aligned with secure storage and session lifecycle expectations for Expo.
- **Biometric gate** on mobile for access control before sensitive actions (where implemented).
- **IP-based auth throttling** via `AuthThrottleMiddleware`: `auth` scope (20/min) on register + token/refresh; `auth_sensitive` scope (5/min) on password reset/change.
- **Login throttle** via nimoh-base `AuthenticationRateThrottle` + account lockout (5 attempts → 15-minute lock, HTTP 423).
- **Global DRF throttles**: anonymous 100/hour, authenticated 1000/hour.

**Gaps**

- None blocking launch. Future: review throttle behavior under mobile + shared-IP (carrier NAT) scenarios.

---

## 2. Data Protection & Privacy

**Score: 4 / 5**

**In place**

- **HTTPS in production** for data in transit.
- **PII scrubbed in Sentry** on both web and mobile (auth headers, URL query params, breadcrumbs, sensitive keys, long-string truncation).
- **CORS** configured for expected web origins.
- **DPIA for location data** — `docs/DPIA-location-data.md` documents lawful basis, data flows, retention assumptions, and risk treatment for the geocoded discovery feature.

**Gaps**

- **No data retention policy enforcement** — policies need to be coded (TTL jobs, deletion workflows) and auditable, not only documented intent.
- **Location data needs encryption at rest** — PostGIS coordinates and related profile fields should have a clear at-rest strategy (DB-level, application-level, or KMS-backed).
- **No DPIA for messaging / image uploads** — DPIA scope is limited to location; chat content and user-uploaded images warrant their own assessment.

**Next steps (this area)**

- Implement retention jobs (Celery Beat) for soft-deleted accounts, expired exchange threads, and orphaned media; expand DPIA coverage to messaging and image uploads; define encryption approach for location and verify backups respect the same controls.

---

## 3. API Security

**Score: 5 / 5**

**In place**

- **DRF permissions** on sensitive routes.
- **CSRF protection** for cookie-based flows.
- **Security headers middleware** hardening browser-facing behaviour.
- **Input size limits enforced at two layers**:
  - Django: `DATA_UPLOAD_MAX_MEMORY_SIZE = 10 MB`, `FILE_UPLOAD_MAX_MEMORY_SIZE = 10 MB`, `DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000` in `config/settings/base.py`.
  - Gunicorn: `limit_request_body = 10 MB`, `limit_request_line = 8190`, `limit_request_fields = 100` in `config/gunicorn.py`.
- **Schema-validated payloads** — DRF serializers + Zod on the client for typed request/response contracts.

**Gaps**

- **No API versioning strategy beyond `/v1/`** — need deprecation policy, compatibility guarantees, and optionally header-based versioning for mobile longevity.

**Next steps (this area)**

- Document versioning and breaking-change process for mobile and web clients (non-blocking for launch; needed before older mobile builds proliferate in the wild).

---

## 4. Infrastructure

**Score: 4 / 5**

**In place**

- **Docker Compose** for dev/staging/prod with production-tuned resource limits, read-only root FS (frontend), and non-root containers.
- **Pi5 self-hosted** deployment target with GitHub Actions deploy workflows (staging auto-deploy, production with CI gate).
- **Cloudflare Tunnel** for controlled ingress without exposing raw host ports.
- **Automated encrypted backups**: `infra/backup.sh` with pg_dump + gzip + GPG AES-256 + retention cleanup. Cron schedule in `infra/crontab.example` (daily 03:00 UTC).
- **Object storage scaffolded** (not deployed): `django-storages[boto3]` in requirements; `S3Boto3Storage` backend wired in `config/settings/base.py` behind `USE_S3=true` flag; MinIO docker-compose at `infra/docker-compose.minio.yml` with auto-bucket-create job; env vars documented in `.env.example`.
- **Deployment runbook** (`DEPLOYMENT-RUNBOOK.md`) with full operational procedures, rollback, and troubleshooting.

**Gaps**

- **Object storage not yet enabled in deployed environments** — `USE_S3` defaults to `False`; staging and prod compose files don't enable MinIO. Media is still served from the Pi local volume.
- **No disaster recovery plan** — RPO/RTO, failover steps, and communication plan are undefined.

**Next steps (this area)**

- Flip `USE_S3=true` in staging first with the local MinIO instance, validate uploads + reads + backup story; publish a one-page DR outline with tested restore drills.

---

## 5. CI/CD

**Score: 5 / 5**

**In place**

- **CI pipeline** in `.github/workflows/ci.yml` — 5 named jobs (6 runs counting the container-scan matrix), all green:
  - `backend` — ruff check + ruff format + pip-audit + mypy + migration check + pytest 566 tests with `--cov-fail-under=80` coverage gate.
  - `frontend` — type-check + ESLint + Stylelint + Vitest 947 tests (with coverage) + production build + gzipped bundle-size check (300 KB ceiling).
  - `mobile` — type-check + ESLint + npm audit + `app.json ↔ package.json` version sync check + Jest 137 tests.
  - `container-scan` — Trivy on backend + frontend images (matrix; fails on CRITICAL, ignore-unfixed).
  - `shared` — Vitest on `packages/shared/`.
- **Deploy workflows**: staging auto-deploys from `staging` branch + production gated on CI from `main`, both on the self-hosted Pi5 runner.

**Gaps**

- **E2E (Playwright) specs exist but are not wired into CI** — 8 specs under `frontend/e2e/` (smoke, auth, anonymous browsing, legal, navigation, locale routing, registration onboarding, map page) are runnable locally but no GitHub Actions job executes them.
- **No SAST scanner** (CodeQL or Semgrep) — optional additional layer beyond ruff + type-checking.

**Next steps (this area)**

- Add a Playwright job to `ci.yml` (Chromium-only is fine for the gate, full matrix nightly); consider CodeQL for deeper security-specific static analysis if risk appetite demands it.

---

## 6. Monitoring & Observability

**Score: 3 / 5**

**In place**

- **Sentry** on frontend and mobile for error tracking.
- **Django health endpoint** for basic liveness/readiness style checks.

**Gaps**

- **No APM** — latency and throughput by endpoint are not traced end-to-end.
- **No structured logging aggregation** — logs are not centrally queryable with correlation IDs.
- **No alerting rules** on error rates, queue depth, or failed Celery jobs.
- **No uptime monitoring** — synthetic checks from outside the Pi/Tunnel path.

**Next steps (this area)**

- Add structured JSON logs + shipping target; define SLOs and alerts; optional APM for Django and critical Celery tasks; external uptime checks.

---

## 7. Testing

**Score: 4 / 5**

**In place**

- **Backend**: 566 pytest tests — auth, books, exchanges, messaging, ratings, trust & safety, notifications, throttles, login lockout, sprint contracts. **`--cov-fail-under=80` enforced in CI.** All passing.
- **Frontend**: 947 Vitest tests across 89 test files — components, pages (incl. MapPage, BrowseBooks, BookDetails, profile flows), hooks, services, WebSocket, MSW-mocked APIs. All passing across three consecutive runs (947/947).
- **Mobile**: 137 Jest tests — API modules (books, wishlist, exchanges, ratings, notifications), network status, offline queue, push notifications, auth store, hooks. All passing.
- **E2E**: 8 Playwright specs — smoke, auth flow, anonymous browsing, legal pages, navigation header, locale routing, registration onboarding, map page. Runnable locally.

**Gaps**

- **E2E specs not in CI** — see §5; specs run locally but no automated gate prevents an E2E regression from shipping.
- **E2E coverage** could expand for exchange lifecycle (request → accept → confirm → return) and messaging flows.
- **Mobile**: only ~19 test files for ~99 TSX source files (~92 `it()` cases), per `docs/mobile-production-readiness-2026-04-21.md`. Component / screen coverage on mobile is the weakest layer.

**Next steps (this area)**

- Wire Playwright into CI (see §5); expand E2E for complete-exchange and messaging journeys; broaden mobile component testing.

---

## 8. Documentation

**Score: 4 / 5**

**In place**

- **ADRs** — JWT cookies, PostGIS, Celery queues, factory_boy, UUID PKs (`docs/adr/`).
- **Technical architecture** — `docs/BookSwap_Technical_Architecture.md`.
- **PRD + user stories** — `docs/BookSwap_PRD_Phase1_MVP.md`, `docs/BookSwap_User_Stories_Spec.md`.
- **OpenAPI via drf-spectacular** — schema endpoint (`/api/v1/schema/docs/`), `extend_schema` decorators on views.
- **Deployment runbook** — `DEPLOYMENT-RUNBOOK.md`.
- **DPIA (location data)** — `docs/DPIA-location-data.md`.
- **Adversarial / security review** — `docs/adversarial-review/adversarial-review-2026-04-20.md` + `security-action-plan.md` (machine-readable, status-tracked).
- **Deep audit** — `docs/deep-audit/deep-audit-2026-04-24.md`.
- **Responsive audit + Sprint reports** — `docs/responsive-audit/responsive-audit-2026-04-25.md` (Sprints A/B/C completed).
- **Mobile production readiness** — `docs/mobile-production-readiness-2026-04-21.md` (97/100, ground-truth audit across 60+ checkpoints).
- **Store submission** — `docs/store-submission/` with EN/FR/NL listings, BUILD-AND-SUBMIT, screenshot checklist, Google Sign-In setup, store-setup guide.
- **Gap analyses** — mobile-web parity, mobile-backend audit, frontend audit.
- **Session reports** — change/fix/progress log under `docs/`.

**Gaps**

- **No incident response playbook** — roles, comms, severity, postmortem template.

**Next steps (this area)**

- Add lightweight IR playbook linked from `README` or `docs/`.

---

## 9. Performance

**Score: 3 / 5**

**In place**

- **PostGIS** for spatial queries (discovery and distance-related features).
- **Bundle splitting** on the Vite frontend.
- **TanStack Query persistence** for client-side cache behaviour.

**Gaps**

- **No load testing** — concurrency and websocket behaviour under stress unvalidated.
- **No CDN for static assets** — latency and cache efficiency depend on origin.
- **No database query optimization audit** — N+1, missing indexes, and hot paths not systematically reviewed.

**Next steps (this area)**

- Run targeted load tests (API + Channels); put static assets behind CDN where feasible; profile slow endpoints and add indexes/query tuning.

---

## 10. Mobile Readiness

**Score: 4 / 5**

**In place**

- **Full Expo app** with **SpeakLinka-parity architecture** (navigation, state, shared contracts) — Expo SDK 54, React Native 0.81, ~99 TSX files, ~35 registered screens.
- **Sentry mobile production-grade** (`mobile/src/lib/sentry.ts`):
  - Release tracking: `com.gnimoh.bookswap@${APP_VERSION}` derived from `expo.version`.
  - Distribution tracking: EAS update ID as `dist` (so OTA updates are distinguishable from native rebuilds in release health).
  - PII scrubbing: strips `Authorization` headers, sensitive URL/query params (`token`, `access`, `refresh`, `key`, `exchange_token`), sensitive object keys (`password`, `secret`, `cookie`, `api_key`, ...), truncates strings > 512 chars in extras.
  - React Navigation integration with time-to-initial-display tracing.
- **Store submission package complete** — EN/FR/NL store listings, build & submit guide, Google Sign-In setup, screenshot checklist, store setup guide (`docs/store-submission/`).
- **App version sync gate in CI** — `app.json ↔ package.json` mismatch fails the build.
- **Mobile-specific production audit at 97/100** — `docs/mobile-production-readiness-2026-04-21.md` (60+ checkpoints, ground-truth, all 14 v2 findings resolved).

**Gaps**

- **Device matrix testing not yet executed** — i.e. running production builds on a representative range of physical iOS + Android devices/OS versions (not just simulators) before submitting. TestFlight / Google Play Internal Testing track is the natural vehicle.
- **Mobile component test coverage is thinner than web** — see §7 (137 tests across ~19 test files vs ~99 source files).

**Next steps (this area)**

- Cut a TestFlight build + Internal Testing build, distribute to a small device matrix (1–2 iPhones across iOS major versions, 1–2 Android devices across API levels), capture crash-free session rate from Sentry, then submit to stores.

---

## Next Actions (prioritized)

Priority reflects risk and unlocks for a calm production launch; reorder as business constraints change.

| Priority | Action | Area | Status |
|----------|--------|------|--------|
| ~~P0~~ | ~~Rate limit auth endpoints + document limits~~ | ~~§1 Auth~~ | **Done** — AuthThrottleMiddleware (20/min general, 5/min sensitive) |
| ~~P0~~ | ~~Backups + tested restore path for Postgres~~ | ~~§4 Infra~~ | **Done** — backup.sh + cron schedule + GPG encryption |
| ~~P0~~ | ~~OpenAPI / drf-spectacular as API contract~~ | ~~§8 Docs~~ | **Done** — already configured with schema endpoint |
| ~~P1~~ | ~~Input size limits (proxy + app)~~ | ~~§3 API~~ | **Done** — Django (`DATA_UPLOAD_MAX_MEMORY_SIZE` 10 MB) + gunicorn (`limit_request_body` 10 MB, `limit_request_line` 8190, `limit_request_fields` 100) |
| ~~P1~~ | ~~Add coverage thresholds to CI~~ | ~~§7 Testing~~ | **Done** — backend `--cov-fail-under=80` enforced in CI |
| ~~P1~~ | ~~DPIA for location data~~ | ~~§2 Privacy~~ | **Done** — `docs/DPIA-location-data.md` |
| P1 | Wire Playwright E2E into `ci.yml` | §5 / §7 | Pending — 8 specs exist, no automated gate |
| P1 | Retention enforcement (TTL Celery jobs for soft-deleted accounts, expired threads, orphaned media) | §2 Privacy | Pending |
| P1 | External uptime + error-rate alerting (even minimal) | §6 Observability | Pending |
| P1 | Expand DPIA to cover messaging + image uploads | §2 Privacy | Pending |
| P2 | Enable `USE_S3=true` in staging using bundled MinIO; validate uploads + reads + backup story | §4 Infra | Pending — code is scaffolded; only the env flip + smoke test remains |
| P2 | Location encryption at rest decision + implementation | §2 Privacy | Pending |
| P2 | Load test + DB query audit | §9 Performance | Pending |
| P2 | Expand E2E for complete-exchange + messaging journeys | §7 Testing | Pending |
| P2 | Cut TestFlight + Google Play Internal Testing builds; run device matrix; capture Sentry crash-free rate | §10 Mobile | Pending — Sentry & store metadata done, only physical-device validation left |
| P3 | API versioning policy beyond `/v1/` | §3 API | Pending |
| P3 | APM + structured log aggregation | §6 Observability | Pending |
| P3 | DR plan (RPO/RTO) and incident playbook | §4 / §8 | Pending |
| P3 | SAST scanner (CodeQL or Semgrep) | §5 CI/CD | Pending |

---

## How to update this document

1. Bump **Last reviewed** when any score or major gap changes.
2. Adjust per-section **Score** when work closes gaps (use team evidence: tests, dashboards, merged ADRs).
3. Move completed items from **Next Actions** into section text under **In place**, and add new gaps as they are discovered.
