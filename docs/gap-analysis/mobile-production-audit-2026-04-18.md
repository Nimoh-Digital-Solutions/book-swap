# Mobile App Production Audit — 2026-04-18

Baselines: web frontend feature set + PRD/user stories (`BookSwap_User_Stories_Spec.md`).
Depth: production-ready (errors, loading, empty states, edge cases, i18n, a11y, offline).

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Broken or stuck UI on common paths; blocks production launch |
| **HIGH** | Major missing feature, misleading states, or important product gap |
| **MEDIUM** | Incomplete flows, weak error feedback, i18n/a11y gaps on visible surfaces |
| **LOW** | Polish, type safety, non-user-facing cleanup |

---

## 1. CRITICAL Findings

| ID | Area | Finding |
|----|------|---------|
| CRIT-01 | Notifications | **Push notifications never registered.** `registerForPushNotifications` + `sendPushTokenToBackend` exist in `pushNotifications.ts` but are **never called** from `App.tsx`, auth flows, or anywhere at runtime. Production devices will not receive push. |
| CRIT-02 | Auth | **Username availability check uses wrong query param.** `useCheckUsername` sends `{ params: { username } }` but backend `CheckUsernameView` expects `?q=<name>`. Client-side availability feedback is broken. |
| CRIT-03 | Books | **EditBookScreen infinite spinner on error.** If `useBookDetail` fails, `hydrated` stays `false` and the screen shows `ActivityIndicator` indefinitely — no error branch. |
| CRIT-04 | Exchanges | **ExchangeDetailScreen infinite skeleton on error.** Uses `if (isLoading || !exchange)` without checking `isError`. Failed fetch = permanent loading state. |

---

## 2. HIGH Findings

| ID | Area | Finding |
|----|------|---------|
| HIGH-01 | Auth | **`CheckUsernameView` requires `IsAuthenticated`** — unauthenticated registration flow cannot check availability. |
| HIGH-02 | Auth | **Email verification resend uses authenticated `http` client.** After register (no token), `resendVerificationEmail()` will 401. |
| HIGH-03 | Auth | **`authStore.hydrate` edge case.** Access + refresh tokens exist but stored user JSON is null → `isAuthenticated=true, user=null` → screens that do `if (!user) return null` show blank. |
| HIGH-04 | Auth | **Social-only users may be unable to delete account** from mobile — `DeleteAccountSheet` requires password, which social users don't have. |
| HIGH-05 | Trust | **Block user is a stub.** `UserProfileScreen` "Block user" row is `disabled` with "Coming soon" text. `useBlockUser` hook exists but is not wired. |
| HIGH-06 | Trust | **Report book not wired.** `ReportSheet` accepts `reportedBookId` but no caller passes it — no book-detail report integration. |
| HIGH-07 | Trust | **`blocks.unblockTitle` i18n mismatch.** `en.json` has `"Unblock User"` but code default uses `"Unblock {{name}}?"` with interpolation — the JSON value loses the `{{name}}` placeholder. |
| HIGH-08 | Messaging | **No conversation list screen.** Messages tab root is `ExchangeList`, not a chat list. Users can only open chat from exchange detail. |
| HIGH-09 | Messaging | **No per-conversation unread indicators.** Unread count exists for notifications bell only, not per chat thread. |
| HIGH-10 | Books | **Home search text not passed to Browse.** `handleSearch` calls `goToBrowse()` but BrowseMapScreen has its own state — user's typed search is discarded. |
| HIGH-11 | Books | **MyBooksScreen `refreshing={false}` always.** Pull-to-refresh never shows the refresh indicator. |
| HIGH-12 | Notifications | **Query error shows false empty state.** `useNotifications` failure yields `undefined` data → `EmptyState` "No notifications" instead of error. Same pattern on exchange list, blocked users list. |
| HIGH-13 | Exchanges | **Silent mutation failures.** `useAcceptConditions`, `useConfirmSwap`, `useApproveCounter`, and others have no `onError` callback — 4xx failures are invisible to users. |

---

## 3. MEDIUM Findings

### 3a. i18n Gaps

| ID | Area | Finding |
|----|------|---------|
| MED-i01 | Books | `GENRE_OPTIONS` and `DISTANCE_OPTIONS` in `constants.ts` are hardcoded English labels. |
| MED-i02 | Books | `CONDITION_LABELS` hardcoded English in `BookDetailScreen`, `MyBooksScreen`, exchange screens. |
| MED-i03 | Books | `HomeRecentlyAdded` empty state: "No books yet", "Be the first..." hardcoded English. |
| MED-i04 | Books | `HomeNearbyBadge` labels "Swappers" / "Books" hardcoded. |
| MED-i05 | Books | `HomeCommunitySection` activity feed fragments ("listed", "just swapped books!", "rated") hardcoded. |
| MED-i06 | Books | `AddBookModal` all strings hardcoded ("Add a Book", "Remember my choice"). |
| MED-i07 | Books | Browse filter chips "Genres", "Clear", "{n} book(s) nearby" hardcoded. |
| MED-i08 | Exchanges | `STATUS_LABELS`, `ExchangeStatusBadge`, `ExchangeTimeline` labels all hardcoded English. |
| MED-i09 | Exchanges | `ExchangeCard` "Owner", "Requester", "Yours", "Theirs" hardcoded. |
| MED-i10 | Exchanges | `timeAgo()` function hardcoded English in exchanges, notifications, ratings ("just now", "yesterday"). |
| MED-i11 | Navigation | Stack header titles hardcoded: "Notifications", "Request Swap", "Exchanges", "Incoming Requests", "Settings", "Blocked Users". |
| MED-i12 | Auth | Zod validation messages in `auth.schemas.ts` hardcoded English ("Required", "Invalid email"). |
| MED-i13 | Auth | `ChangePasswordScreen` show/hide password labels hardcoded. |
| MED-i14 | Profile | `EditProfileScreen` genre labels, `LANGUAGE_OPTIONS`, `RADIUS_OPTIONS`, Zod schema messages English. |
| MED-i15 | Profile | `GenrePickerSheet` genre labels not translated. |
| MED-i16 | Notifications | Many `notifications.pref.*` keys absent from fr.json / nl.json — always show English fallbacks. |
| MED-i17 | Trust | `blocks.unblockMessage` and `blocks.emptySubtitle` missing from locale files. |

### 3b. Accessibility Gaps

| ID | Area | Finding |
|----|------|---------|
| MED-a01 | Books | **Zero** `accessibilityRole` / `accessibilityLabel` across entire `features/books/`. All interactive controls (chips, FABs, cards, map controls, photo actions) unlabeled. |
| MED-a02 | Exchanges | No a11y props on tabs, cards, action pressables, report, modals in `features/exchanges/`. |
| MED-a03 | Auth | Login footer, deletion banner, BiometricGate retry/logout buttons missing a11y. |
| MED-a04 | Profile | `MyProfileScreen` action rows missing `accessibilityRole`/`accessibilityLabel` (except logout). |
| MED-a05 | Notifications | List rows, "mark all read" button, main container lack a11y. |
| MED-a06 | Trust | `ReportSheet` controls (categories, submit, close) and blocked list rows lack a11y. |
| MED-a07 | Ratings | `StarInput` has no per-star labels — poor VoiceOver experience. |
| MED-a08 | Navigation | Header a11y labels hardcoded English ("Open profile", "Go back", "Go home"). |
| MED-a09 | Components | Shared `EmptyState` action `Pressable` has no a11y props. |

### 3c. Error/Loading/Edge Cases

| ID | Area | Finding |
|----|------|---------|
| MED-e01 | Books | `BookDetailScreen` wishlist add has no `onError` — failures invisible. |
| MED-e02 | Books | `BookPhotoManager` upload/remove/reorder mutations have no `onError` UI. |
| MED-e03 | Books | `ScanResultScreen` query `error` is unused — network errors show "book not found". |
| MED-e04 | Books | HomeScreen: location denied → `coords` null → hooks disabled → perpetual skeleton with no explanation. |
| MED-e05 | Books | `BookDetailScreen` no multi-photo gallery despite backend supporting multiple photos. |
| MED-e06 | Books | `BrowseMapScreen` no error UI for `useBrowseBooks` / `useRadiusCounts` failures. |
| MED-e07 | Exchanges | `ExchangeListScreen` error → `exchanges` undefined → false "No exchanges yet" empty state. |
| MED-e08 | Exchanges | `ExchangeTimeline` omits `return_requested`, `returned`, terminal statuses — progress shows nothing active. |
| MED-e09 | Exchanges | `DetailRating` returns `null` on loading/error — rating section vanishes silently. |
| MED-e10 | Messaging | `useMessages` failure → empty array → false "No messages yet" state. |
| MED-e11 | Messaging | `handleSend` has no `onError` — send failures depend on (partial) global handling. |
| MED-e12 | Messaging | Duplicate `ReadOnlyBanner` can render when `chatDisabled && !isReadOnly && isLocked`. |
| MED-e13 | Messaging | Image messages: `MessageBubble` can render `message.image` but `MessageInput` has no image attachment — receive-only. |
| MED-e14 | Messaging | Meetup is a templated text string, not a structured proposal/confirmation type. |
| MED-e15 | Notifications | `NotificationListScreen` `refreshing={false}` hardcoded — same pull-to-refresh bug as MyBooks. |
| MED-e16 | Notifications | Mutation errors (`markRead`, `markAllRead`) not surfaced to user. |
| MED-e17 | Auth | `PasswordResetConfirmScreen` error state prevents returning to form to fix input. |
| MED-e18 | Profile | `BlockedUsersScreen` `refreshing={false}` — pull-to-refresh indicator never shows. |
| MED-e19 | Profile | `useUnblockUser` has no `onError` UI — failed unblock is silent. |
| MED-e20 | WebSocket | After max 10 reconnect attempts, connection dies with no user-facing recovery. |
| MED-e21 | Navigation | Deep linking (`linking.ts`) only covers subset: missing `ExchangeDetail`, `Notifications`, `IncomingRequests`, scan stack, wishlist, settings. |
| MED-e22 | Trust | No mobile email verification gate — web has `EmailVerificationGate` wrapper; mobile relies on API 403 responses only. |

---

## 4. LOW Findings

| ID | Area | Finding |
|----|------|---------|
| LOW-01 | Books | `getNextPageParam` uses `new URL(...)` — bad `next` URL from API could throw. |
| LOW-02 | Books | Map clustering omits books without coordinates — they appear in list but not on map. |
| LOW-03 | Books | Pull-to-refresh on HomeScreen doesn't re-request location. |
| LOW-04 | Books | Home queries have no `isError` UI for nearby/recent/community failures. |
| LOW-05 | Books | `EditBookScreen` reorder fires on every drag end even if order unchanged. |
| LOW-06 | Auth | `AddBookScreen` success Alert uses hardcoded "OK". |
| LOW-07 | Auth | `OnboardingScreen.handleComplete` `setSubmitLoading(true)` not cleared on success path. |
| LOW-08 | Profile | `UserProfileScreen` `formatLanguage` uses hardcoded display strings. |
| LOW-09 | Ratings | `UserReviewsScreen` types route as `HomeStackParamList` but screen is on `MessagesStack`. |
| LOW-10 | Ratings | `RatingCard` `timeAgo` duplicated English (same function as exchanges). |
| LOW-11 | Navigation | `Notifications` not in `HIDDEN_CHILD_ROUTES` — tab bar stays visible. |
| LOW-12 | WebSocket | Token passed as query param — leaks in logs/proxies (security policy). |
| LOW-13 | Repo | `mobile/src/features/exchanges/screens/Screenshot 2026-04-18 at 12.41.31.png` — accidental binary in source. |

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

| PRD Req | Status |
|---------|--------|
| **F-3: Push notifications** (P2 in PRD, but mobile requires it) | CRIT-01: registration code exists but never called. |
| **E-1: Email verification gate** for listing/requests/messages | MED-e22: no client-side gate; relies on 403 API responses. |
| **E-4: Block user** | HIGH-05: stub, not wired. |
| **C-5: Map view** | Implemented (BrowseMapScreen) — **covered**. |
| **D-3: Exchange conditions** | Implemented (ConditionsReviewModal) — **covered**. |
| **D-7: Return flow** | Partially covered: `DetailActions` handles return states, but `ExchangeTimeline` doesn't show these statuses (MED-e08). |
| **B-2: 1-3 condition photos** | `BookPhotoManager` on edit; **not available on initial add** (AddBookScreen has no photo upload). |
| **US-203: Account deletion for social users** | HIGH-04: password required, social users blocked. |
| **WCAG AA accessibility** | Widespread gaps across all features (MED-a01 through MED-a09). |
| **NL + EN UI** (PRD §6) | i18n framework present but dozens of hardcoded English strings (MED-i01 through MED-i17). |

---

## 7. Recommended Priority Order

### Tier 1 — Must fix before production
1. CRIT-01: Wire push notification registration into auth/app lifecycle
2. CRIT-02 + HIGH-01: Fix username check param + make endpoint public for registration
3. CRIT-03: Add error state to EditBookScreen
4. CRIT-04: Add error state to ExchangeDetailScreen
5. HIGH-02: Fix email verification resend for unauthenticated users
6. HIGH-03: Handle hydration edge case (tokens exist, user null)
7. HIGH-04: Allow social users to delete account (skip password or use alternative verification)
8. HIGH-05: Wire block user flow on UserProfileScreen
9. HIGH-12 + HIGH-13: Add error handling to queries and mutations across exchanges, notifications, messaging

### Tier 2 — Should fix before production
10. HIGH-10: Pass home search text to browse screen
11. HIGH-11 + MED-e15 + MED-e18: Fix all `refreshing={false}` bugs (MyBooks, Notifications, BlockedUsers)
12. MED-e04: Show location-denied explanation on HomeScreen
13. MED-e08: Complete ExchangeTimeline for return/terminal statuses
14. MED-e12: Fix duplicate ReadOnlyBanner in chat
15. MED-e20: Show recovery UI when WebSocket gives up
16. MED-e21: Expand deep linking config
17. HIGH-06 + HIGH-07: Wire report-book + fix unblock i18n

### Tier 3 — i18n completeness pass
18. MED-i01 through MED-i17: Systematically replace all hardcoded English with `t()` keys and add fr/nl translations

### Tier 4 — Accessibility pass
19. MED-a01 through MED-a09: Add `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` to all interactive elements

### Tier 5 — Polish
20. LOW-01 through LOW-13: Edge cases, type safety, cleanup
