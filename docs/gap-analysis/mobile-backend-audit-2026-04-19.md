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
| H-01 | Error states | `BookDetailScreen.tsx:62-180` | `useBookDetail` ignores `isError` — API failure shows "Book not found" instead of error+retry | Branch on `isError` with retry UI |
| H-02 | Error states | `ScanResultScreen.tsx:51-134` | Failed ISBN lookup shows "not found" UI, not error+retry | Handle `isError`/`error` with dedicated error state |
| H-03 | Error states | `UserReviewsScreen.tsx:32-91` | No `isError` — failed query looks like "No reviews yet" | Show error+retry when `isError` |
| H-04 | Error states | `MyReviewsScreen.tsx:29-91` | Same as H-03 | Same fix |
| H-05 | WS / race | `useChatWebSocket.ts:116-123` | Any `exchangeId`/`enabled` change tears down chat WS and reconnects notifications — rapid navigation can drop messages | Debounce reconnects or use refcount strategy |
| H-06 | Offline | `offlineMutationQueue.ts:24-30` | Queue only persists with MMKV or web localStorage — native without MMKV silently drops queued work | Fallback to AsyncStorage or block offline queue UI |
| H-07 | Offline | `useMessages.ts:47-91` | Optimistic text messages have no rollback on sync failure — fake `offline-*` IDs can remain | Remove optimistic rows on drain failure, or wait for server ack |
| H-08 | Celery | `exchanges/tasks.py:119-133` | `auto_confirm_stale_swaps` queries for affected IDs *after* status update — returns 0 rows; `swap_count` never incremented | Collect user IDs inside update loops before status change |
| H-09 | Business logic | `exchanges/views.py` (lifecycle) | `COMPLETED` status is in valid transitions but no API action transitions to it; notifications for `completed` never fire | Add explicit action or auto-transition from `swap_confirmed` |
| H-10 | Security | `notifications/serializers.py:76-82` | `MobileDeviceSerializer.create` uses `update_or_create(push_token=...)` — registering a token already tied to another user reassigns it (token hijack) | Scope uniqueness to `(user, push_token)` or reject if user differs |
| H-11 | i18n / logic | `ExchangeListScreen.tsx:162-169` | Incoming requests banner uses `t('exchanges.incomingRequests')` which is the nav title "Incoming Requests" — count `{{count}}` is never interpolated | Use a dedicated key with `{{count}}` interpolation |
| H-12 | Types | `shared/types vs mobile/types` | Mobile `Book` has `genre: string`, shared has `genres: string[]`; `User` `avg_rating` is string vs number; `location` shapes differ — causes `as any` everywhere | Align mobile types with shared; single source of truth |

---

## 3. MEDIUM (27)

### Error handling

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-01 | Error states | `MyBooksScreen.tsx` | `useMyBooks()` no `isError` — failures show empty list | Add error+retry |
| M-02 | Error states | `WishlistScreen.tsx` | No `isError` from `useWishlist()` | Add error+retry |
| M-03 | Error states | `IncomingRequestsScreen.tsx` | `useIncomingRequests()` no `isError` | Handle errors |
| M-04 | Error states | `CounterOfferScreen.tsx` | `useUserBooks` loading only — no error UI | Add error state |
| M-05 | Error states | `RequestSwapScreen.tsx` | `useMyBooks` has no error state | Add error state |
| M-06 | Error states | `NotificationPreferencesScreen.tsx` | Only `isLoading` — preferences failure unhandled | Handle `isError` |
| M-07 | Mutations | Many hooks | Most mutations lack `onError` callbacks — errors only surface via React Query state or global toasts | Add `onError` with `showErrorToast` consistently |

### i18n

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-08 | i18n | `ProfileStack.tsx` | 11 hardcoded English `headerTitle` values | Use `t()` with existing nav keys |
| M-09 | i18n | `ScanStack.tsx` | All titles hardcoded (`"Scan"`, `"Book found"`, etc.) | Add `useTranslation` + i18n keys |
| M-10 | i18n | `BrowseStack.tsx` / `HomeStack.tsx` / `MessagesStack.tsx` | Hardcoded `'Browse'`, `'Profile'`, `'Reviews'`, `'Counter Offer'` | Use `t()` |
| M-11 | i18n | `fr.json` / `nl.json` | Missing ~15 error/edge-case keys that exist in `en.json` (websocket error, map errors, messaging failures, etc.) | Sync all three locale files |
| M-12 | i18n | `ExchangeListScreen.tsx:145-147` | `noHistory` fallback text and actual key value disagree | Align copy |

### Accessibility

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-13 | A11y | `WishlistScreen.tsx` | Card rows and FAB lack `accessibilityRole`/`accessibilityLabel` | Add labels |
| M-14 | A11y | `RequestSwapScreen.tsx` | Book grid items and submit CTA lack a11y props | Add roles and labels |
| M-15 | A11y | `CounterOfferScreen.tsx` | Same as M-14 | Add roles and labels |
| M-16 | A11y | `IncomingRequestsScreen.tsx:142-168` | "View" icon-only action has no `accessibilityLabel` | Add label |

### UX / Pull-to-refresh

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-17 | UX | `ExchangeListScreen.tsx:238-245` | Main exchanges `FlatList` has no pull-to-refresh | Add `RefreshControl` |
| M-18 | UX | `IncomingRequestsScreen.tsx` | No pull-to-refresh on incoming list | Add `RefreshControl` |

### Backend

| ID | Area | Location | Finding | Fix |
|----|------|----------|---------|-----|
| M-19 | Auth / WS | `websocket.ts:103-106` | On `auth.failed` from WS, client only logs — no token refresh or reconnect attempt | Trigger `reconnectWithNewToken` after refresh |
| M-20 | Authorization | `messaging/views.py:216-225` | `MeetupSuggestionViewSet` doesn't apply block check (unlike `MessageViewSet`) | Reuse block check mixin |
| M-21 | Privacy | `books/views.py:418-473,476-631` | `NearbyCountView` / `CommunityStatsView` are `AllowAny` — expose location-driven PII in activity feed | Require auth or reduce fields for anon |
| M-22 | Validation | `messaging/serializers.py:36-47` | Chat image uploads validate content_type only — no magic-byte/Pillow check (unlike book photos) | Reuse `validate_book_photo` pattern |
| M-23 | Validation | `trust_safety/serializers.py:65-86` | Report doesn't verify book belongs to reported user or exchange involves both parties | Validate ownership/participation |
| M-24 | Race | `exchanges/views.py:155-178` | `accept()` TOCTOU — concurrent accepts for same book could both pass | Use `select_for_update()` in transaction |
| M-25 | Types | `shared ExchangeDetail` vs `mobile ExchangeDetail` | Shared omits fields mobile adds (`original_offered_book`, etc.) | Extend shared type |
| M-26 | Queries | `useBooks.ts:75-84` | `useMyBooks` has no `enabled: isAuthenticated` — fires 401 after logout | Gate with auth state |
| M-27 | WS | `messaging/consumers.py:73-91` | Unknown `msg_type` returns error but no rate limit on invalid frames | Rate-limit invalid message types |

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
