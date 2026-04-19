# Mobile App Production Audit — 2026-04-18

> **Last updated:** 2026-04-18
> **Resolved:** 58 of 59 findings across CRITICAL / HIGH / MEDIUM / LOW.
> **Remaining:** 6 deferred items for v2.

---

## Resolved Summary

| Severity | Total | Resolved | Deferred |
|----------|-------|----------|----------|
| CRITICAL | 4 | 4 | 0 |
| HIGH | 13 | 13 | 0 |
| MEDIUM (i18n) | 17 | 17 | 0 |
| MEDIUM (a11y) | 9 | 9 | 0 |
| MEDIUM (error/edge) | 22 | 17 | 5 |
| LOW | 13 | 11 | 1 |
| **Total** | **59** | **58** | **6** |

---

## Remaining Deferred Items

### MEDIUM — Feature enhancements & non-blocking gaps

| ID | Area | Finding | Reason deferred |
|----|------|---------|-----------------|
| MED-e05 | Books | **No multi-photo gallery on BookDetailScreen** despite backend supporting multiple photos. | UI enhancement, not a bug |
| MED-e13 | Messaging | **Image messages receive-only.** `MessageBubble` renders images but `MessageInput` has no attachment. | Feature enhancement |
| MED-e14 | Messaging | **Meetup is a templated text string**, not a structured proposal/confirmation type. | Feature enhancement |
| MED-e21 | Navigation | **Deep linking covers only subset** of routes — missing `ExchangeDetail`, `Notifications`, scan stack, wishlist, settings. | Non-blocking for launch |
| MED-e22 | Trust | **No mobile email verification gate** — web has `EmailVerificationGate` wrapper; mobile relies on API 403 responses. | API 403 fallback acceptable for v1 |

### LOW — Security policy

| ID | Area | Finding | Reason deferred |
|----|------|---------|-----------------|
| LOW-12 | WebSocket | **Token passed as query param** — leaks in logs/proxies. | Requires coordinated backend WS consumer change |

---

## Web Features Still Missing on Mobile

| Web Feature | Notes |
|-------------|-------|
| Profile visibility toggle (`profile_public`) | Web has it in Settings; mobile does not. |
| Public profile "Listed books" section | Web has placeholder; mobile has nothing. |

---

## PRD Requirements Still Pending

| PRD Req | Status |
|---------|--------|
| **E-1: Email verification gate** | DEFERRED (MED-e22) — API 403 fallback works for v1 |
| **B-2: 1-3 condition photos on AddBook** | Photos available on edit only; not on initial add screen |
