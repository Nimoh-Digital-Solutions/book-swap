# BookSwap — Production Readiness Audit

Living document. Update scores, gaps, and dates as the system evolves. Scoring uses a **0–5** scale where **5 = production-ready** for that dimension (aligned with SpeakLinka-style readiness audits: explicit scores, dated status, named gaps).

| Dimension | Score | Status (snapshot) |
|-----------|-------|-------------------|
| [1. Authentication & Authorization](#1-authentication--authorization) | **4 / 5** | Strong baseline; auth rate limits pending |
| [2. Data Protection & Privacy](#2-data-protection--privacy) | **3 / 5** | Transport + config solid; governance & at-rest location TBD |
| [3. API Security](#3-api-security) | **4 / 5** | Core controls in place; limits & versioning depth TBD |
| [4. Infrastructure](#4-infrastructure) | **3 / 5** | Compose + Pi5 + tunnel; storage & DR gaps |
| [5. CI/CD](#5-cicd) | **4 / 5** | Broad gates; SAST & image scan gaps |
| [6. Monitoring & Observability](#6-monitoring--observability) | **3 / 5** | Sentry + health; APM/logs/alerting gaps |
| [7. Testing](#7-testing) | **3 / 5** | Multi-layer tests exist; coverage & mobile depth |
| [8. Documentation](#8-documentation) | **3 / 5** | Architecture & ADRs; ops & API docs gaps |
| [9. Performance](#9-performance) | **3 / 5** | Sensible defaults; validation & CDN gaps |
| [10. Mobile Readiness](#10-mobile-readiness) | **3 / 5** | Expo parity architecture; release hardening TBD |

**Overall score (unweighted mean):** **3.3 / 5**

**Last reviewed:** 2026-04-15

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

**Score: 4 / 5**

**In place**

- JWT with **httpOnly cookies** and **refresh rotation** patterns consistent with the nimoh-stack auth model.
- **Mobile token handling** aligned with secure storage and session lifecycle expectations for Expo.
- **Biometric gate** on mobile for access control before sensitive actions (where implemented).

**Gaps**

- **No rate limiting on auth endpoints yet** — brute-force and credential-stuffing risk remains; should align with reverse-proxy or application-level limits (per IP / per account) and observability on lockouts.

**Next steps (this area)**

- Add rate limiting (and document limits) for login, refresh, password reset, and registration flows; verify behaviour under mobile + shared-IP scenarios.

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

**Score: 3 / 5**

**In place**

- **Docker Compose** for dev/staging/prod-style layouts.
- **Pi5 self-hosted** deployment target.
- **Cloudflare Tunnel** for controlled ingress without exposing raw host ports.

**Gaps**

- **No object storage** — **media served locally**; scaling, integrity, and backup of user uploads are weaker than object storage + signed URLs.
- **No backup automation** — databases and volumes need scheduled, tested restores.
- **No disaster recovery plan** — RPO/RTO, failover steps, and communication plan are undefined.

**Next steps (this area)**

- Introduce object storage (or documented interim mitigations), automate encrypted backups with quarterly restore drills, and publish a one-page DR outline.

---

## 5. CI/CD

**Score: 4 / 5**

**In place**

- **Full CI pipeline**: backend lint + test + coverage; frontend type-check + lint + test + bundle size; mobile type-check; **E2E (Playwright)**; **pip-audit** for dependency vulnerabilities.

**Gaps**

- **No SAST scanner** in pipeline (static analysis for security bug classes beyond linting).
- **No container image scanning** — images pushed or deployed without systematic CVE gates.

**Next steps (this area)**

- Add SAST (e.g. CodeQL or equivalent) and image scanning (Trivy/Grype) with fail/warn thresholds matching risk appetite.

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

**Score: 3 / 5**

**In place**

- **10 backend test files** (pytest-django) covering parts of the API and domain logic.
- **Vitest** for frontend unit/integration tests.
- **Jest** setup for mobile.

**Gaps**

- **Backend coverage** should reach **~80%** as a sustained bar (current below target — exact % to be filled from CI artifacts).
- **Mobile tests need writing** — setup exists; suites are thin or empty for critical flows.
- **E2E coverage is minimal** — **3 Playwright specs**; happy paths and auth-critical journeys need expansion.

**Next steps (this area)**

- Raise backend coverage with focus on exchanges, messaging, and auth; add mobile tests for navigation + API error paths; grow E2E for registration, swap, and messaging smoke flows.

---

## 8. Documentation

**Score: 3 / 5**

**In place**

- **ADRs** for significant decisions.
- **Gap analysis** and product comparison docs (e.g. SpeakLinka-oriented material under `docs/`).
- **Technical architecture** documentation at a high level.

**Gaps**

- **No API docs** — **drf-spectacular** (or equivalent OpenAPI) not fully adopted as the contract for web and mobile.
- **No deployment runbook** — step-by-step for Pi5, env vars, migrations, rollbacks.
- **No incident response playbook** — roles, comms, severity, postmortem template.

**Next steps (this area)**

- Ship OpenAPI as source of truth; add operator runbook and lightweight IR playbook linked from `README` or `docs/`.

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

| Priority | Action | Area |
|----------|--------|------|
| P0 | Rate limit auth endpoints + document limits | §1 Auth |
| P0 | Backups + tested restore path for Postgres (and media if local) | §4 Infra |
| P0 | OpenAPI / drf-spectacular as API contract for clients | §8 Docs |
| P1 | DPIA + retention enforcement design (jobs + admin visibility) | §2 Privacy |
| P1 | Input size limits (proxy + app) | §3 API |
| P1 | External uptime + error-rate alerting (even minimal) | §6 Observability |
| P1 | Raise backend test coverage toward 80%; expand E2E critical paths | §7 Testing |
| P2 | SAST + container image scanning in CI | §5 CI/CD |
| P2 | Object storage migration plan for media | §4 Infra |
| P2 | Location encryption at rest decision + implementation | §2 Privacy |
| P2 | Load test + DB query audit | §9 Performance |
| P3 | API versioning policy beyond `/v1/` | §3 API |
| P3 | APM + structured log aggregation | §6 Observability |
| P3 | EAS production builds, store metadata, verify Sentry mobile | §10 Mobile |
| P3 | DR plan (RPO/RTO) and incident playbook | §4 / §8 |

---

## How to update this document

1. Bump **Last reviewed** when any score or major gap changes.
2. Adjust per-section **Score** when work closes gaps (use team evidence: tests, dashboards, merged ADRs).
3. Move completed items from **Next Actions** into section text under **In place**, and add new gaps as they are discovered.
