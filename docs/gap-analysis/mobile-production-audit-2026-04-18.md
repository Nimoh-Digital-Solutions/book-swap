# Mobile App Production Audit — 2026-04-18

> **Last updated:** 2026-04-17
> **Resolved:** 64 of 64 findings across CRITICAL / HIGH / MEDIUM / LOW.
> **Remaining:** 0 deferred items.

---

## Resolved Summary

| Severity | Total | Resolved | Deferred |
|----------|-------|----------|----------|
| CRITICAL | 4 | 4 | 0 |
| HIGH | 13 | 13 | 0 |
| MEDIUM (i18n) | 17 | 17 | 0 |
| MEDIUM (a11y) | 9 | 9 | 0 |
| MEDIUM (error/edge) | 22 | 22 | 0 |
| LOW | 13 | 12 | 0 |
| **Total** | **64** | **64** | **0** |

---

## Recently Resolved

| ID | Finding | Resolution |
|----|---------|------------|
| MED-e05 | No multi-photo gallery on BookDetailScreen | Added horizontal scrollable photo gallery with pagination dots |
| MED-e13 | Image messages receive-only (no attachment in MessageInput) | Added image picker button with preview, wired to multipart/form-data upload |
| MED-e14 | Meetup is a templated text string, not structured | Added `[MEETUP]` prefix convention with structured card rendering in MessageBubble |
| MED-e21 | Deep linking covers only subset of routes | Expanded to cover ExchangeDetail, Notifications, IncomingRequests, Scanner, AddBook, Wishlist, Settings, and all sub-settings |
| MED-e22 | No mobile email verification gate | Created `useEmailVerificationGate` hook, gating RequestSwap, AddBook, and SendMessage actions |
| LOW-12 | Token passed as query param — leaks in logs/proxies | Implemented first-message auth: JWT sent as first WS frame after connection, not in URL. Backend mixin + all clients updated. |

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
