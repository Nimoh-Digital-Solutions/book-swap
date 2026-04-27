# ADR-001: JWT Tokens in httpOnly Cookies

**Date:** 2026-04-15
**Status:** Accepted

## Context

BookSwap needs to authenticate API requests from the React frontend (and
eventually a React Native mobile app). The standard approaches are:

1. **Bearer tokens in `Authorization` header** — stored in memory/localStorage
2. **httpOnly cookies** — browser manages storage, immune to XSS token theft
3. **Session-based auth** — traditional server-side sessions

nimoh-be-django-base provides a `Simple JWT` integration that supports both
bearer and cookie-based auth. The frontend architecture uses Zustand for the
short-lived access token in memory and an httpOnly refresh cookie managed by
the browser.

## Decision

Use **httpOnly cookies for the refresh token** and **in-memory Zustand storage
for the access token**. The access token is short-lived (5 minutes) and
refreshed transparently via an Axios interceptor. CSRF protection is enabled:
the frontend fetches a CSRF token on boot and sends it via the `X-CSRFToken`
header.

## Consequences

- **Positive:** Refresh tokens are not accessible to JavaScript, mitigating XSS
  token theft. CSRF is handled by the double-submit cookie pattern.
- **Positive:** Mobile apps can use the same JWT endpoints with bearer header
  instead (nimoh-base's `X-Client-Type` header controls cookie vs header mode).
- **Negative:** Requires `credentials: 'include'` on every fetch and strict
  CORS configuration.
- **Negative:** Slightly more complex than plain bearer tokens — logout must
  clear both the cookie and in-memory state.
