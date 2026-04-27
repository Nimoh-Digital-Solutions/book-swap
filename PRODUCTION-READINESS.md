# BookSwap — Production Readiness Audit

Living document. Update scores, gaps, and dates as the system evolves. Scoring uses a **0–5** scale where **5 = production-ready** for that dimension (aligned with SpeakLinka-style readiness audits: explicit scores, dated status, named gaps).

| Dimension | Score | Status (snapshot) |
|-----------|-------|-------------------|
| [1. Authentication & Authorization](#1-authentication--authorization) | **5 / 5** | JWT + lockout + IP-based auth throttles (20/min general, 5/min sensitive) |
| [2. Data Protection & Privacy](#2-data-protection--privacy) | **3 / 5** | Transport + config solid; governance & at-rest location TBD |
| [3. API Security](#3-api-security) | **4 / 5** | Core controls in place; limits & versioning depth TBD |
| [4. Infrastructure](#4-infrastructure) | **4 / 5** | Compose prod + Pi5 + tunnel + automated encrypted backups; object storage TBD |
| [5. CI/CD](#5-cicd) | **5 / 5** | Full CI (6 jobs), Trivy container scan, pip-audit, deploy workflows with CI gate |
| [6. Monitoring & Observability](#6-monitoring--observability) | **3 / 5** | Sentry + health; APM/logs/alerting gaps |
| [7. Testing](#7-testing) | **4 / 5** | Backend 502, frontend 859, mobile 53, E2E 7 specs — all green |
| [8. Documentation](#8-documentation) | **4 / 5** | Architecture, ADRs, deployment runbook, OpenAPI/drf-spectacular; incident playbook TBD |
| [9. Performance](#9-performance) | **3 / 5** | Sensible defaults; validation & CDN gaps |
| [10. Mobile Readiness](#10-mobile-readiness) | **3 / 5** | Expo parity architecture; release hardening TBD |

**Overall score (unweighted mean):** **3.8 / 5**

**Last reviewed:** 2026-04-20

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

**Score: 3 / 5**

**In place**

- **HTTPS in production** for data in transit.
- **PII scrubbed in Sentry** to reduce accidental leakage in error reports.
- **CORS** configured for expected web origins.

**Gaps**

- **No DPIA implementation** — processing of location and messaging data should be formally assessed (BookSwap / product-specific DPIA artefact, not only generic docs).
- **No data retention policy enforcement** — policies need to be coded (TTL jobs, deletion workflows) and auditable, not only documented intent.
- **Location data needs encryption at rest** — PostGIS coordinates and related profile fields should have a clear at-rest strategy (DB-level, application-level, or KMS-backed).

**Next steps (this area)**

- Complete DPIA checklist, map data flows, and tie retention to implemented jobs; define encryption approach for location and verify backups respect the same controls.

---

## 3. API Security

**Score: 4 / 5**

**In place**

- **DRF permissions** on sensitive routes.
- **CSRF protection** for cookie-based flows.
- **Security headers middleware** hardening browser-facing behaviour.

**Gaps**

- **No explicit input size limits** — risk of abuse via large payloads; should be enforced at reverse proxy and/or Django/DRF parsers with documented maxima.
- **No API versioning strategy beyond `/v1/`** — need deprecation policy, compatibility guarantees, and optionally header-based versioning for mobile longevity.

**Next steps (this area)**

- Define max body sizes per content type; document versioning and breaking-change process for mobile and web clients.

---

## 4. Infrastructure

**Score: 4 / 5**

**In place**

- **Docker Compose** for dev/staging/prod with production-tuned resource limits, read-only root FS (frontend), and non-root containers.
- **Pi5 self-hosted** deployment target with GitHub Actions deploy workflows (staging auto-deploy, production with CI gate).
- **Cloudflare Tunnel** for controlled ingress without exposing raw host ports.
- **Automated encrypted backups**: `infra/backup.sh` with pg_dump + gzip + GPG AES-256 + retention cleanup. Cron schedule in `infra/crontab.example` (daily 03:00 UTC).
- **Deployment runbook** (`DEPLOYMENT-RUNBOOK.md`) with full operational procedures, rollback, and troubleshooting.

**Gaps**

- **No object storage** — media served locally; scaling, integrity, and backup of user uploads are weaker than object storage + signed URLs.
- **No disaster recovery plan** — RPO/RTO, failover steps, and communication plan are undefined.

**Next steps (this area)**

- Introduce object storage (or documented interim mitigations) and publish a one-page DR outline with tested restore drills.

---

## 5. CI/CD

**Score: 5 / 5**

**In place**

- **Full CI pipeline** (6 jobs, all green): backend (ruff + mypy + migration check + pytest 502 tests + coverage), frontend (type-check + lint + stylelint + Vitest 859 tests + build + bundle size), mobile (type-check + lint + Jest 53 tests), shared (Vitest), E2E (7 Playwright specs).
- **Container image scanning**: Trivy on both backend + frontend images (fails on CRITICAL).
- **Dependency audit**: `pip-audit` for Python, `npm audit` / `yarn audit` for JS.
- **Deploy workflows**: staging (auto-deploy on push) + production (CI gate, manual trigger), both on self-hosted Pi5.

**Gaps**

- **No SAST scanner** (CodeQL or Semgrep) — optional additional layer beyond ruff + type-checking.

**Next steps (this area)**

- Consider adding CodeQL for deeper security-specific static analysis if risk appetite demands it.

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

- **Backend**: 502 pytest tests across 10+ test files — auth, books, exchanges, messaging, ratings, trust & safety, notifications, throttles, login lockout. All passing.
- **Frontend**: 859 Vitest tests — components, pages, hooks, services, WebSocket. All passing.
- **Mobile**: 53 Jest tests — API modules (books, wishlist, exchanges), network status, offline queue, push notifications, auth store. All passing.
- **E2E**: 7 Playwright specs — smoke, authentication, anonymous browsing, legal pages, navigation.

**Gaps**

- **Backend coverage** should be measured and tracked against an 80% bar (CI coverage artifact needed).
- **E2E coverage** could expand for exchange lifecycle and messaging flows.

**Next steps (this area)**

- Add coverage thresholds to CI; expand E2E for critical user journeys (complete exchange, messaging).

---

## 8. Documentation

**Score: 4 / 5**

**In place**

- **ADRs** for significant decisions.
- **Gap analysis** and product comparison docs under `docs/`.
- **Technical architecture** documentation at a high level.
- **OpenAPI via drf-spectacular** — configured with schema endpoint (`/api/v1/schema/docs/`), `extend_schema` decorators on views.
- **Deployment runbook** — comprehensive `DEPLOYMENT-RUNBOOK.md` with Pi5 setup, env vars, migrations, rollback, troubleshooting, health checks, backup/recovery.
- **Session reports** tracking all changes, fixes, and progress.

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

**Score: 3 / 5**

**In place**

- **Full Expo app** with **SpeakLinka-parity architecture** (navigation, state, shared contracts intent).

**Gaps**

- **Native builds not tested yet** — EAS production channels need device matrix validation.
- **No app store metadata** — listings, privacy labels, screenshots, and review notes unprepared.
- **Crash reporting not verified** — Sentry on mobile needs release health and source maps confirmation for production builds.

**Next steps (this area)**

- Run TestFlight/Internal testing builds; complete store assets; verify Sentry releases and symbolication for iOS/Android.

---

## Next Actions (prioritized)

Priority reflects risk and unlocks for a calm production launch; reorder as business constraints change.

| Priority | Action | Area | Status |
|----------|--------|------|--------|
| ~~P0~~ | ~~Rate limit auth endpoints + document limits~~ | ~~§1 Auth~~ | **Done** — AuthThrottleMiddleware (20/min general, 5/min sensitive) |
| ~~P0~~ | ~~Backups + tested restore path for Postgres~~ | ~~§4 Infra~~ | **Done** — backup.sh + cron schedule + GPG encryption |
| ~~P0~~ | ~~OpenAPI / drf-spectacular as API contract~~ | ~~§8 Docs~~ | **Done** — already configured with schema endpoint |
| P1 | DPIA + retention enforcement design (jobs + admin visibility) | §2 Privacy | Pending |
| P1 | Input size limits (proxy + app) | §3 API | Pending |
| P1 | External uptime + error-rate alerting (even minimal) | §6 Observability | Pending |
| P1 | Add coverage thresholds to CI; expand E2E critical paths | §7 Testing | Pending |
| P2 | Object storage migration plan for media | §4 Infra | Pending |
| P2 | Location encryption at rest decision + implementation | §2 Privacy | Pending |
| P2 | Load test + DB query audit | §9 Performance | Pending |
| P3 | API versioning policy beyond `/v1/` | §3 API | Pending |
| P3 | APM + structured log aggregation | §6 Observability | Pending |
| P3 | EAS production builds, store metadata, verify Sentry mobile | §10 Mobile | Pending |
| P3 | DR plan (RPO/RTO) and incident playbook | §4 / §8 | Pending |

---

## How to update this document

1. Bump **Last reviewed** when any score or major gap changes.
2. Adjust per-section **Score** when work closes gaps (use team evidence: tests, dashboards, merged ADRs).
3. Move completed items from **Next Actions** into section text under **In place**, and add new gaps as they are discovered.
