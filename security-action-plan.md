# BookSwap — Security Action Plan

This document records findings from a security audit of the BookSwap stack:

- **Backend**: Django 5, DRF, nimoh-be-django-base (JWT in httpOnly cookies, CSRF protection)
- **Web**: React 19, Vite (access token in Zustand memory, refresh in httpOnly cookie)
- **Mobile**: Expo (tokens in SecureStore, `X-Client-Type: mobile` header)
- **Data**: PostgreSQL with PostGIS (location data), Redis (sessions, Celery broker)
- **Hosting**: Raspberry Pi 5, Cloudflare Tunnel

Each item uses the status legend: **Pending** (not started), **In Progress** (work underway), **Resolved** (verified complete).

---

### SEC-001: Rate limiting on authentication endpoints
- **Severity**: High
- **Status**: ❌ Pending
- **Description**: Login, registration, password reset, token refresh, and similar auth-related endpoints are not consistently protected by per-IP and per-account rate limits. Brute-force and credential-stuffing attempts may proceed at high volume without throttling or lockout signals.
- **Risk**: Account takeover via password guessing, enumeration of valid accounts, and denial-of-service against auth infrastructure. Abuse can also inflate infrastructure cost and degrade service for legitimate users.
- **Fix**: Add application-level rate limiting (e.g. Django `django-ratelimit` or middleware backed by Redis) on all authentication and token endpoints. Use stricter limits for failed attempts than for successes. Return generic errors to avoid user enumeration. Log and optionally alert on repeated violations. Align mobile and web clients with the same limits.
- **Resolved**: —

### SEC-002: Location data encryption at rest
- **Severity**: Medium
- **Status**: ❌ Pending
- **Description**: PostGIS stores user and listing locations. Volume-level encryption may exist on the Pi, but there is no documented application-level or column-level encryption for sensitive location fields.
- **Risk**: If backups or disks are exposed, precise user locations could be recovered, enabling physical tracking or profiling.
- **Fix**: Confirm full-disk or volume encryption on PostgreSQL data directories and backup storage. Evaluate PostgreSQL TDE or pgcrypto for highly sensitive fields if required by policy. Document key management and restrict backup access. Review data retention for location history.
- **Resolved**: —

### SEC-003: API input size limits / request body validation
- **Severity**: Medium
- **Status**: ❌ Pending
- **Description**: Global limits on request body size and strict validation on large payloads (e.g. chat messages, book metadata, file uploads) may be incomplete or inconsistent across ASGI/DRF routes.
- **Risk**: Large payloads can cause memory exhaustion, slow requests, or abuse of parsing paths. Unvalidated large inputs increase risk of unexpected serializer behavior or downstream errors.
- **Fix**: Configure reverse proxy and ASGI server max body sizes. Add DRF `DEFAULT_PARSER_CLASSES` and per-view `parser_classes` with sensible limits. Use Zod/shared schemas on clients where applicable. Reject oversized JSON early with 413. Document limits in API docs.
- **Resolved**: —

### SEC-004: Container image scanning in CI
- **Severity**: Medium
- **Status**: ❌ Pending
- **Description**: Docker images built for Pi5 deployment are not systematically scanned for known vulnerabilities in base layers and installed packages before deploy.
- **Risk**: Deploying images with critical CVEs in OS or runtime packages increases exposure if containers are reachable or compromised.
- **Fix**: Integrate Trivy, Grype, or GitHub Advanced Security container scanning into CI on every image build. Fail builds on Critical/High findings or require explicit waiver. Pin base image digests where practical and rebuild regularly.
- **Resolved**: —

### SEC-005: Database backup encryption
- **Severity**: Medium
- **Status**: ❌ Pending
- **Description**: Scheduled `pg_dump` backups may be stored on disk or synced without additional encryption beyond filesystem permissions.
- **Risk**: Backup theft or mis-copied files could expose full database contents including PII and PostGIS location data.
- **Fix**: Encrypt backups at rest (e.g. `gpg` symmetric encryption, or restic/rclone to encrypted remote). Store keys outside the backup directory with least privilege. Rotate keys per policy. Verify restore drills from encrypted artifacts.
- **Resolved**: —

### SEC-006: Session fixation on login
- **Severity**: Low
- **Status**: ❌ Pending
- **Description**: If session identifiers are reused across the anonymous and authenticated phases without rotation, an attacker who fixed a session ID before login could potentially hijack the post-login session.
- **Risk**: Low in typical JWT-cookie setups if sessions are not server-side bound to pre-auth identifiers; still worth verifying for any Django session or Channels session usage around login.
- **Fix**: On successful authentication, invalidate prior session and issue new session ID or rely exclusively on new JWT pair with rotation. Ensure `SESSION_COOKIE_SECURE`, `HttpOnly`, `SameSite` are set correctly in production. Add test that login replaces prior session/cookies.
- **Resolved**: —

### SEC-007: CORS wildcard check for production
- **Severity**: Low
- **Status**: ❌ Pending — verify no wildcards
- **Description**: Production must not use `CORS_ORIGIN_ALLOW_ALL` or wildcard origins with credentials. Misconfiguration could allow untrusted sites to call the API with user cookies in some setups.
- **Risk**: Cross-origin data exfiltration or unauthorized API use from malicious sites if origins are too permissive.
- **Fix**: Audit `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` in production settings. List explicit HTTPS origins only. Re-run audit after domain or tunnel changes. Document allowed origins for staging vs production.
- **Resolved**: —

### SEC-008: Dependency vulnerability monitoring
- **Severity**: Low
- **Status**: ✅ Resolved
- **Description**: Python and JavaScript dependencies need continuous monitoring for known vulnerabilities.
- **Risk**: Unpatched dependencies can introduce exploitable flaws in the application or build pipeline.
- **Fix**: Run `pip-audit` (or equivalent) in CI for the backend; enable Dependabot (or Renovate) for `package.json` / lockfiles. Block merges on unresolved Critical issues per team policy.
- **Resolved**: pip-audit + Dependabot in CI (verify pipeline and repo settings).

### SEC-009: Mobile certificate pinning
- **Severity**: Medium
- **Status**: ❌ Pending — infra exists but not configured for BookSwap
- **Description**: The Expo mobile app trusts the system CA store. Organization-level pinning infrastructure may exist elsewhere but is not wired to BookSwap API endpoints.
- **Risk**: On compromised networks, MITM proxies with user-installed roots could intercept TLS and tokens unless pinning or strong secondary checks exist.
- **Fix**: Configure SSL pinning for production API host(s) in the Expo app (e.g. `expo-ssl-pinning` or equivalent), with update path for certificate rotation. Document operational steps for Cloudflare cert renewals.
- **Resolved**: —

### SEC-010: Push notification token validation
- **Severity**: Low
- **Status**: ❌ Pending
- **Description**: Device push tokens (Expo/FCM/APNs) may be registered without strict validation that they belong to the authenticated user’s device or app build.
- **Risk**: Token squatting or registration of arbitrary tokens could lead to misdirected notifications or minor information leakage via notification content.
- **Fix**: Bind token registration to authenticated user; validate token format; rate-limit token updates; optionally verify app attestation for sensitive flows. Remove tokens on logout and on repeated invalid delivery errors.
- **Resolved**: —

---

*Last updated: 2026-04-15*
