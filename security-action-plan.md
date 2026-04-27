# BookSwap — Security Action Plan

This document records findings from a security audit of the BookSwap stack:

- **Backend**: Django 5, DRF, nimoh-be-django-base (JWT in httpOnly cookies, CSRF protection)
- **Web**: React 19, Vite (access token in Zustand memory, refresh in httpOnly cookie)
- **Mobile**: Expo (tokens in SecureStore, `X-Client-Type: mobile` header)
- **Data**: PostgreSQL with PostGIS (location data), Redis (sessions, Celery broker)
- **Hosting**: Raspberry Pi 5, Cloudflare Tunnel

Each item uses the status legend: **Pending** (not started), **In Progress** (work underway), **Resolved** (verified complete).

## Implementation Report
Implemented: 2026-04-15
Implemented by: Claude Security Implement Skill

| Status | Count |
|--------|-------|
| ✅ Done | 7 |
| 🔁 Manual required | 2 |
| ✅ Previously resolved | 1 |

---

### SEC-001: Rate limiting on authentication endpoints
- **Severity**: High
- **Status**: ✅ Resolved
- **Description**: Login, registration, password reset, token refresh, and similar auth-related endpoints are not consistently protected by per-IP and per-account rate limits.
- **Risk**: Account takeover via password guessing, enumeration of valid accounts, and denial-of-service against auth infrastructure.
- **Fix**: Add application-level rate limiting via DRF throttle classes with per-scope rates.
- **Resolved**: 2026-04-15
- **Implementation Note**: Added global `AnonRateThrottle` (100/hour) and `UserRateThrottle` (1000/hour) in `config/settings/base.py` via `REST_FRAMEWORK` dict. Added custom `AuthRateThrottle` (20/min) and `AuthSensitiveRateThrottle` (5/min) in `bookswap/throttles.py` for per-view use on auth endpoints. Login view already had `AuthenticationRateThrottle` from nimoh_base. Test settings disable throttling for test isolation. pytest passes (444/444).

### SEC-002: Location data encryption at rest
- **Severity**: Medium
- **Status**: 🔁 Manual required
- **Description**: PostGIS stores user and listing locations. Volume-level encryption may exist on the Pi, but there is no documented application-level or column-level encryption for sensitive location fields.
- **Risk**: If backups or disks are exposed, precise user locations could be recovered, enabling physical tracking or profiling.
- **Fix**: Confirm full-disk or volume encryption on PostgreSQL data directories and backup storage.
- **Resolved**: —
- **Manual Steps**:
  1. Verify LUKS or equivalent full-disk encryption on the Pi5's storage volume
  2. Ensure PostgreSQL `data_directory` resides on an encrypted partition
  3. Backups are now GPG-encrypted via `infra/backup.sh` (see SEC-005)
  4. Document key management and rotation in the deployment runbook
  5. Evaluate `pgcrypto` for column-level encryption of lat/lng if regulatory requirements demand it

### SEC-003: API input size limits / request body validation
- **Severity**: Medium
- **Status**: ✅ Resolved
- **Description**: Global limits on request body size and strict validation on large payloads were not configured.
- **Risk**: Large payloads can cause memory exhaustion, slow requests, or abuse of parsing paths.
- **Fix**: Configure Django and Gunicorn max body sizes.
- **Resolved**: 2026-04-15
- **Implementation Note**: Added `DATA_UPLOAD_MAX_MEMORY_SIZE` (10 MB), `DATA_UPLOAD_MAX_NUMBER_FIELDS` (1000), `FILE_UPLOAD_MAX_MEMORY_SIZE` (10 MB) in `config/settings/base.py`. Added `limit_request_body` (10 MB), `limit_request_line` (8190), `limit_request_fields` (100) in `config/gunicorn.py`. pytest passes (444/444).

### SEC-004: Container image scanning in CI
- **Severity**: Medium
- **Status**: ✅ Resolved
- **Description**: Docker images built for Pi5 deployment were not scanned for known vulnerabilities.
- **Risk**: Deploying images with critical CVEs in OS or runtime packages.
- **Fix**: Integrate Trivy container scanning into CI.
- **Resolved**: 2026-04-15
- **Implementation Note**: Added `container-scan` job to `.github/workflows/ci.yml` using `aquasecurity/trivy-action@master`. Scans both backend and frontend Docker images. Fails on CRITICAL/HIGH severity, ignores unfixed CVEs.

### SEC-005: Database backup encryption
- **Severity**: Medium
- **Status**: ✅ Resolved
- **Description**: Scheduled `pg_dump` backups were stored without additional encryption.
- **Risk**: Backup theft could expose full database contents including PII and location data.
- **Fix**: Encrypt backups at rest with GPG symmetric encryption.
- **Resolved**: 2026-04-15
- **Implementation Note**: Rewrote `infra/backup.sh` with AES-256 GPG symmetric encryption (`BACKUP_GPG_PASSPHRASE` env var). Encrypted files get `.gpg` extension. Restore instructions included in script output. Added `BACKUP_GPG_PASSPHRASE` to `.env.example`. Falls back to unencrypted with warning if passphrase not set.

### SEC-006: Session fixation on login
- **Severity**: Low
- **Status**: ✅ Resolved
- **Description**: Session identifiers could theoretically be reused across anonymous and authenticated phases.
- **Risk**: Low in JWT-cookie setups; verified and mitigated.
- **Fix**: Rotate session key on successful login.
- **Resolved**: 2026-04-15
- **Implementation Note**: Added `request.session.cycle_key()` call after successful authentication in `login_view` (`bookswap/views.py`). Session cookie flags (`SESSION_COOKIE_SECURE`, `HttpOnly`, `SameSite`) are set by `NimohBaseSettings.get_base_security_settings()` — verified correct in both `base.py` (dev) and `production.py` (HTTPS). pytest passes (444/444).

### SEC-007: CORS wildcard check for production
- **Severity**: Low
- **Status**: ✅ Resolved
- **Description**: Production must not use CORS_ORIGIN_ALLOW_ALL or wildcard origins with credentials.
- **Risk**: Cross-origin data exfiltration from malicious sites.
- **Fix**: Audit and harden CORS/CSRF configuration.
- **Resolved**: 2026-04-15
- **Implementation Note**: Verified no `CORS_ALLOW_ALL_ORIGINS` or `CORS_ORIGIN_ALLOW_ALL` in codebase. Added explicit `CORS_ALLOW_ALL_ORIGINS = False` in `production.py`. Added `CSRF_TRUSTED_ORIGINS` (auto-derived from HTTPS entries in `CORS_ALLOWED_ORIGINS`). Added HSTS hardening (`SECURE_HSTS_SECONDS`, `INCLUDE_SUBDOMAINS`, `PRELOAD`). Added `CSRF_TRUSTED_ORIGINS` to `.env.example`. pytest passes (444/444).

### SEC-008: Dependency vulnerability monitoring
- **Severity**: Low
- **Status**: ✅ Resolved (previously)
- **Description**: Python and JavaScript dependencies need continuous monitoring for known vulnerabilities.
- **Risk**: Unpatched dependencies can introduce exploitable flaws.
- **Fix**: Run `pip-audit` in CI; enable Dependabot.
- **Resolved**: pip-audit + Dependabot in CI.

### SEC-009: Mobile certificate pinning
- **Severity**: Medium
- **Status**: 🔁 Manual required
- **Description**: The Expo mobile app trusts the system CA store without certificate pinning for the BookSwap API.
- **Risk**: On compromised networks, MITM proxies with user-installed roots could intercept TLS and tokens.
- **Fix**: Configure SSL pinning in the Expo app for production API hosts.
- **Resolved**: —
- **Manual Steps**:
  1. Install `expo-ssl-pinning` or equivalent certificate pinning library in `mobile/`
  2. Extract the Cloudflare origin certificate's public key hash (SHA-256 of SPKI)
  3. Configure pinning for `api.bookswap.app` and `api-stag.bookswap.app`
  4. Implement a certificate rotation strategy (backup pins, OTA update for pin changes)
  5. Document Cloudflare cert renewal process and how to update pins
  6. Test on physical devices — pinning does not work in Expo Go, only in dev client / standalone builds

### SEC-010: Push notification token validation
- **Severity**: Low
- **Status**: ✅ Resolved
- **Description**: Device push tokens could be registered without format validation or device limits.
- **Risk**: Token squatting or registration of arbitrary tokens could lead to misdirected notifications.
- **Fix**: Validate token format, enforce device limits, bind to authenticated user.
- **Resolved**: 2026-04-15
- **Implementation Note**: Added `validate_push_token()` to `MobileDeviceSerializer` — validates Expo, FCM, and APNs token formats with regex patterns, enforces max length. Added `validate()` to enforce 10-device-per-user limit to prevent token squatting. Registration already requires `IsAuthenticated`. pytest passes (444/444).

---

### Manual Action Required

1. **SEC-002 — Location data encryption**: Verify LUKS full-disk encryption on Pi5; evaluate `pgcrypto` if regulatory requirements demand column-level encryption
2. **SEC-009 — Mobile certificate pinning**: Install `expo-ssl-pinning`, extract Cloudflare cert hashes, configure in the Expo app, test on physical device builds

### Next Steps
- [ ] Set `BACKUP_GPG_PASSPHRASE` in production environment
- [ ] Set `CSRF_TRUSTED_ORIGINS` in production environment
- [ ] Verify LUKS encryption on Pi5 storage
- [ ] Re-run the `security-audit` skill to verify no regressions

*Last updated: 2026-04-15*
