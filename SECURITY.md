# BookSwap — Security Fixes

This document tracks security fixes applied to the BookSwap codebase.
Each entry links to the finding ID, commit, and regression test.

For the full adversarial review: `docs/adversarial-review/adversarial-review-2026-04-20.md`
For config/settings findings: `security-action-plan.md`

---

## Fixes

### ADV-101 — Apple Sign-In email spoofing → account takeover (🔴 Critical)
**Category**: Authentication bypass
**Attack**: Attacker with a valid Apple ID could hijack any BookSwap account by supplying the victim's email in the unsigned `request.data["user"]` body when Apple's JWT omitted the email claim.
**Fix**: Reject Apple tokens that lack a verified email in the signed JWT claims; never fall back to client-supplied email. Matches the existing Google auth pattern.
**Test**: `backend/bookswap/tests/test_security_adv101.py`

### ADV-201 — Book status mass assignment bypasses exchange lifecycle (🟠 High)
**Category**: Business logic — mass assignment
**Attack**: Book owner could PATCH `status` from `in_exchange` back to `available` while a swap was active, desynchronizing book and exchange state.
**Fix**: Removed `status` from `BookUpdateSerializer.fields`. Book status is now managed exclusively by exchange lifecycle views (`accept`, `complete`, `return`).
**Test**: `backend/apps/books/tests/test_security_adv201.py`

### ADV-202 — confirm_swap race condition — no row locking (🟠 High)
**Category**: Race condition
**Attack**: Two concurrent `confirm-swap` requests could clobber each other's timestamp, leaving the exchange stuck in ACTIVE with a lost confirmation. With careful timing, `swap_count` could be double-incremented.
**Fix**: Wrapped `confirm_swap` action in `transaction.atomic()` + `select_for_update()` for row-level locking.
**Test**: `backend/apps/exchanges/tests/test_security_adv202_203.py::TestADV202ConfirmSwapRowLocking`

### ADV-203 — Bulk decline skips notifications (🟠 High)
**Category**: Notification integrity
**Attack**: When a request is accepted, competing requests on the same book(s) are auto-declined via `QuerySet.update()`, which bypasses `post_save` signals. Affected requesters never received a decline notification, leaving them in a confusing limbo state.
**Fix**: Collect PKs of competing requests before bulk update, then dispatch `send_request_declined_notification.delay()` for each.
**Test**: `backend/apps/exchanges/tests/test_security_adv202_203.py::TestADV203BulkDeclineNotifications`

### ADV-301 — WebSocket connection flood — no per-user limit (🟠 High)
**Category**: Denial of service
**Attack**: A malicious client could open unlimited WebSocket connections, exhausting server memory and channel-layer capacity.
**Fix**: Added per-user connection counter in Redis cache (`WS_MAX_CONNECTIONS_PER_USER=10`) enforced in `FirstMessageAuthMixin`. Counter is incremented on auth, decremented on disconnect, with a 4h TTL safety net.
**Files**: `backend/bookswap/ws_first_msg_auth.py`, all consumer `disconnect()` methods updated to call `super().disconnect()`.
