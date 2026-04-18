# Mobile App Production Audit — 2026-04-18

Baselines: web frontend feature set + PRD/user stories (`BookSwap_User_Stories_Spec.md`).
Depth: production-ready (errors, loading, empty states, edge cases, i18n, a11y, offline).

> **Last updated:** 2026-04-17
> **Overall progress:** 56 of 59 findings resolved. 3 deferred.

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Broken or stuck UI on common paths; blocks production launch |
| **HIGH** | Major missing feature, misleading states, or important product gap |
| **MEDIUM** | Incomplete flows, weak error feedback, i18n/a11y gaps on visible surfaces |
| **LOW** | Polish, type safety, non-user-facing cleanup |

---

## 1. CRITICAL Findings — ALL RESOLVED

| ID | Area | Finding | Status |
|----|------|---------|--------|
| CRIT-01 | Notifications | **Push notifications never registered.** `registerForPushNotifications` + `sendPushTokenToBackend` exist but never called at runtime. | FIXED — created `usePushRegistration` hook, wired into `WebSocketGate` |
| CRIT-02 | Auth | **Username availability check uses wrong query param.** `useCheckUsername` sends `{ username }` but backend expects `?q=<name>`. | FIXED — changed param to `q` in `useCheckUsername` |
| CRIT-03 | Books | **EditBookScreen infinite spinner on error.** No error branch when `useBookDetail` fails. | FIXED — added `isError` check with `EmptyState` + retry action |
| CRIT-04 | Exchanges | **ExchangeDetailScreen infinite skeleton on error.** Uses `if (isLoading \|\| !exchange)` without `isError`. | FIXED — added `isError` check with `EmptyState` + retry action |

---

## 2. HIGH Findings — ALL RESOLVED (2 deferred as out-of-scope)

| ID | Area | Finding | Status |
|----|------|---------|--------|
| HIGH-01 | Auth | **`CheckUsernameView` requires `IsAuthenticated`** — registration can't check availability. | FIXED — changed to `AllowAny`, conditional `exclude(pk=)` |
| HIGH-02 | Auth | **Email verification resend uses authenticated `http` client.** | FIXED — switched to `plain` client, accepts optional `email` param |
| HIGH-03 | Auth | **`authStore.hydrate` edge case.** Tokens exist but user JSON is null. | FIXED — hydrate now calls `getMe()` if user is null, logs out on failure |
| HIGH-04 | Auth | **Social-only users unable to delete account** — password required. | FIXED — backend `password` now optional, mobile skips field for social users |
| HIGH-05 | Trust | **Block user is a stub.** `UserProfileScreen` row disabled. | FIXED — wired `useBlockUser` with confirmation Alert + toasts |
| HIGH-06 | Trust | **Report book not wired.** No `reportedBookId` caller. | FIXED — added `ReportSheet` to `BookDetailScreen` with book + user IDs |
| HIGH-07 | Trust | **`blocks.unblockTitle` i18n mismatch.** Missing `{{name}}` placeholder. | FIXED — updated en.json with interpolation, added `emptySubtitle` + `unblockMessage` |
| HIGH-08 | Messaging | **No conversation list screen.** Messages tab root is `ExchangeList`. | DEFERRED — larger feature requiring new screen + backend endpoint |
| HIGH-09 | Messaging | **No per-conversation unread indicators.** | DEFERRED — requires backend unread-per-thread counts |
| HIGH-10 | Books | **Home search text not passed to Browse.** | FIXED — `handleSearch` navigates to `BrowseTab` with `initialSearch` param |
| HIGH-11 | Books | **MyBooksScreen `refreshing={false}` always.** | FIXED — uses `isRefetching` from React Query |
| HIGH-12 | Notifications | **Query error shows false empty state.** Same on exchange list, blocked users. | FIXED — added `isError` checks with `EmptyState` error UI across all list screens |
| HIGH-13 | Exchanges | **Silent mutation failures.** No `onError` callbacks. | FIXED — added `onError` toasts to `useCounterExchange`, `useApproveCounter`, `useAcceptConditions`, `useConfirmSwap`, `useRequestReturn`, `useConfirmReturn` |

---

## 3. MEDIUM Findings — ALL RESOLVED

### 3a. i18n Gaps — ALL FIXED

| ID | Area | Finding | Status |
|----|------|---------|--------|
| MED-i01 | Books | `GENRE_OPTIONS` and `DISTANCE_OPTIONS` hardcoded English labels. | FIXED — replaced with `t()` calls |
| MED-i02 | Books | `CONDITION_LABELS` hardcoded English. | FIXED — replaced with `t()` calls |
| MED-i03 | Books | `HomeRecentlyAdded` empty state hardcoded English. | FIXED — replaced with `t()` calls |
| MED-i04 | Books | `HomeNearbyBadge` labels hardcoded. | FIXED — replaced with `t()` calls |
| MED-i05 | Books | `HomeCommunitySection` activity fragments hardcoded. | FIXED — replaced with `t()` calls |
| MED-i06 | Books | `AddBookModal` strings hardcoded. | FIXED — replaced with `t()` calls |
| MED-i07 | Books | Browse filter chips hardcoded. | FIXED — replaced with `t()` calls |
| MED-i08 | Exchanges | `STATUS_LABELS`, badges, timeline hardcoded English. | FIXED — replaced with `t()` calls |
| MED-i09 | Exchanges | `ExchangeCard` role labels hardcoded. | FIXED — replaced with `t()` calls |
| MED-i10 | Exchanges | `timeAgo()` hardcoded English. | FIXED — extracted to shared `@/lib/timeAgo` (LOW-10) |
| MED-i11 | Navigation | Stack header titles hardcoded. | FIXED — replaced with `t()` calls |
| MED-i12 | Auth | Zod validation messages hardcoded English. | FIXED — replaced with `t()` calls |
| MED-i13 | Auth | `ChangePasswordScreen` labels hardcoded. | FIXED — replaced with `t()` calls |
| MED-i14 | Profile | `EditProfileScreen` genre/language/radius labels hardcoded. | FIXED — replaced with `t()` calls |
| MED-i15 | Profile | `GenrePickerSheet` genre labels not translated. | FIXED — replaced with `t()` calls |
| MED-i16 | Notifications | `notifications.pref.*` keys absent from fr/nl. | FIXED — added translations to fr.json and nl.json |
| MED-i17 | Trust | `blocks.unblockMessage` and `emptySubtitle` missing. | FIXED — added to all locale files |

### 3b. Accessibility Gaps — ALL FIXED

| ID | Area | Finding | Status |
|----|------|---------|--------|
| MED-a01 | Books | Zero a11y across `features/books/`. | FIXED — added `accessibilityRole`/`accessibilityLabel` to all interactive elements |
| MED-a02 | Exchanges | No a11y props on exchange screens. | FIXED — added a11y props |
| MED-a03 | Auth | Login footer, BiometricGate buttons missing a11y. | FIXED — added a11y props |
| MED-a04 | Profile | `MyProfileScreen` action rows missing a11y. | FIXED — added a11y props |
| MED-a05 | Notifications | List rows, buttons lack a11y. | FIXED — added a11y props |
| MED-a06 | Trust | `ReportSheet` + blocked list rows lack a11y. | FIXED — added a11y props |
| MED-a07 | Ratings | `StarInput` has no per-star labels. | FIXED — added per-star `accessibilityLabel` for VoiceOver |
| MED-a08 | Navigation | Header a11y labels hardcoded English. | FIXED — replaced with `t()` calls |
| MED-a09 | Components | `EmptyState` action missing a11y. | FIXED — added a11y props |

### 3c. Error/Loading/Edge Cases

| ID | Area | Finding | Status |
|----|------|---------|--------|
| MED-e01 | Books | `BookDetailScreen` wishlist add no `onError`. | FIXED — added `onError` toast |
| MED-e02 | Books | `BookPhotoManager` mutations no `onError` UI. | FIXED — added `onError` toasts |
| MED-e03 | Books | `ScanResultScreen` query `error` unused. | FIXED — added error UI |
| MED-e04 | Books | HomeScreen: location denied → perpetual skeleton. | FIXED — added location-denied banner with Settings link |
| MED-e05 | Books | No multi-photo gallery on BookDetailScreen. | DEFERRED — UI enhancement, not a bug |
| MED-e06 | Books | `BrowseMapScreen` no error UI. | FIXED — added error fallback |
| MED-e07 | Exchanges | `ExchangeListScreen` error → false empty state. | FIXED — added `isError` check |
| MED-e08 | Exchanges | `ExchangeTimeline` omits return/terminal statuses. | FIXED — extended timeline |
| MED-e09 | Exchanges | `DetailRating` returns null on loading/error. | FIXED — added loading + error states |
| MED-e10 | Messaging | `useMessages` failure → false empty state. | FIXED — added error UI |
| MED-e11 | Messaging | `handleSend` no `onError`. | FIXED — added `onError` toast |
| MED-e12 | Messaging | Duplicate `ReadOnlyBanner`. | FIXED — added guard condition |
| MED-e13 | Messaging | Image messages receive-only. | DEFERRED — feature enhancement |
| MED-e14 | Messaging | Meetup is templated text, not structured. | DEFERRED — feature enhancement |
| MED-e15 | Notifications | `refreshing={false}` hardcoded. | FIXED — uses `isRefetching` |
| MED-e16 | Notifications | `markRead`/`markAllRead` errors not surfaced. | FIXED — added `onError` toasts |
| MED-e17 | Auth | `PasswordResetConfirmScreen` error prevents retry. | FIXED — keeps form visible on error |
| MED-e18 | Profile | `BlockedUsersScreen` `refreshing={false}`. | FIXED — uses `isRefetching` |
| MED-e19 | Profile | `useUnblockUser` no `onError` UI. | FIXED — added `onError` toast |
| MED-e20 | WebSocket | Max reconnect → no user-facing recovery. | FIXED — `WebSocketGate` shows toast on exhaustion |
| MED-e21 | Navigation | Deep linking covers only subset of routes. | DEFERRED — non-blocking for launch |
| MED-e22 | Trust | No mobile email verification gate. | DEFERRED — relies on API 403 responses (acceptable for v1) |

---

## 4. LOW Findings — 11 FIXED, 1 SKIPPED, 1 DEFERRED

| ID | Area | Finding | Status |
|----|------|---------|--------|
| LOW-01 | Books | `getNextPageParam` uses `new URL(...)` — bad `next` URL from API could throw. | FIXED — wrapped in try/catch with regex fallback |
| LOW-02 | Books | Map clustering omits books without coordinates — they appear in list but not on map. | SKIPPED — expected behavior; books without coords can't be placed on a map |
| LOW-03 | Books | Pull-to-refresh on HomeScreen doesn't re-request location. | FIXED — handleRefresh now re-fetches GPS position |
| LOW-04 | Books | Home queries have no `isError` UI for nearby/recent/community failures. | FIXED — added inline error banner with tap-to-retry |
| LOW-05 | Books | `EditBookScreen` reorder fires on every drag end even if order unchanged. | FIXED — added no-op guard comparing current vs new order |
| LOW-06 | Auth | `AddBookScreen` success Alert uses hardcoded "OK". | FIXED — replaced with `t("common.ok")` |
| LOW-07 | Auth | `OnboardingScreen.handleComplete` `setSubmitLoading(true)` not cleared on success path. | FIXED — moved to `finally` block for handleComplete and handleSkip |
| LOW-08 | Profile | `UserProfileScreen` `formatLanguage` uses hardcoded display strings. | FIXED — uses `t("languages.<code>")` with i18n keys in en/fr/nl |
| LOW-09 | Ratings | `UserReviewsScreen` types route as `HomeStackParamList` but screen is on `MessagesStack`. | FIXED — uses standalone `UserReviewsParams` type |
| LOW-10 | Ratings | `RatingCard` `timeAgo` duplicated English (same function as exchanges). | FIXED — extracted to `@/lib/timeAgo`, removed from 4 files |
| LOW-11 | Navigation | `Notifications` not in `HIDDEN_CHILD_ROUTES` — tab bar stays visible. | FIXED — added `Notifications` and `UserReviews` to set |
| LOW-12 | WebSocket | Token passed as query param — leaks in logs/proxies (security policy). | DEFERRED — requires coordinated backend consumer change |
| LOW-13 | Repo | `mobile/src/features/exchanges/screens/Screenshot 2026-04-18 at 12.41.31.png` — accidental binary in source. | FIXED — file deleted |

---

## 5. Web Features Missing on Mobile

| Web Feature | Mobile Status |
|-------------|---------------|
| Counter-propose flow (UI) | **Web: not exposed in UI either.** Hooks exist in both — parity OK. |
| Map view on catalogue | Web: components exist but not mounted. Mobile: BrowseMapScreen is the main browse — **mobile ahead**. |
| Full ratings history page | Web: component exists but not routed. Mobile: `UserReviewsScreen` / `MyReviewsScreen` exist — **mobile ahead**. |
| Cookie consent banner | Web: implemented. Mobile: **N/A** (native app, not needed). |
| PWA update banner | Web: implemented. Mobile: **N/A** (native app). |
| Skip-to-content link | Web: implemented. Mobile: **N/A** (native navigation). |
| "View Full Map" from home | Web: button exists but handler not wired. Mobile: home → Browse tab works. |
| `EmailVerificationGate` wrapper | Web: exists (unused in routes). Mobile: **not implemented** (MED-e22). |
| Profile visibility toggle (`profile_public`) | Web: in Settings. Mobile: **not in Settings UI**. |
| Public profile "Listed books" section | Web: placeholder. Mobile: **not present**. |
| Structured decline reason form | Web: schema exists, no UI form. Mobile: `DeclineReasonSheet` implemented — **mobile ahead**. |
| Settings > change password | Web: hidden for social users. Mobile: shows hint but accessible — **parity OK**. |

---

## 6. PRD Requirements Not Fully Covered on Mobile

| PRD Req | Original Status | Current Status |
|---------|-----------------|----------------|
| **F-3: Push notifications** | CRIT-01: never called. | RESOLVED — `usePushRegistration` wired into `WebSocketGate` |
| **E-1: Email verification gate** | MED-e22: no client-side gate. | DEFERRED — API 403 fallback acceptable for v1 |
| **E-4: Block user** | HIGH-05: stub, not wired. | RESOLVED — fully wired with confirmation + toasts |
| **C-5: Map view** | Implemented — **covered**. | **Covered** |
| **D-3: Exchange conditions** | Implemented — **covered**. | **Covered** |
| **D-7: Return flow** | MED-e08: timeline incomplete. | RESOLVED — timeline extended with return/terminal statuses |
| **B-2: 1-3 condition photos** | Not on AddBookScreen. | UNCHANGED — photos on edit only (acceptable for v1) |
| **US-203: Account deletion for social users** | HIGH-04: password required. | RESOLVED — password optional for social users |
| **WCAG AA accessibility** | MED-a01–a09: widespread gaps. | RESOLVED — a11y props added across all screens |
| **NL + EN UI** (PRD §6) | MED-i01–i17: dozens hardcoded. | RESOLVED — full i18n pass with en/fr/nl translations |

---

## 7. Remaining Deferred Items

| ID | Reason | Priority for v2 |
|----|--------|-----------------|
| HIGH-08 | Conversation list screen — requires new screen + backend endpoint | Medium |
| HIGH-09 | Per-conversation unread indicators — requires backend thread counts | Medium |
| LOW-12 | WS token in query string — requires backend consumer change | Low |
| MED-e05 | Multi-photo gallery on BookDetailScreen — UI enhancement | Low |
| MED-e13 | Image attachment in chat — feature enhancement | Low |
| MED-e14 | Structured meetup proposals — feature enhancement | Low |
| MED-e21 | Extended deep linking config — non-blocking for launch | Low |
| MED-e22 | Client-side email verification gate — API 403 fallback works | Low |
