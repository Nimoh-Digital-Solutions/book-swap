# BookSwap — Production Readiness Audit

Living document. Update scores, gaps, and dates as the system evolves. Scoring uses a **0–5** scale where **5 = production-ready** for that dimension (aligned with SpeakLinka-style readiness audits: explicit scores, dated status, named gaps).

| Dimension | Score | Status (snapshot) |
|-----------|-------|-------------------|
| [1. Authentication & Authorization](#1-authentication--authorization) | **5 / 5** | JWT + lockout + IP-based auth throttles (20/min general, 5/min sensitive) |
| [2. Data Protection & Privacy](#2-data-protection--privacy) | **4 / 5** | Transport + DPIA + nimoh_base retention engine running (`enforce-data-retention`, `process-scheduled-deletions`, `cleanup-old-audit-logs`); messaging/uploads DPIA + at-rest encryption pending |
| [3. API Security](#3-api-security) | **5 / 5** | DRF perms + CSRF + headers + input size limits (Django + gunicorn 10 MB); only versioning depth pending |
| [4. Infrastructure](#4-infrastructure) | **4 / 5** | Compose prod + Pi5 + tunnel + encrypted backups + 7 monitor scripts (containers/endpoints/db/health/security/sentry/ops-digest) → Telegram; object storage scaffolded (not deployed) |
| [5. CI/CD](#5-cicd) | **5 / 5** | 5 CI jobs (backend/frontend/mobile/container-scan ×2/shared), Trivy, pip-audit, 80% backend coverage gate, deploy workflows; production deploy gate fix shipped (walks merge parents) |
| [6. Monitoring & Observability](#6-monitoring--observability) | **5 / 5** | Sentry alerts (5/4/4 rules) + UptimeRobot 3 monitors + Telegram digests every 4h + Expo push receipt reconciliation + **BookSwap-dedicated Telegram channel** with 5 cron monitors (containers/endpoints/backups/sentry/abuse) + read-only `/status`/`/digest`/`/sentry`/`/abuse`/`/health`/`/containers` bot. APM + structured log shipping still tracked in §6 long-term |
| [7. Testing](#7-testing) | **4 / 5** | Backend **598**, frontend **947**, mobile **137** — all green. E2E 8 specs runnable locally; not in CI |
| [8. Documentation](#8-documentation) | **5 / 5** | Architecture, ADRs, deployment runbook, OpenAPI, DPIA (location), store submission EN/FR/NL, mobile audit (97/100), **incident response playbook**, deep audit, gap analyses |
| [9. Performance](#9-performance) | **3 / 5** | Sensible defaults + bundle splitting; load testing & CDN audit still pending |
| [10. Mobile Readiness](#10-mobile-readiness) | **5 / 5** | iOS 1.0.0 (8) **Submitted to App Store Review 2026-05-01 22:52 CEST** (no iPad support, ~169 countries, EN/FR/NL listings). Android already on Play production track 2026-04-30. Sentry release+dist+PII scrub, FCM v1 + APNs, push receipt reconciliation, OTA pipeline |

**Overall score (unweighted mean):** **4.4 / 5**

**Last reviewed:** 2026-05-01

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
- **Retention engine running on Celery Beat** via `nimoh_base`:
  - `enforce-data-retention` — application-level retention sweep.
  - `process-scheduled-deletions` — executes user-initiated account deletions.
  - `cleanup-old-audit-logs`, `cleanup-expired-tokens`, `cleanup-inactive-sessions`, `cleanup-stale-export-requests`.
  - BookSwap-specific: `bookswap.anonymize_deleted_accounts` (daily) plus `exchanges.expire_stale_requests` / `expire_stale_conditions`.

**Gaps**

- **DPIA scope not yet expanded** — chat content and user-uploaded images still need their own assessment alongside the location DPIA.
- **Location data encryption at rest** — PostGIS coordinates and related profile fields should have an explicit at-rest strategy (DB-level, application-level, or KMS-backed); current state relies on disk-level controls only.
- **Orphaned-media TTL** — uploaded book covers tied to deleted listings have no audited TTL job yet.

**Next steps (this area)**

- Expand DPIA coverage to messaging and image uploads; define encryption approach for location and verify backups respect the same controls; add an orphaned-media sweep to the retention pipeline.

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

**Score: 4 / 5**

**In place**

- **Sentry** on backend, frontend, and mobile with PII scrubbing + release/dist tracking.
- **Sentry alert rules** (active 2026-04-29): backend 5 rules (high-priority, error-spike, new-issue, regression, celery-failure), frontend + mobile 4 rules each.
- **Health endpoint** at `/api/v1/health/` — checks Postgres, Redis, Celery worker count; HEAD-friendly for monitors.
- **External uptime monitoring** via UptimeRobot — 3 synthetic monitors (API health, API schema, frontend) running since 2026-04-29, currently green.
- **Pi-side monitoring suite** — 7 cron-driven scripts in `~/scripts/` reporting to Telegram via `_monitor-lib.sh`:
  - `container-monitor.sh` (5 min) — container up/health/restart loops.
  - `endpoint-monitor.sh` (5 min) — HTTP probes + response time.
  - `pi-health.sh` (15 min) — temp, load, memory, disk, Docker waste.
  - `db-monitor.sh` (hourly) — Postgres connections + size growth, Redis memory/clients/evictions.
  - `backup-monitor.sh` (daily 06:00) — pg_dump completion + offsite copy.
  - `security-monitor.sh` (daily 07:00) — package updates, SSH, ports, journal.
  - `bookswap-ops-digest.sh` (every 4h, staggered +15 min vs. Sentry monitor) — users / books / exchanges / trust-safety queue snapshot via `manage.py print_ops_digest`.
- **Push notification reconciliation**: every 15 min, `notifications.check_push_receipts` polls Expo for the actual APNs/FCM delivery outcome of accepted tickets and deactivates dead device tokens — closes the visibility gap that hid inconsistent iOS push delivery.

**Gaps**

- **No APM** — latency and throughput by endpoint are not traced end-to-end.
- **No structured logging aggregation** — logs are not centrally queryable with correlation IDs (Telegram digests cover *aggregate* health; per-request tracing still local to the container).
- **No formal SLOs** — uptime + error-rate alerting is in place, but no documented latency / availability targets to alert against.

**Next steps (this area)**

- Define SLOs (frontend p95 TTFB, API p95 latency, error budget); add structured JSON logs + a shipping target (Loki / Grafana Cloud); optional APM for Django and critical Celery tasks.

---

## 7. Testing

**Score: 4 / 5**

**In place**

- **Backend**: **598** pytest tests (verified 2026-05-01) — auth, books, exchanges, messaging, ratings, trust & safety, notifications (incl. push receipt reconciliation + ops digest), throttles, login lockout, sprint contracts. **`--cov-fail-under=80` enforced in CI.** All passing.
- **Frontend**: **947** Vitest tests across 89 test files — components, pages (MapPage, BrowseBooks, BookDetails, profile flows), hooks, services, WebSocket, MSW-mocked APIs. All passing.
- **Mobile**: **137** Jest tests across 24 suites — API modules, network status, offline queue, push notifications, auth store, hooks, ChatScreen + RequestSwap screen, ErrorBoundary, EmptyState. All passing.
- **E2E**: 8 Playwright specs — smoke, auth flow, anonymous browsing, legal pages, navigation header, locale routing, registration onboarding, map page. Runnable locally.

**Total active suite: 1 682 tests, all green.**

**Gaps**

- **E2E specs not in CI** — see §5; specs run locally but no automated gate prevents an E2E regression from shipping.
- **E2E coverage** could expand for exchange lifecycle (request → accept → confirm → return) and messaging flows.
- **Mobile**: ~24 test files for ~99 TSX source files. Component / screen coverage on mobile is the weakest layer.
- **`packages/shared/`** has no test files yet (CI's `shared` job currently no-ops on assertions but verifies the build).

**Next steps (this area)**

- Wire Playwright into CI (see §5); expand E2E for complete-exchange and messaging journeys; broaden mobile component testing; add at least smoke schema-validation tests to `packages/shared/`.

---

## 8. Documentation

**Score: 4 / 5**

**In place**

- **ADRs** — JWT cookies, PostGIS, Celery queues, factory_boy, UUID PKs (`docs/adr/`).
- **Technical architecture** — `docs/BookSwap_Technical_Architecture.md`.
- **PRD + user stories** — `docs/BookSwap_PRD_Phase1_MVP.md`, `docs/BookSwap_User_Stories_Spec.md`.
- **OpenAPI via drf-spectacular** — schema endpoint (`/api/v1/schema/docs/`), `extend_schema` decorators on views.
- **Deployment runbook** — `DEPLOYMENT-RUNBOOK.md`.
- **Incident response playbook** — `docs/INCIDENT-RESPONSE-PLAYBOOK.md` (severity matrix, on-call, first-15-min checklist, fix procedures, rollback, comms template, postmortem template).
- **DPIA (location data)** — `docs/DPIA-location-data.md`.
- **Adversarial / security review** — `docs/adversarial-review/adversarial-review-2026-04-20.md` + `security-action-plan.md` (machine-readable, status-tracked).
- **Deep audit** — `docs/deep-audit/deep-audit-2026-04-24.md`.
- **Production launch action plan** — `docs/production-launch-action-plan.md` (Track A complete, Tracks B/C ongoing).
- **Mobile production readiness** — `docs/mobile-production-readiness-2026-04-21.md` (97/100, ground-truth audit across 60+ checkpoints).
- **Store submission** — `docs/store-submission/` with EN/FR/NL listings, BUILD-AND-SUBMIT, screenshot checklist, Google Sign-In setup, store-setup guide.
- **Gap analyses** — mobile-web parity, mobile-backend audit, frontend audit.

**Gaps**

- DPIA scope still limited to location — messaging + image-upload assessments outstanding (tracked in §2).
- One-page disaster recovery doc (RPO/RTO + restore drill log) pending.

**Next steps (this area)**

- Add `docs/DISASTER-RECOVERY.md` (1 page); expand DPIA to messaging + uploads.

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

**Score: 5 / 5**

**In place**

- **iOS submitted to App Store Review (2026-05-01 22:52 CEST)** — build `1.0.0 (8)`, status: *Waiting for Review*. Manual release configured (operator clicks *Release This Version* once Apple approves). Available on TestFlight throughout submission window. See `docs/RELEASE-DAY-RUNBOOK.md` for the post-approval flow.
- **Android already on Play production track (2026-04-30)** — no changes needed for the iOS launch.
- **iOS submission scope** — iPhone-only (`supportsTablet: false`), ~169 countries with China / Korea / Russia deselected, full EN / FR / NL store listings, 9 iPhone screenshots @ 1284×2778, dedicated reviewer test account `reviewer@bookswaps.com` with seeded book listing, DSA trader disclosure with `book-swaps.com`, privacy policy at `book-swaps.com/en/privacy-policy`, encryption declared exempt via `ITSAppUsesNonExemptEncryption: false` baked into Info.plist.
- **Full Expo app** with SpeakLinka-parity architecture — Expo SDK 54, React Native 0.81, ~99 TSX files, ~35 registered screens.
- **Sentry mobile production-grade** (`mobile/src/lib/sentry.ts`):
  - Release tracking: `com.gnimoh.bookswap@${APP_VERSION}` from `expo.version`.
  - Distribution tracking: EAS update ID as `dist` (OTA-vs-native rebuild distinguishable in release health).
  - PII scrubbing on auth headers, sensitive URL/query params, sensitive object keys, > 512 char truncation.
  - React Navigation integration with time-to-initial-display tracing.
- **Push notifications operational** end-to-end:
  - FCM v1 + APNs credentials configured and verified on real devices.
  - Android `channel_id="default"` set so Android 8+ never silently drops pushes.
  - **Two-phase delivery reconciled** via `notifications.check_push_receipts` (every 15 min) — APNs/FCM rejections after Expo accepted the ticket flip the ticket to `error` and deactivate the dead device row instead of retrying forever.
- **Store submission package complete** — EN/FR/NL store listings, build & submit guide, Google Sign-In setup, screenshot checklist (`docs/store-submission/`).
- **App version sync gate in CI** — `app.json ↔ package.json` mismatch fails the build.
- **OTA pipeline** — `eas update --environment production` profile available (`update:prod` script); chat-self-heal and logout-on-close fixes were both shipped via OTA without store re-review.
- **Mobile-specific production audit at 97/100** — `docs/mobile-production-readiness-2026-04-21.md`.
- **Bug fixes shipped post-launch (2026-04-30 → 2026-05-01)** via OTA: logout-on-close race in secure storage; chat self-heals on every WS reconnect + screen focus; onboarding GPS button width; network-toast debouncing; Google profile photo auto-saves on first sign-in.

**Gaps**

- **Sentry crash-free session rate** still in 24-hour soak window (target ≥ 99.5%).
- **Mobile component test coverage** still thinner than web (~24 test files for ~99 sources) — quality gate, not a launch blocker.
- **Privacy labels in store consoles** to be cross-checked against the DPIA.

**Next steps (this area)**

- Watch crash-free session rate for the next ~20 hours; broaden component test coverage in the first post-launch sprint; verify privacy labels match the DPIA in App Store Connect + Play Console.

---

## Next Actions (prioritized)

Priority reflects risk and unlocks for a calm production launch; reorder as business constraints change.

| Priority | Action | Area | Status |
|----------|--------|------|--------|
| ~~P0~~ | ~~Rate limit auth endpoints~~ | ~~§1~~ | **Done** — AuthThrottleMiddleware (20/min general, 5/min sensitive) |
| ~~P0~~ | ~~Backups + tested restore path for Postgres~~ | ~~§4~~ | **Done** — backup.sh + cron + GPG; `backup-monitor.sh` reports daily |
| ~~P0~~ | ~~OpenAPI / drf-spectacular as API contract~~ | ~~§8~~ | **Done** — schema endpoint live |
| ~~P1~~ | ~~Input size limits (proxy + app)~~ | ~~§3~~ | **Done** — Django + gunicorn at 10 MB |
| ~~P1~~ | ~~Add coverage thresholds to CI~~ | ~~§7~~ | **Done** — backend `--cov-fail-under=80` enforced |
| ~~P1~~ | ~~DPIA for location data~~ | ~~§2~~ | **Done** — `docs/DPIA-location-data.md` |
| ~~P1~~ | ~~External uptime monitoring + error-rate alerting~~ | ~~§6~~ | **Done 2026-04-29** — UptimeRobot 3 monitors + Sentry rules (5/4/4) + Telegram digests |
| ~~P1~~ | ~~Incident response playbook~~ | ~~§8~~ | **Done 2026-04-29** — `docs/INCIDENT-RESPONSE-PLAYBOOK.md` |
| ~~P1~~ | ~~Mobile device matrix + store submission~~ | ~~§10~~ | **Done 2026-04-30** — iOS TestFlight live, Android promoted to Play production |
| ~~P0~~ | ~~Submit iOS app to App Store Review~~ | ~~§10~~ | **Done 2026-05-01** — `1.0.0 (8)` in Apple's queue. Release runbook in `docs/RELEASE-DAY-RUNBOOK.md` |
| ~~P1~~ | ~~Push notification delivery reconciliation~~ | ~~§6 / §10~~ | **Done 2026-05-01** — Expo receipt poller every 15 min + dead-token deactivation |
| ~~P1~~ | ~~Ops digest (catalogue + funnel snapshot)~~ | ~~§6~~ | **Done 2026-05-01** — `bookswap-ops-digest.sh` every 4h to Telegram |
| ~~P1~~ | ~~Pi5 step-1 scaling tuning~~ | ~~§4 / §9~~ | **Done 2026-05-01** — cgroup CPU + memory limits, Celery=4, `pg_stat_statements`, lower pi-health thresholds, Pi snapshot in ops digest. See `docs/SCALING-PLAYBOOK.md` |
| ~~P0~~ | ~~Reboot Pi to activate memory cgroup~~ | ~~§4~~ | **Done 2026-05-01** — `cgroup_enable=memory cgroup_memory=1` applied + reboot completed. `docker stats` now reports real `MEM USAGE / LIMIT` on every container; `pi-health.sh` has a tripwire if it ever regresses |
| ~~P1~~ | ~~BookSwap-dedicated monitoring + bot~~ | ~~§6~~ | **Done 2026-05-01** — separate Telegram channel + 5 cron monitors (container/endpoint/backup/sentry/abuse) + read-only systemd bot for `/status`/`/digest`/`/sentry`/`/abuse`/`/health`/`/containers`. Critical Pi-wide alerts mirror to the BookSwap channel. See `docs/MONITORING-PLAYBOOK.md` |
| **P0** | **Rotate the BookSwap bot token via BotFather** | §6 | Pending — token was pasted into chat during setup. `BOOKSWAP_TELEGRAM_BOT_TOKEN` in `~/.bookswap-monitor-env` on Pi. Run `/revoke` in BotFather, update the env file, `sudo systemctl restart bookswap-bot`. ~2 min, no downtime |
| P1 | Wire Playwright E2E into `ci.yml` | §5 / §7 | Pending — 8 specs runnable locally, no automated gate (post-launch polish) |
| **P0** | **Click *Release This Version* once Apple approves iOS 1.0.0 (8)** | §10 | Pending Apple review (24–48h typical). Release flow + rollback in `docs/RELEASE-DAY-RUNBOOK.md` |
| P1 | Set up ASC API monitoring (review-state Telegram pings) | §6 / §10 | Pending — needs ASC API key + .p8 file from operator. Public-store appearance check (`bookswap-asc-public-check.sh`) handles the "is it live yet" half |
| P2 | Soak window: Sentry crash-free session rate ≥ 99.5% | §10 | In progress — 24h soak after 2026-04-30 store release |
| P2 | Verify store privacy labels match DPIA | §10 | **Done 2026-05-01** — App Privacy reviewed during submission: 8 data types correctly classified (App Functionality / Analytics, no Other Purposes), privacy URL fixed to `book-swaps.com/en/privacy-policy` |
| P2 | Expand DPIA to cover messaging + image uploads | §2 | Pending |
| P2 | Orphaned-media TTL sweep | §2 | Pending — `enforce-data-retention` covers users/tokens/sessions/audit, not yet media |
| P2 | Enable `USE_S3=true` in staging using bundled MinIO | §4 | Pending — code scaffolded, only env flip + smoke remains |
| P2 | One-page disaster recovery doc + tested restore drill | §4 / §8 | Pending |
| P2 | Smoke load test (k6/artillery on staging) | §9 | Pending |
| P3 | Location encryption at rest decision + implementation | §2 | Pending |
| P3 | Expand E2E for complete-exchange + messaging journeys | §7 | Pending |
| P3 | Mobile component test coverage ≥ 40 files | §7 / §10 | Pending |
| P3 | API versioning policy beyond `/v1/` | §3 | Pending |
| P3 | APM + structured log aggregation (Loki / Tempo / OTel) | §6 | Pending |
| P3 | SAST scanner (CodeQL) | §5 | Pending |
| P3 | Define formal SLOs (p95 latency, availability, error budget) | §6 | Pending |

---

## How to update this document

1. Bump **Last reviewed** when any score or major gap changes.
2. Adjust per-section **Score** when work closes gaps (use team evidence: tests, dashboards, merged ADRs).
3. Move completed items from **Next Actions** into section text under **In place**, and add new gaps as they are discovered.
