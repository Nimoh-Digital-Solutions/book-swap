# Mobile + Backend Audit — 2026-04-19

> **Scope:** Mobile app (all screens, hooks, services) + Backend API (endpoints, models, tasks, WS)
> **Findings:** 58 total across CRITICAL / HIGH / MEDIUM / LOW

---

## 1. CRITICAL (1)

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| C-01 | Hooks | `BrowseMapScreen.tsx:595-625` | `useMemo` for `snapPoints` runs only when `mapUsable` is true, after early return — hooks ordering violation | **RESOLVED** — Moved `snapPoints` useMemo above the `if (!mapUsable)` early return |

---

## 2. HIGH (12)

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| H-01 | Error states | `BookDetailScreen.tsx` | `useBookDetail` ignores `isError` — API failure shows "Book not found" instead of error+retry | **RESOLVED** — Added `isError`+`refetch` with EmptyState error+retry UI |
| H-02 | Error states | `ScanResultScreen.tsx` | Failed ISBN lookup shows "not found" UI, not error+retry | **RESOLVED** — Added `isError` branch with retry button before "not found" |
| H-03 | Error states | `UserReviewsScreen.tsx` | No `isError` — failed query looks like "No reviews yet" | **RESOLVED** — Added `isError` with EmptyState error+retry |
| H-04 | Error states | `MyReviewsScreen.tsx` | Same as H-03 | **RESOLVED** — Same fix applied |
| H-05 | WS / race | `useChatWebSocket.ts` | Rapid navigation causes WS reconnect storms | **RESOLVED** — Debounced notification WS reconnect with 300ms delay; cancel on re-entry |
| H-06 | Offline | `offlineMutationQueue.ts` | Queue silently drops on native without MMKV | **RESOLVED** — Added AsyncStorage fallback with sync in-memory cache |
| H-07 | Offline | `useMessages.ts` | Optimistic `offline-*` messages persist on failure | **RESOLVED** — `select` strips `offline-*` IDs from server data; drain invalidates failed keys |
| H-08 | Celery | `exchanges/tasks.py` | `auto_confirm_stale_swaps` counts 0 after status update | **RESOLVED** — Collect IDs inside loops before status change; eagerly evaluate querysets |
| H-09 | Business logic | `exchanges/views.py` | `COMPLETED` unreachable — no API action | **RESOLVED** — Added `complete` action (SWAP_CONFIRMED → COMPLETED) with notifications |
| H-10 | Security | `notifications/serializers.py` | Push token hijack via `update_or_create(push_token=...)` | **RESOLVED** — Scoped to `(user, push_token)`; deactivate other users' registration |
| H-11 | i18n / logic | `ExchangeListScreen.tsx` | Incoming banner uses nav title key without `{{count}}` | **RESOLVED** — New `exchanges.incomingBanner` key with count interpolation in all locales |
| H-12 | Types | `shared/types vs mobile/types` | `Book.genre` vs `genres`; `ExchangeDetail` diverged | **RESOLVED** — `Book.genres: string[]` primary; shared `ExchangeDetail` now includes counter fields; mobile re-exports from shared |

---

## 3. MEDIUM (27) — ALL RESOLVED

### Error handling

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-01 | Error states | `MyBooksScreen.tsx` | `useMyBooks()` no `isError` — failures show empty list | **RESOLVED** — Added `isError` + EmptyState with retry |
| M-02 | Error states | `WishlistScreen.tsx` | No `isError` from `useWishlist()` | **RESOLVED** — Added `isError` + EmptyState with retry |
| M-03 | Error states | `IncomingRequestsScreen.tsx` | `useIncomingRequests()` no `isError` | **RESOLVED** — Added `isError` + EmptyState with retry |
| M-04 | Error states | `CounterOfferScreen.tsx` | `useUserBooks` loading only — no error UI | **RESOLVED** — Added `isError` + EmptyState with retry |
| M-05 | Error states | `RequestSwapScreen.tsx` | `useMyBooks` has no error state | **RESOLVED** — Added `booksError` + EmptyState with retry |
| M-06 | Error states | `NotificationPreferencesScreen.tsx` | Only `isLoading` — preferences failure unhandled | **RESOLVED** — Added `isError` + EmptyState with retry |
| M-07 | Mutations | Many hooks | Most mutations lack `onError` callbacks | **RESOLVED** — Added `showErrorToast` to all mutations in useBooks, useWishlist, useProfile, useNotificationPreferences |

### i18n

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-08 | i18n | `ProfileStack.tsx` | 11 hardcoded English `headerTitle` values | **RESOLVED** — All 11 titles now use `t()` with navigation keys |
| M-09 | i18n | `ScanStack.tsx` | All titles hardcoded | **RESOLVED** — Added `useTranslation` + i18n keys for all 4 screens |
| M-10 | i18n | `BrowseStack.tsx` / `HomeStack.tsx` / `MessagesStack.tsx` | Hardcoded titles | **RESOLVED** — All titles now use `t()` with navigation keys |
| M-11 | i18n | `fr.json` / `nl.json` | Missing ~15 keys from `en.json` | **RESOLVED** — All 16 missing keys added to both fr.json and nl.json |
| M-12 | i18n | `ExchangeListScreen.tsx` | `noHistory` fallback text disagrees with key value | **RESOLVED** — Split into `noHistory` (title) + `noHistorySub` (subtitle) in all locales |

### Accessibility

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-13 | A11y | `WishlistScreen.tsx` | Card rows and FAB lack a11y props | **RESOLVED** — Added `accessibilityRole`/`accessibilityLabel` to cards and FAB |
| M-14 | A11y | `RequestSwapScreen.tsx` | Book grid items and submit CTA lack a11y props | **RESOLVED** — Added roles, labels, and states to book cards and submit button |
| M-15 | A11y | `CounterOfferScreen.tsx` | Same as M-14 | **RESOLVED** — Same a11y props added |
| M-16 | A11y | `IncomingRequestsScreen.tsx` | "View" icon-only action has no `accessibilityLabel` | **RESOLVED** — Added role and label |

### UX / Pull-to-refresh

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-17 | UX | `ExchangeListScreen.tsx` | Main exchanges FlatList no pull-to-refresh | **RESOLVED** — Added `onRefresh`/`refreshing` props |
| M-18 | UX | `IncomingRequestsScreen.tsx` | No pull-to-refresh | **RESOLVED** — Added `onRefresh`/`refreshing` props |

### Backend

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-19 | Auth / WS | `websocket.ts` | On `auth.failed`, client only logs — no token refresh | **RESOLVED** — Added `attemptTokenRefreshAndReconnect()` that refreshes JWT and reconnects |
| M-20 | Authorization | `messaging/views.py` | `MeetupSuggestionViewSet` no block check | **RESOLVED** — Added `get_blocked_user_ids` check in `initial()` |
| M-21 | Privacy | `books/views.py` | `NearbyCountView`/`CommunityStatsView` are `AllowAny` | **RESOLVED** — Changed to `IsAuthenticated` |
| M-22 | Validation | `messaging/serializers.py` | Chat image uploads: no Pillow magic-byte check | **RESOLVED** — Added `PILImage.open().verify()` validation |
| M-23 | Validation | `trust_safety/serializers.py` | Report doesn't verify book ownership or exchange participation | **RESOLVED** — Validates book belongs to reported user and both users are exchange participants |
| M-24 | Race | `exchanges/views.py` | `accept()` TOCTOU race | **RESOLVED** — Wrapped in `transaction.atomic()` with `select_for_update()` |
| M-25 | Types | `shared ExchangeDetail` vs `mobile ExchangeDetail` | Shared omits fields mobile adds | **RESOLVED** — Already fixed in H-12 |
| M-26 | Queries | `useBooks.ts` | `useMyBooks` fires 401 after logout | **RESOLVED** — Added `enabled: isAuthenticated` gate |
| M-27 | WS | `messaging/consumers.py` | Unknown `msg_type` not rate-limited | **RESOLVED** — Added rate limiter (5 invalid/30s) with disconnect on abuse |

---

## 4. LOW (18)

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| L-01 | i18n | `EditBookScreen.tsx:143` | Success alert uses hardcoded `"OK"` | Use `t("common.ok")` |
| L-02 | i18n | `EditProfileScreen.tsx:226` | Same hardcoded `"OK"` | Use `t("common.ok")` |
| L-03 | i18n | `RequestSwapScreen.tsx:82` | Same | Use `t("common.ok")` |
| L-04 | i18n | `CounterOfferScreen.tsx:65` | Same | Use `t("common.ok")` |
| L-05 | i18n | `BookDetailScreen.tsx:186` | Fallback `"Unknown"` for owner name is English-only | Use `t("common.unknownUser")` |
| L-06 | A11y | `LanguageScreen.tsx:70-82` | Radio rows have `accessibilityRole="radio"` but no label | Add language name as label |
| L-07 | A11y | `AppearanceScreen.tsx:84-96` | Same — radio without label | Label each theme |
| L-08 | A11y | `BookSearchScreen.tsx:64-106` | Result rows lack a11y props | Add labels |
| L-09 | Types | Various | `as any` on navigation, errors, FormData | Replace with typed alternatives |
| L-10 | Edge case | `timeAgo.ts:1-17` | Invalid `dateStr` yields NaN and odd strings | Guard `Number.isNaN` |
| L-11 | Memory | `useDeletionCancelDeepLink.ts:46-48` | `Linking.getInitialURL()` not cancelled on unmount | Track cancelled flag |
| L-12 | Memory | `BiometricGate.tsx:59-67` | Async in AppState listener has no unmount guard | Add cancelled flag |
| L-13 | Network | `useNetworkStatus.ts:8-19` | `STALE_QUERY_KEYS` misses many query keys — coming online only refreshes subset | Extend list or use predicate |
| L-14 | Config | `pushNotifications.ts:35-40` | Hard-coded `/api/v1/users/me/devices/` instead of centralized endpoint | Use `API` config |
| L-15 | Backend | `books/views.py:70-83` | `BookViewSet.list` has no pagination — large payload possible | Add pagination |
| L-16 | Backend | `books/views.py:386-415` | `radius_counts` doesn't exclude blocked users (browse list does) | Apply same exclusion |
| L-17 | Backend | `notifications/views.py:109-127` | `UnsubscribeView.get` performs state-changing update on GET | Use POST or document |
| L-18 | Backend | `bookswap/routing.py:11` | `ExampleConsumer` echo WebSocket is still wired in production | Remove or guard behind DEBUG |

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 12 |
| MEDIUM | 27 |
| LOW | 18 |
| **Total** | **58** |
