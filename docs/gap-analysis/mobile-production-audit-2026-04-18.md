# Mobile App Production Audit — 2026-04-18

> **Last updated:** 2026-04-18
> **Resolved:** 63 of 64 findings across CRITICAL / HIGH / MEDIUM / LOW.
> **Remaining:** 1 deferred item for v2.

---

## Resolved Summary

| Severity | Total | Resolved | Deferred |
|----------|-------|----------|----------|
| CRITICAL | 4 | 4 | 0 |
| HIGH | 13 | 13 | 0 |
| MEDIUM (i18n) | 17 | 17 | 0 |
| MEDIUM (a11y) | 9 | 9 | 0 |
| MEDIUM (error/edge) | 22 | 22 | 0 |
| LOW | 13 | 11 | 0 |
| **Total** | **64** | **63** | **1** |

---

## Recently Resolved (MEDIUM feature enhancements)

| ID | Finding | Resolution |
|----|---------|------------|
| MED-e05 | No multi-photo gallery on BookDetailScreen | Added horizontal scrollable photo gallery with pagination dots |
| MED-e13 | Image messages receive-only (no attachment in MessageInput) | Added image picker button with preview, wired to multipart/form-data upload |
| MED-e14 | Meetup is a templated text string, not structured | Added `[MEETUP]` prefix convention with structured card rendering in MessageBubble |
| MED-e21 | Deep linking covers only subset of routes | Expanded to cover ExchangeDetail, Notifications, IncomingRequests, Scanner, AddBook, Wishlist, Settings, and all sub-settings |
| MED-e22 | No mobile email verification gate | Created `useEmailVerificationGate` hook, gating RequestSwap, AddBook, and SendMessage actions |

---

## Remaining Deferred Items

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
| **B-2: 1-3 condition photos on AddBook** | Photos available on edit only; not on initial add screen |
