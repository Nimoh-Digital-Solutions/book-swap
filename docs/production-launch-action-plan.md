# BookSwap Production Launch — Action Plan

> **Target launch date**: Thursday 2026-04-30
> **Days remaining when this plan was written**: 4 calendar days (Sun–Thu)
> **Source of gaps**: `PRODUCTION-READINESS.md` (last reviewed 2026-04-26)
> **Starting position**: Web 82.2% · Mobile 82.5% on BookSwap rubric (97% on mobile deep audit)

---

## TL;DR — what must happen this week

The 4-day window is tight but realistic **if mobile builds get cut today**. Web can ship any day once monitoring + an incident playbook are in place. Mobile is the pacing item because it needs App Store + Google Play review.

| Track | # items | What | Must land by |
|-------|---------|------|--------------|
| **A — Launch blockers** | 6 | Mobile builds/submission, uptime, alerting, IR playbook, E2E in CI | Wed 2026-04-29 |
| **B — Ship if time permits** | 4 | MinIO enable, DR plan, smoke load test, bundle CDN check | Wed 2026-04-29 |
| **C — Post-launch hardening** | 9 | APM, structured logs, retention jobs, location encryption, SAST, etc. | First 30 days after launch |

**Daily checklist**
- **Sun 26** — cut TestFlight + Play Internal Testing builds · uptime monitoring · Playwright → CI
- **Mon 27** — submit mobile to both stores · Sentry alert rules · IR playbook · MinIO in staging
- **Tue 28** — smoke load test staging · wait on review · go/no-go dry-run
- **Wed 29** — final QA on staging · rehearse rollback · team sign-offs
- **Thu 30** — **Launch day**: go/no-go meeting, promote staging → prod, release mobile if approved, 24h watch

---

## Launch readiness dashboard

| Dimension | Score | Blocker for launch? | What's still needed |
|-----------|-------|---------------------|---------------------|
| §1 Auth & AuthZ | 5/5 | No | — |
| §2 Data Protection & Privacy | 4/5 | No | Retention jobs + at-rest (post-launch) |
| §3 API Security | 5/5 | No | Versioning policy (post-launch) |
| §4 Infrastructure | 4/5 | No | MinIO enable (nice-to-have), DR plan (nice-to-have) |
| §5 CI/CD | 5/5 | No | Playwright job (Track A polish) |
| §6 Observability | 3/5 | **Partial** | Uptime + minimal alerting = Track A |
| §7 Testing | 4/5 | No | E2E in CI = Track A |
| §8 Documentation | 4/5 | **Partial** | IR playbook = Track A |
| §9 Performance | 3/5 | No | Smoke load test = Track B |
| §10 Mobile Readiness | 4/5 | **Yes (mobile)** | Device matrix + store submission = Track A |

---

## Track A — Launch blockers

These MUST land before Thursday. Everything here is scoped to fit in the 4-day window.

### PROD-A1 · Device matrix + TestFlight / Play Internal Testing

**Area**: §10 Mobile Readiness &nbsp;·&nbsp; **Effort**: Medium (1–2 days incl. review wait) &nbsp;·&nbsp; **Blocker**: Yes (for mobile launch) &nbsp;·&nbsp; **Status**: Pending

**The gap.** Mobile app has only been exercised on simulators. Before store submission, it needs to run successfully on physical iOS + Android devices across a representative OS/version range.

**Action steps**
1. Confirm `app.json` `expo.version` and `package.json` `version` are in sync (CI already enforces).
2. Build the production profiles:
   - `eas build --platform ios --profile production`
   - `eas build --platform android --profile production`
3. Distribute via TestFlight (iOS) + Google Play Internal Testing (Android).
4. Test on device matrix:
   - iOS: at least one iPhone on latest iOS + one on iOS 16 or older (to cover the bulk of the install base).
   - Android: at least one device on API 34 (Android 14) + one on API 26–29 (Android 8–10).
5. Run the full smoke flow on each: launch → register → verify email → add a book → search map → swipe / filter → send a message → accept an exchange → rate → logout → re-login with biometric.
6. Watch Sentry for any new issues during testing; require crash-free session rate ≥ 99.5% before submitting.
7. Submit to App Store Connect + Google Play Console using assets from `docs/store-submission/`.

**Acceptance criteria**
- [ ] Production build succeeds for both platforms via EAS.
- [ ] Smoke flow passes on 2 iOS + 2 Android devices without crashes.
- [ ] Sentry crash-free sessions ≥ 99.5% on test builds.
- [ ] Submission accepted by both stores (status = "In Review" or later).

**Escape hatch.** If App Store review isn't done by Thu morning, ship web on the 30th and release mobile the moment the app is approved. The web-only launch is still a meaningful milestone.

---

### PROD-A2 · Wire Playwright E2E into CI

**Area**: §5 CI/CD &nbsp;·&nbsp; **Effort**: Small (2–3h) &nbsp;·&nbsp; **Blocker**: No (strong polish) &nbsp;·&nbsp; **Status**: Pending

**The gap.** 8 E2E specs live under `frontend/e2e/` but no CI job runs them, so a Playwright regression can ship unnoticed.

**Action steps**
1. Add an `e2e` job to `.github/workflows/ci.yml`:
   - Matrix on Chromium only (keep fast for the gate; Firefox/Safari can run nightly later).
   - `yarn playwright install chromium --with-deps`.
   - Build the frontend once, serve with `vite preview` behind `start-server-and-test`.
   - Run `yarn playwright test` with `--reporter=blob` and upload the HTML report as an artifact on failure.
3. Make this job `needs: frontend` so it runs after the unit tests.
4. Ensure it uses MSW or mock handlers — do NOT point at a real staging API.

**Acceptance criteria**
- [ ] CI gate fails when any E2E spec fails.
- [ ] Playwright job completes in ≤ 5 min on GitHub runners.
- [ ] HTML report artifact available on failure.

---

### PROD-A3 · Uptime monitoring (external synthetic)

**Area**: §6 Observability &nbsp;·&nbsp; **Effort**: Small (< 1h) &nbsp;·&nbsp; **Blocker**: Yes &nbsp;·&nbsp; **Status**: Pending

**The gap.** The Pi/Cloudflare Tunnel path has no external health check. If the tunnel or container dies, we learn from users.

**Action steps**
1. Sign up for UptimeRobot (free tier: 50 monitors, 5-min interval) OR BetterStack/Pingdom if already in use.
2. Create 3 monitors:
   - `GET https://<prod-domain>/api/v1/health/` — expect 200.
   - `GET https://<prod-domain>/` — expect 200 + contains `<title>`.
   - `GET https://<prod-domain>/api/v1/schema/` — expect 200.
3. Wire alerts to an email group + (optional) Slack/Discord webhook.
4. Add the monitor URLs to `DEPLOYMENT-RUNBOOK.md` and the forthcoming IR playbook.

**Acceptance criteria**
- [ ] 3 monitors live and reporting "Up".
- [ ] Alert test (manually disable health endpoint in staging) produces a notification within 10 min.

---

### PROD-A4 · Minimal Sentry alert rules

**Area**: §6 Observability &nbsp;·&nbsp; **Effort**: Small (1–2h) &nbsp;·&nbsp; **Blocker**: Yes &nbsp;·&nbsp; **Status**: Pending

**The gap.** Sentry captures errors but no alerts fire on spikes, so a silent failure mode can go undetected.

**Action steps**
1. In each Sentry project (backend, frontend, mobile) create these Alert Rules:
   - **Error rate spike**: issue count > 10 events in 5 min → email the team.
   - **New issue in production**: first-seen in `production` environment with `level:error` → email.
   - **Regression**: previously resolved issue reopens in production → email.
2. For backend specifically, add an alert on `transaction.name:celery.*` + `event.type:error` to catch Celery failures.
3. Pin the alert channel in the IR playbook.

**Acceptance criteria**
- [ ] ≥ 3 alert rules active per project.
- [ ] A manually triggered test error in staging fires an email within 5 min.

---

### PROD-A5 · Incident response playbook

**Area**: §8 Documentation &nbsp;·&nbsp; **Effort**: Small (2–3h) &nbsp;·&nbsp; **Blocker**: Yes &nbsp;·&nbsp; **Status**: Pending

**The gap.** No documented roles, severity levels, or communication plan for when something breaks in production.

**Action steps**
1. Create `docs/INCIDENT-RESPONSE-PLAYBOOK.md` with:
   - **Severity matrix**: SEV-1 (site down), SEV-2 (major feature broken), SEV-3 (degraded), SEV-4 (cosmetic).
   - **On-call**: who receives alerts (you, for now).
   - **Communication plan**: where to post status (internal channel + optional status page).
   - **First 15 minutes runbook**: check uptime monitor, check Sentry, check Cloudflare tunnel, check Pi (ssh), check `docker compose logs`.
   - **Rollback trigger**: when to execute the rollback in `DEPLOYMENT-RUNBOOK.md`.
   - **Postmortem template**: what happened / detection / response / impact / root cause / action items.
2. Link it from `README.md` and `DEPLOYMENT-RUNBOOK.md`.

**Acceptance criteria**
- [ ] File exists, committed, ≤ 2 pages.
- [ ] Every Sentry/UptimeRobot alert references this doc.

---

### PROD-A6 · Go/No-Go rehearsal on staging

**Area**: §4 Infra + §7 Testing &nbsp;·&nbsp; **Effort**: Small (2–3h) &nbsp;·&nbsp; **Blocker**: Yes &nbsp;·&nbsp; **Status**: Pending

**The gap.** Staging and production use the same compose files + Pi, but the deploy+rollback sequence hasn't been rehearsed under realistic conditions recently.

**Action steps**
1. Push a benign change to `staging` — confirm auto-deploy workflow succeeds end-to-end.
2. Trigger the production deploy workflow (manual dispatch) to prod — confirm it waits for CI + deploys cleanly.
3. Simulate a rollback using the exact procedure in `DEPLOYMENT-RUNBOOK.md` (revert commit → deploy → verify).
4. Note wall-clock time for each step; add to the IR playbook.

**Acceptance criteria**
- [ ] Staging auto-deploy green.
- [ ] Production manual-dispatch deploy green.
- [ ] Rollback procedure tested and timed (target: ≤ 10 min end-to-end).

---

## Track B — Ship if time permits

Useful hardening that doesn't block launch. Attempt on Mon–Tue if Track A is clean.

### PROD-B1 · Enable `USE_S3=true` in staging with MinIO

**Area**: §4 Infra &nbsp;·&nbsp; **Effort**: Small (3–4h) &nbsp;·&nbsp; **Blocker**: No &nbsp;·&nbsp; **Status**: Pending

**Action steps**
1. Spin up MinIO on staging Pi: `docker compose -f infra/docker-compose.minio.yml up -d`.
2. Set `MINIO_ROOT_USER` + `MINIO_ROOT_PASSWORD` in staging `.env`.
3. In staging backend `.env`, set:
   ```
   USE_S3=true
   AWS_S3_ENDPOINT_URL=http://minio:9000
   AWS_STORAGE_BUCKET_NAME=bookswap-media
   AWS_ACCESS_KEY_ID=<MINIO_ROOT_USER>
   AWS_SECRET_ACCESS_KEY=<MINIO_ROOT_PASSWORD>
   ```
4. Restart backend; upload a book cover via the app; verify URL points at MinIO and file is retrievable.
5. Add MinIO volume to the backup schedule — `mc mirror local/bookswap-media /srv/backups/minio/` in `backup.sh`.

**Acceptance criteria**
- [ ] New uploads go to MinIO in staging.
- [ ] Media URLs are served and cacheable.
- [ ] MinIO data is included in the daily backup.

**Defer to post-launch**: flipping `USE_S3=true` in production. Do that in week 2 after staging has been stable for a few days.

---

### PROD-B2 · One-page disaster recovery plan

**Area**: §4 Infra &nbsp;·&nbsp; **Effort**: Small (1–2h) &nbsp;·&nbsp; **Blocker**: No &nbsp;·&nbsp; **Status**: Pending

**Action steps**
1. Create `docs/DISASTER-RECOVERY.md` with:
   - **RPO** (recovery point objective): max data loss = 24h (daily backup cadence).
   - **RTO** (recovery time objective): target time to restore service = 4h.
   - **Backup location**: where encrypted dumps live, who has the GPG private key.
   - **Restore procedure**: step-by-step `gpg --decrypt` + `pg_restore` on a fresh Pi / VM.
   - **Failover scenarios**: Pi hardware failure, Cloudflare outage, DNS compromise.
   - **Tested restore drill date** (update on each drill).
2. Run one restore drill against a dev database to validate the procedure.

**Acceptance criteria**
- [ ] File exists, < 1 page.
- [ ] One drill completed and timed.

---

### PROD-B3 · Smoke load test

**Area**: §9 Performance &nbsp;·&nbsp; **Effort**: Small (3–4h) &nbsp;·&nbsp; **Blocker**: No &nbsp;·&nbsp; **Status**: Pending

**Action steps**
1. Use `k6` or `artillery` against the staging API.
2. Scenario: 50 concurrent users, 5 min, mix of:
   - Browse nearby books (60%)
   - Open book detail (20%)
   - Search (10%)
   - Send message (10%)
3. Record p50/p95/p99 latency and error rate. Target: p95 < 500 ms, errors < 1%.
4. Note any endpoints that saturate or leak connections; file as post-launch follow-ups if not trivially fixable.

**Acceptance criteria**
- [ ] Test runs to completion.
- [ ] Results captured in a short addendum to this doc.
- [ ] No endpoint has > 5% error rate or p95 > 2s under this load.

---

### PROD-B4 · CDN / cache check for static frontend assets

**Area**: §9 Performance &nbsp;·&nbsp; **Effort**: Small (1–2h) &nbsp;·&nbsp; **Blocker**: No &nbsp;·&nbsp; **Status**: Pending

**Action steps**
1. Verify Cloudflare caching is enabled for `/assets/*` (set a "Cache Everything" page rule if not).
2. Spot-check `Cache-Control` headers from production: hashed assets should have `max-age=31536000, immutable`.
3. Validate that `index.html` is served with `Cache-Control: no-cache` so SPA refreshes pick up new builds.
4. Capture a Lighthouse score from production as a baseline (desktop + mobile).

**Acceptance criteria**
- [ ] Hashed assets serve with a year-long immutable cache.
- [ ] `index.html` is not cached by CDN.
- [ ] Lighthouse performance ≥ 85 on desktop, ≥ 70 on mobile (baseline snapshot, not a hard gate).

---

## Track C — Post-launch hardening (first 30 days)

These don't block Thursday's launch. Schedule them for the first post-launch sprint so momentum stays high.

| ID | Gap | Area | Effort | Suggested week |
|----|-----|------|--------|----------------|
| PROD-C1 | Retention enforcement — Celery Beat TTL jobs for soft-deleted accounts, expired exchange threads, orphaned media | §2 | Medium | Week 1 |
| PROD-C2 | Location encryption at rest — decision + implementation (pgcrypto, application-level, or KMS-backed) | §2 | Large | Week 3–4 |
| PROD-C3 | Expand DPIA to cover messaging + image uploads | §2 | Small | Week 1 |
| PROD-C4 | API versioning policy beyond `/v1/` | §3 | Small | Week 2 |
| PROD-C5 | APM (Sentry Performance or OpenTelemetry → self-hosted Tempo/Jaeger) | §6 | Large | Week 2–3 |
| PROD-C6 | Structured JSON logs + shipping target (Loki, Grafana Cloud, or Papertrail) | §6 | Medium | Week 2 |
| PROD-C7 | SAST scanner (CodeQL via GitHub Actions) | §5 | Small | Week 1 |
| PROD-C8 | Expand E2E for complete-exchange + messaging journeys | §7 | Medium | Week 2 |
| PROD-C9 | Mobile component test coverage — raise from ~19 files to ≥ 40 | §7 / §10 | Large | Week 2–4 |
| PROD-C10 | DB query optimization audit — `django-debug-toolbar` trace of top 20 endpoints, add indexes | §9 | Medium | Week 3 |
| PROD-C11 | Flip `USE_S3=true` in production (after staging stable) | §4 | Small | Week 2 |

---

## Go / No-Go checklist for Thursday 2026-04-30

### Web — promote staging → production

- [ ] All CI jobs green on `main` (backend / frontend / mobile / container-scan / shared / e2e)
- [ ] Last successful encrypted backup < 24h old (verify with `ls -la /srv/backups`)
- [ ] UptimeRobot reporting all monitors "Up" for ≥ 24h
- [ ] Sentry alert rules active in all 3 projects
- [ ] `docs/INCIDENT-RESPONSE-PLAYBOOK.md` merged
- [ ] Rollback procedure rehearsed and timed ≤ 10 min
- [ ] Smoke load test results acceptable (or Track B skipped with awareness)
- [ ] Team sign-off in issue comment or channel

### Mobile — release from store review

- [ ] TestFlight build tested on ≥ 2 iOS devices (1 older, 1 latest) with no SEV-1/2 issues
- [ ] Play Internal Testing build tested on ≥ 2 Android devices (1 API 26–29, 1 API 34) with no SEV-1/2 issues
- [ ] Sentry crash-free session rate ≥ 99.5% on test builds
- [ ] App Store Connect status: "Ready for Sale" or "Pending Developer Release"
- [ ] Google Play Console status: "Ready to publish" or "Published"
- [ ] Privacy labels match the DPIA and store listing

### Escape hatches

- **Mobile not approved by Thu**: launch web-only on 30th, release mobile within 24h of approval.
- **Staging smoke fails**: abort, fix, retry within 24h. No production push without green staging.
- **Critical bug found during Wed QA**: invoke the IR playbook's SEV-2 procedure, defer launch by 48h.

---

## Cross-references

- `PRODUCTION-READINESS.md` — living audit, source of truth for gap definitions and scores
- `DEPLOYMENT-RUNBOOK.md` — operational procedures, rollback, health checks
- `security-action-plan.md` — security-audit action items (most already closed)
- `docs/mobile-production-readiness-2026-04-21.md` — mobile-specific deep audit (97/100)
- `docs/store-submission/BUILD-AND-SUBMIT.md` — step-by-step for app store submission
- `docs/DPIA-location-data.md` — data protection impact assessment for geocoded discovery

---

## Status log

Update this section as items complete. Format: `YYYY-MM-DD HH:MM — PROD-XX — <status>`.

- 2026-04-26 21:20 — Plan created. Starting position: Web 82.2%, Mobile 82.5%.
