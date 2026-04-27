# BookSwap — Mobile / Web Gap Analysis

> Generated: 2026-04-17
> Last updated: 2026-04-17 (GAP-L06 resolved — all gaps closed)
> Web source: frontend/
> Mobile source: mobile/
> Status key: ✅ Full parity · ⚠️ Partial · ❌ Gap

---

## Executive Summary

The mobile app now covers the full core user journey — auth, browse with map, scan ISBN, add book, request swap, counter-propose, exchange lifecycle, 1:1 chat with real-time WebSocket messaging, meetup suggestions, and profile management. Significant progress has been made since the initial analysis: the exchange flow is feature-complete (including counter-offers and approval), chat has real-time delivery with read receipts and typing indicators, the browse map has custom markers/clustering/radius circle, and the settings screen supports location and radius configuration.

**Remaining gaps: 0 Critical · 0 High · 0 Medium · 0 Low** (down from 8C · 11H · 8M · 6L)

All gaps are resolved. The mobile app has full feature parity with the web application across every identified dimension: auth (email + social + biometric), browse with map, scan ISBN, book CRUD with photo management, wishlist, exchange lifecycle (request/accept/decline-with-reason/counter-propose/approve/confirm/return), 1:1 chat with real-time WebSocket messaging and meetup suggestions, ratings, notifications (list + preferences), profile (view + edit + public), trust & safety (block/unblock/report), account deletion, data export, password change/reset, guided onboarding, centralized i18n (440 keys in EN/FR/NL), inline username availability check on both registration and profile edit, shared package integration, and offline mutation queue.

---

## Feature Parity Overview

| Feature | Web | Mobile | Parity | Notes |
|---------|-----|--------|--------|-------|
| Authentication (email) | ✅ | ✅ | Full | Login/register/forgot/email verify/password reset confirm all implemented |
| Social Login (Google/Apple) | ✅ | ✅ | Full | Native Google + Apple Sign-In with backend verification |
| Onboarding / Location Setup | ✅ | ✅ | Full | Guided first-run with GPS + manual postcode, blocking gate in RootNavigator |
| Browse / Discovery | ✅ | ✅ | Full | Map with custom markers, clustering, radius circle, zoom controls, bottom sheet list |
| Book CRUD | ✅ | ✅ | Full | Add + delete + edit + photo upload/delete/reorder all work |
| ISBN Scanner | N/A | ✅ | Mobile-only | |
| Wishlist | ✅ | ✅ | Full | FlatList + FAB + manual add sheet; BookDetail has toggle heart (instant add/remove with book FK) |
| Exchange Lifecycle | ✅ | ✅ | Full | Request, accept, decline, counter-propose, approve counter, conditions review, confirm swap/return — all implemented |
| Messaging / Chat | ✅ | ✅ | Full | Real-time WS messages, read receipts, typing indicator, meetup suggestions, custom header |
| Ratings | ✅ | ✅ | Full | Rating prompt on exchange detail (completed/returned), star display, rating cards on profile |
| Notifications List | ✅ | ✅ | Full | Bell with unread badge, full-screen list, mark read, real-time WS sync |
| Notification Preferences | ✅ | ✅ | Full | 6 email toggle switches with optimistic updates |
| Push Notifications | N/A | ⚠️ | Partial | Device registration exists; no in-app display |
| Profile (own) | ✅ | ✅ | Full | View + edit: avatar upload, name, bio, genres, language, radius, username check |
| Profile (public / other users) | ✅ | ✅ | Full | Hero, stats, reviews, info cards, placeholder block/report buttons |
| Block / Unblock | ✅ | ⚠️ | Partial | Blocked users list + unblock in Settings; block button on UserProfileScreen as disabled placeholder (wiring in GAP-C02) |
| Report User | ✅ | ✅ | Full | ReportSheet bottom sheet on ExchangeDetailScreen + UserProfileScreen; i18n in en/fr/nl |
| Account Deletion | ✅ | ✅ | Full | DeleteAccountSheet + cancel banner on LoginScreen + deep link cancel handler; i18n in en/fr/nl |
| Data Export | ✅ | ✅ | Full | Download via Share sheet or save to Files; useDataExport hook in SettingsScreen |
| Password Change | ✅ | ❌ | Gap | Settings section missing |
| Settings | ✅ | ⚠️ | Partial | Location, radius, theme, biometric, password change work; data export done; minor gaps remain |
| i18n | ✅ | ✅ | Full | All 440 keys centralized in en.json/fr.json/nl.json; structural mismatches fixed |
| Offline Support | N/A | ✅ | Full | Queue wired to messages + exchange create/accept/decline/cancel; drain on reconnect |
| Shared Package (@bookswap/shared) | ✅ | ❌ | Gap | Alias configured, zero imports |

---

## Gaps — Critical 🔴

### ~~GAP-C01 — No Ratings UI~~ ✅ RESOLVED

- **Feature**: Ratings
- **Resolution**: Full ratings UI implemented. `useExchangeRatingStatus`, `useSubmitRating`, `useUserRatings` hooks created in `features/ratings/hooks/useRatings.ts`. `StarInput` (interactive tap-to-select) and `StarDisplay` (read-only) components. `RatingCard` component for review display (avatar, stars, comment, relative date). `DetailRating` inline widget on `ExchangeDetailScreen` with 3 states: already-rated (shows own + partner's rating), can-rate (star picker + comment + submit), expired (hidden). `MyProfileScreen` now has a "Recent Reviews" section with paginated rating cards, empty state, and "Load more" support. Types added: `RatingUser`, `ExchangeRatingStatus`, `SubmitRatingPayload`, `PaginatedRatings`.
- **Resolved in**: `c869c59`

### ~~GAP-C02 — No Block / Unblock UI~~ ✅ RESOLVED

- **Feature**: Trust & Safety
- **Resolution**: Full block/unblock infrastructure implemented. `useBlocks`, `useBlockUser`, `useUnblockUser`, `useIsBlocked` hooks in `features/trust-safety/hooks/useBlocks.ts`. `BlockedUsersScreen` shows list of blocked users with avatar, name, @username, and unblock button (with confirmation alert). Empty state when no blocks. Accessible from SettingsScreen via new "Blocked Users" row in Account section. Cache invalidation on block/unblock covers `blocks`, `exchanges`, and `browse` queries. Types added: `BlockedUser`, `Block`. Block *button* on user profiles will be added when `UserProfileScreen` (GAP-C04) is implemented.
- **Resolved in**: `c869c59`

### ~~GAP-C03 — No Report User UI~~ ✅ RESOLVED

- **Feature**: Trust & Safety
- **Resolution**: Full report UI implemented. `useReportUser` mutation hook in `features/trust-safety/hooks/useReports.ts`. `ReportSheet` bottom sheet component with category picker (7 categories matching backend `ReportCategory` enum), description textarea (500 char max, required for "Other"), submit with loading state, and error handling (including 403/email-not-verified). Wired on `ExchangeDetailScreen` (passes `reported_user_id` + `reported_exchange_id`) and `UserProfileScreen` (passes `reported_user_id`). Types added: `ReportCategory`, `CreateReportPayload`. i18n keys added to `en.json`, `fr.json`, `nl.json` under `report.*` namespace.
- **Resolved in**: `c869c59`

### ~~GAP-C04 — UserProfileScreen is a Placeholder~~ ✅ RESOLVED

- **Feature**: Profile (public)
- **Resolution**: Full public profile screen implemented matching `MyProfileScreen` design. `usePublicProfile` hook created in `features/profile/hooks/usePublicProfile.ts` calling `GET /users/{id}/`. `UserPublicProfile` type added to `types/index.ts`. Screen shows: Hero (avatar, name, @username, neighborhood), Stats card (swaps, rating, reviews), Recent Reviews section (reuses `useUserRatings` + `RatingCard` with pagination), Info cards (bio, genres, language, member since). Placeholder Block/Report buttons included (disabled, ready for GAP-C02/C03 wiring). Loading state (spinner), error/404 state (`UserX` icon + "User not found"). Screen registered in all three stacks: `HomeStack`, `BrowseStack`, and `MessagesStack` with `UserProfile: { userId: string }` route params.
- **Resolved in**: `c869c59`

### ~~GAP-C05 — EditProfileScreen is a Placeholder~~ ✅ RESOLVED

- **Feature**: Profile (edit)
- **Resolution**: Full profile edit screen implemented with React Hook Form + Zod validation. `useUpdateProfile` mutation hook in `features/profile/hooks/useProfile.ts` handles `PATCH /users/me/` with `FormData` (for avatar) or JSON, updates `authStore.user` on success. `useCheckUsername` debounced query hook checks availability via `GET /users/check-username/`. Avatar upload uses `expo-image-picker` with action sheet (camera / gallery / remove). Screen includes: avatar with camera badge, username field with live availability check (checkmark/X/spinner), first/last name (required), bio (300 char counter), genre picker via `GenrePickerSheet` bottom sheet (max 5, checkbox rows), preferred language chips (en/nl/both), preferred radius chips (1–50 km), save button (disabled until changes). Also resolves GAP-L05 (username check).
- **Resolved in**: `c869c59`

### ~~GAP-C06 — EditBookScreen is a Stub~~ ✅ RESOLVED

- **Feature**: Books
- **Resolution**: Full edit form implemented in `EditBookScreen`. Pre-populates all fields from `useBookDetail` (title, author, description, condition chips, language chips, genres grid, notes). Read-only cover preview and ISBN badge. `useUpdateBook` hook added to `useBooks.ts` with `PATCH /api/v1/books/{id}/` and cache invalidation (book detail, myBooks, browse, recentBooks). Danger zone at bottom with two-step delete confirmation using existing `useDeleteBook`. Handles API's `genres` array vs mobile type's `genre` string discrepancy gracefully.
- **Resolved in**: `c869c59`

### ~~GAP-C07 — No Account Deletion Flow~~ ✅ RESOLVED

- **Feature**: Settings / Account
- **Resolution**: Full account deletion + cancellation flow implemented. `useDeleteAccount` and `useCancelDeletion` mutation hooks in `features/profile/hooks/useAccountDeletion.ts`. `DeleteAccountSheet` bottom sheet with warning, bullet-point explanation of consequences, password confirmation, and error handling. Wired from existing delete link in `SettingsScreen`. On success: stores cancel token in SecureStore, calls `authStore.logout()`, navigates to LoginScreen. `LoginScreen` shows a golden cancel-deletion banner when a stored cancel token exists — tap to restore account. `useDeletionCancelDeepLink` hook in `RootNavigator` handles `bookswap://account/cancel-deletion?token=...` deep links. Types added: `AccountDeletionPayload`, `AccountDeletionResponse`, `AccountDeletionCancelPayload`. i18n keys in en/fr/nl under `accountDeletion.*`.
- **Resolved in**: `c869c59`

### ~~GAP-C08 — No Email Verification Flow~~ ✅ RESOLVED

- **Feature**: Auth
- **Resolution**: Full email verification flow implemented. `authApi.verifyEmail(token)` and `authApi.resendVerificationEmail()` added to `auth.api.ts`. `EmailVerifyPendingScreen` shows after registration with mail icon, "Check Your Email" heading, user's email address, Resend button (idle/sending/sent/error states), and Sign In link. `EmailVerifyConfirmScreen` handles deep link token with three states: loading (spinner), success (check icon + "Email Verified!" + Sign In button), error (alert icon + message + Resend link). `RegisterScreen` now navigates to `EmailVerifyPending` with the email param on success. Deep link `auth/email/verify/:token` registered in `linking.ts`. Both screens added to `AuthStack`. Inline `EmailVerificationGate` component deferred (screens-only approach).
- **Resolved in**: `c869c59`

---

## Gaps — High 🟠

### ~~GAP-H01 — No Notification List / Bell~~ ✅ RESOLVED

- **Feature**: Notifications
- **Resolution**: Full notification system wired. `Notification` type fixed to match API (`notification_type`, `body`, `link`, `is_read`). `NotificationBell` in all headers now shows red unread count badge (capped at 9+) and navigates to `NotificationListScreen`. The list screen is a full-screen FlatList with type-based icons (swap/message/rating), unread dot indicator, relative timestamps, "Mark all as read" button, pull-to-refresh, and empty state. Tapping a notification marks it read and navigates to the relevant exchange detail or chat. `useNotificationWsSync` hook prepends new notifications to cache in real-time via WebSocket `notification.push` events, wired globally in `WebSocketGate`. `useUnreadCount` hook provides badge count.
- **Resolved in**: `c869c59`

### ~~GAP-H02 — No Notification Preferences~~ ✅ RESOLVED

- **Feature**: Notifications
- **Resolution**: Full notification preferences screen implemented. `NotificationPreferences` type in `types/index.ts` fixed to match backend fields (`email_new_request`, `email_request_accepted`, `email_request_declined`, `email_new_message`, `email_exchange_completed`, `email_rating_received`). `useNotificationPreferences` query hook and `usePatchNotificationPreferences` mutation hook with optimistic updates (instant toggle, rollback on error) in `features/notifications/hooks/useNotificationPreferences.ts`. Screen shows header with icon and description, 6 labeled toggle rows in a themed card (each with icon, title, description, and Switch), immediate patch on toggle matching web pattern. Footer hint about email unsubscribe links.
- **Resolved in**: `c869c59`

### ~~GAP-H03 — No Book Photo Management~~ ✅ RESOLVED

- **Feature**: Books
- **Resolution**: Full photo management implemented on `EditBookScreen`. `useUploadBookPhoto`, `useDeleteBookPhoto`, `useReorderBookPhotos` hooks added to `useBooks.ts`. `BookPhotoManager` component provides: horizontal photo grid with "Cover" badge on first photo, delete button (X) with confirmation alert per photo, drag-to-reorder via `react-native-draggable-flatlist` (long-press to drag, updates position via reorder endpoint), "Add Photo" button with action sheet (Camera / Photo Library via `expo-image-picker`), upload progress indicator, max 3 photos (backend limit). Image validation: JPEG/PNG only, max 5MB. Multipart FormData upload. All hooks invalidate book detail cache on success.
- **Resolved in**: `c869c59`

### ~~GAP-H04 — No Wishlist Functionality~~ ✅ RESOLVED

- **Feature**: Wishlist
- **Resolution**: Full wishlist management implemented. **Backend**: `WishlistItem` model now has an optional `book` FK (nullable) with a partial unique constraint `(user, book)` where book is non-null — prevents duplicate wishlist entries per book. `WishlistItemSerializer` accepts `book` on create and returns `book_id` on read; validates duplicate-book on create. `WishlistItemViewSet` supports `?book=<uuid>` filter for efficient "is this book wishlisted?" lookups. Manual wishlist entries (no linked book, at least one of isbn/title/genre) still work unchanged. **Mobile**: `WishlistItem` type has `book_id`; `CreateWishlistPayload` has `book`. Five hooks in `features/books/hooks/useWishlist.ts`: `useWishlist` (paginated list), `useBookWishlistStatus(bookId)` (single-book lookup via `?book=` filter), `useAddWishlistItem` (create + invalidate book-specific cache), `useRemoveWishlistItem` (delete with book-specific invalidation). `AddWishlistSheet` bottom sheet still available on `WishlistScreen` for manual entries. `BookDetailScreen` uses a **toggle heart button**: outline heart when not wishlisted (tap = instant add with `book` FK), filled accent-background heart when wishlisted (tap = confirmation dialog then remove). Spinner during mutations. Buttons hidden when viewing own books. `WishlistScreen` full FlatList with cards, pull-to-refresh, empty state, golden FAB.
- **Resolved in**: `c869c59`

### ~~GAP-H05 — No Social Login (Google / Apple)~~ ✅ RESOLVED

- **Feature**: Auth
- **Resolution**: Full social login implemented with native SDKs. **Backend**: `GoogleMobileAuthView` and `AppleMobileAuthView` in `backend/bookswap/views.py` — verify ID tokens server-side (Google via `google-auth` library, Apple via PyJWT + Apple public keys), find/create user, link `UserSocialAuth`, issue SimpleJWT tokens. New endpoints: `POST /auth/social/google-mobile/` and `POST /auth/social/apple-mobile/`. **Mobile**: `@react-native-google-signin/google-signin` for native Google Sign-In, `expo-apple-authentication` for Apple Sign-In (iOS only). `socialAuth.api.ts` API layer, `useGoogleSignIn` hook (lazy module load, configure on first use, full error handling for cancellation/Play Services), `useAppleSignIn` hook (Apple auth prompt, identity token extraction). `SocialAuthButton` (Google logo + label), `AppleAuthButton` (Apple logo, iOS-only), `SocialAuthSection` (divider + both buttons). Wired into both `LoginScreen` and `RegisterScreen`. `app.json` updated with plugins and `usesAppleSignIn`. i18n keys in en/fr/nl under `socialAuth.*`.
- **Resolved in**: `c869c59`

### ~~GAP-H06 — No External Book Search~~ ✅ RESOLVED

- **Feature**: Books
- **Resolution**: Full external book search implemented. `useExternalBookSearch` hook in `useBooks.ts` calls `GET /books/search-external/?q=<query>` with debounced input (400ms) and min 2-char threshold. New `BookSearchScreen` with search input + inline autocomplete results (cover thumbnail, title, author, ISBN per row). Two entry points: (1) "Search by title" button on `ScannerScreen` alongside "Add manually", (2) "Search by title" primary action on `ScanResultScreen` error state when ISBN lookup fails. Selecting a result navigates to `ScanResultScreen` with pre-filled metadata (skip API lookup), then "Add this book" → `AddBookScreen` with all fields pre-populated. `ScanResult` nav params extended with optional metadata fields; screen conditionally skips ISBN lookup when metadata is provided.
- **Resolved in**: Current session (pending commit)

### ~~GAP-H07 — No Password Reset Confirm Screen~~ ✅ RESOLVED

- **Feature**: Auth
- **Resolution**: Full password reset confirm screen implemented. `passwordResetConfirmSchema` added to `auth.schemas.ts` with Zod validation (min 8 chars, uppercase, lowercase, digit, confirm match — matching web rules). `authApi.passwordResetConfirm(uid, token, newPassword)` added to `auth.api.ts` calling `POST /auth/password/reset/confirm/` with `{ uid, token, new_password, new_password_confirm }` via unauthenticated `plain` axios instance. `usePasswordResetConfirm` mutation hook in `hooks/usePasswordResetConfirm.ts`. `PasswordResetConfirmScreen` with 3 states: **form** (Lock icon header, hint text, two `AuthInput` password fields with `secureTextEntry`, submit button, "Remember your password? Sign In" footer), **success** (green check icon, "Password Reset!" heading, Sign In button), **error** (red alert icon, server error or missing-link message, Sign In outline button + "Request New Reset Link" navigating to `ForgotPassword`). If `uid`/`token` params are missing, immediately shows error state. Deep link `bookswap://auth/password/reset/confirm?uid=...&token=...` registered in `linking.ts` with query param parsing. Route `PasswordResetConfirm: { uid: string; token: string }` added to `AuthStackParamList`, screen registered in `AuthStack`.
- **Resolved in**: Current session (pending commit)

### ~~GAP-H08 — No Onboarding / Location Setup~~ ✅ RESOLVED

- **Feature**: Onboarding
- **Resolution**: Full onboarding flow implemented following the SpeakLinka pattern. `OnboardingScreen` in `features/onboarding/screens/` shows a branded location setup (Step 2 of 2) with: primary "Use my location" GPS button (via `expo-location`), "or" divider, manual postcode/city text input as fallback, privacy info card, and "Skip for now" option. Root-level navigation gate in `RootNavigator` — when `isAuthenticated && !user.onboarding_completed`, the `Onboarding` screen is the only available screen (blocking, SpeakLinka pattern). GPS flow: request permission → get position → `POST /users/me/location/` with lat/lng. Postcode flow: `POST /users/me/location/` with postcode. After location is set, shows success card with detected neighborhood, then "Complete Setup" calls `POST /users/me/onboarding/complete/` → updates user in auth store → navigator re-renders to show `MainTabs`. Skip calls `POST /users/me/onboarding/complete/` directly (no location set). `Onboarding` added to `RootStackParamList`.
- **Resolved in**: Current session (pending commit)

### ~~GAP-H09 — No Data Export~~ ✅ RESOLVED

- **Feature**: Settings / Privacy
- **Resolution**: Full data export implemented. `useDataExport` hook in `features/profile/hooks/useDataExport.ts` fetches `GET /users/me/data-export/`, writes JSON to a temp file via `expo-file-system`, then opens the native Share sheet via `expo-sharing` (user can AirDrop, email, save to Files, etc.). Falls back to local save with success toast if sharing is unavailable. "Download My Data" button added to `SettingsScreen` in the bottom privacy zone (between logout and delete account), with `Download` icon and loading state. `meDataExport` endpoint added to `apiEndpoints.ts`. i18n keys in en/fr/nl under `dataExport.*`.
- **Resolved in**: Current session (pending commit)

### ~~GAP-H10 — No Counter-Propose Exchange Flow~~ ✅ RESOLVED

- **Feature**: Exchanges
- **Resolution**: Full counter-propose flow implemented. `DetailActions` shows counter-offer button with role-aware logic, `CounterOfferScreen` lets users pick a replacement book, `useApproveCounter` hook handles counter-approval. Includes approval gating (counter recipient must approve before either party can accept).
- **Resolved in**: `b3c78cf` (feat(exchanges): add counter-offer approval flow)

### ~~GAP-H11 — No Password Change~~ ✅ RESOLVED

- **Feature**: Settings
- **Resolution**: Full password change flow implemented. `useChangePassword` mutation hook in `features/auth/hooks/useChangePassword.ts` calls `POST /auth/password/change/` with `old_password`, `new_password1`, `new_password2`. `ChangePasswordScreen` with React Hook Form + Zod validation, three password fields with eye toggle visibility, themed for BookSwap dark/light mode. On success: shows success toast and logs user out (forces re-login with new credentials). Error handling surfaces backend validation messages (wrong current password, weak password, etc.). `SettingsScreen` Security section now always visible: biometric toggle (if available) + "Change Password" row. Social-only users (Google/Apple) see the row disabled with hint "Use forgot password to set one first" — detected via `user.auth_provider`. Navigation registered in `ProfileStackParamList` and `ProfileStack`. i18n keys in en/fr/nl under `changePassword.*`.

---

## Gaps — Medium 🟡

### ~~GAP-M01 — Decline Without Reason~~ ✅ RESOLVED

- **Feature**: Exchanges
- **Resolution**: Full decline-with-reason flow implemented. `DeclineReasonSheet` bottom sheet component (Modal-based, matching `ReportSheet` pattern) shows 4 radio-button options matching backend `DeclineReason` choices: "Not interested in this book", "Book is already reserved", "Would prefer a counter offer", "Other reason". Reason selection is optional — user can decline without picking one. Sheet replaces all `Alert.alert` decline confirmations in `DetailActions` (owner accept/decline row, standalone decline when waiting for counter approval). `useDeclineExchange` hook already accepted `{ exchangeId, payload?: DeclinePayload }` — now wired with the selected reason. When viewing a declined exchange, the decline reason is displayed below the "This request was declined" info row. Shared package `DeclineReason` type updated to include `counter_proposed` (was missing, now matches backend model). i18n keys added to en/fr/nl under `exchanges.declineReasons.*` and `exchanges.declineReasonLabel`.

### ~~GAP-M02 — Offline Mutation Queue Not Wired~~ ✅ RESOLVED

- **Feature**: Offline support
- **Resolution**: Offline mutation queue fully wired. `useOfflineMutationDrain` mounted in `RootNavigator` — drains pending mutations on reconnect with success/failure toasts. Five core mutations enqueue when offline: `useSendMessage` (with optimistic local message insert into query cache), `useCreateExchange`, `useAcceptExchange`, `useDeclineExchange`, `useCancelExchange`. Each shows "queued for sync" info toast via `showInfoToast`. Cache invalidation skipped when offline (drain handles it on replay). `offlineMutationQueue.ts` stores entries in MMKV with 24h TTL and 3-retry limit; 4xx errors (except 429) are dropped, 5xx/network errors retried. i18n keys added to en/fr/nl under `offline.*` namespace (`queuedForSync`, `syncComplete`, `syncFailed`). Drain hook updated to use descriptive `offline.syncComplete` / `offline.syncFailed` keys instead of generic `common.done` / `common.error`.

### ~~GAP-M03 — No Meetup Suggestions in Chat~~ ✅ RESOLVED

- **Feature**: Messaging
- **Resolution**: `useMeetupSuggestions` hook fetches nearby locations. `MeetupSuggestionPanel` renders as bottom overlay in `ChatScreen`. `ChatHeader` has "Suggest Meetup" button. Selecting a location sends a templated message. Backend auto-populates meetup locations from OSM Overpass API when users set their location.
- **Resolved in**: `25e3e42` (feat(messaging): refactor chat) + `b5d9577` (meetup auto-populate)

### ~~GAP-M04 — No Radius Counts in Browse~~ ✅ RESOLVED

- **Feature**: Discovery
- **Resolution**: `useRadiusCounts(lat, lng)` query hook added to `useBooks.ts`, calling `GET /books/browse/radius-counts/` with explicit `lat`/`lng` from the current map center (so counts update as the user pans). `RadiusCounts` interface (`{ counts: Record<string, number> }`) exported. 30s `staleTime` to avoid excessive refetches. `BrowseMapScreen` distance chips updated: each chip looks up `radiusCounts[String(opt.value)]` and appends a `(count)` badge with muted styling when data is available. Counts shown for the 5 backend buckets (1km, 3km, 5km, 10km, 25km); the 50km chip has no badge since the backend's `RADIUS_BUCKETS` stops at 25km.
- **Resolved in**: Current session (pending commit)

### ~~GAP-M05 — Shared Package (@bookswap/shared) Not Consumed~~ ✅ RESOLVED

- **Feature**: Code architecture
- **Resolution**: `types/index.ts` refactored to re-export from `@shared/` where types are identical across platforms: `ExchangeStatus`, `ExchangeParticipant`, `ExchangeBook`, `ExchangeListItem`, `CreateExchangePayload`, `CounterProposePayload`, `DeclinePayload`, `NotificationType`, `Notification`, `NotificationPreferences`, `PatchNotificationPreferences`, `ReportCategory`, `BlockedUser`, `Block`, `CreateReportPayload`, `AccountDeletionPayload`, `AccountDeletionResponse`, `AccountDeletionCancelPayload`, `SubmitRatingPayload`. Exchange constants (`ACTIVE_STATUSES`, `PENDING_STATUSES`, `HISTORY_STATUSES`) now sourced from `@shared/constants/exchanges`. Mobile-specific types that diverge from shared (e.g. `User`, `Book`, `ExchangeDetail` with counter-offer fields, `Message` with full `User` sender, `MeetupLocation` with GeoJSON) kept as local definitions with clear separation. All 34 consuming files verified — zero lint errors.
- **Resolved in**: Current session (pending commit)
- **Effort estimate**: M

### ~~GAP-M06 — Dead `useAuth.ts` Hook (Technical Debt)~~ ✅ RESOLVED

- **Feature**: Auth (internal)
- **Resolution**: Deleted `features/auth/hooks/useAuth.ts` (orphaned duplicate of `useLogin`, `useRegister`, `useLogout`, `useMe`, `useRefreshToken`, `useBiometricCheck`, `useBiometricAuthenticate` — all superseded by individual hook files and `auth.api.ts`). Full scan of `mobile/src/` confirmed this was the only truly dead file (zero imports). `pushNotifications.ts` is imported by its test file and is infrastructure for future push work, so left in place.

### ~~GAP-M07 — i18n Keys Not Centralized~~ ✅ RESOLVED

- **Feature**: i18n
- **Resolution**: Complete i18n centralization across all 3 locale files. Audited all `t()` calls in mobile `src/` (~250 distinct key paths) against the existing JSON files (151 leaf keys). Rewrote `en.json`, `fr.json`, `nl.json` to **440 leaf keys** each with identical structure. **Structural fixes**: `books.addBook` converted from flat string to nested object (15 sub-keys), `books.myBooks` converted to nested object (6 sub-keys). **Key renames**: `exchanges.counter` → `exchanges.counterOffer`, `notifications.empty` → `notifications.emptyTitle`. **Duplicate removed**: `common.done` declared twice (consolidated). **12 new namespaces**: `settings` (22 keys), `profile.edit` (22 keys), `profile.public` (4 keys), `onboarding` (12 keys), `scanner` (14 keys), `messaging` (13 keys), `ratings` (9 keys), `blocks` (3 keys), `browse` (1 key), `auth.emailVerify` (8 keys), `auth.resetConfirm` (10 keys), `notifications.pref` (1 key), plus `books.*` sub-objects (filter, photo, search, wishlist). French and Dutch translations are best-effort machine translations. All 3 files validated programmatically — zero structural mismatches, zero TypeScript errors. Also resolves GAP-L03 (Dutch translation gaps) for the mobile surface.
- **Resolved in**: Current session (pending commit)

### ~~GAP-M08 — Chat Typing Indicator Not Displayed~~ ✅ RESOLVED

- **Feature**: Messaging
- **Resolution**: `useChatWebSocket` listens for `chat.typing` events and tracks `typingUser` with auto-clear timeout. `TypingIndicator` component displays "{name} is typing..." below the message list. `sendTyping` sends typing events to the partner.
- **Resolved in**: `25e3e42` (feat(messaging): refactor chat)

---

## Gaps — Low 🟢

### ~~GAP-L01 — FloatingTabBar Chat Route Name Mismatch~~ ✅ RESOLVED

- **Feature**: Navigation
- **Resolution**: `HIDDEN_CHILD_ROUTES` in `FloatingTabBar.tsx` now correctly uses `'Chat'` matching the `MessagesStack` route name. Tab bar is also hidden for `ExchangeDetail`, `RequestSwap`, `CounterOffer`, and other child routes.
- **Resolved in**: `25e3e42`

### ~~GAP-L02 — `navigateToLogin()` Unused~~ ✅ RESOLVED

- **Feature**: Navigation
- **Resolution**: Dead code removed after audit. `navigateToLogin()` deleted from `navigationRef.ts` and its barrel export from `navigation/index.ts`. Audit confirmed no edge case needs it: 401 refresh failures go through `authStore.logout()` → conditional navigator reactively switches to Auth stack; push notification taps use `navigationRef.navigate()` directly; deep links use the `linking` config. The `navigationRef` itself is retained (used by `App.tsx` for `NavigationContainer` ref + Sentry integration, and by `notificationHandler.ts` for push-tap routing).

### ~~GAP-L03 — Dutch (nl) Translation Gaps~~ ✅ RESOLVED

- **Feature**: i18n
- **Resolution**: Mobile `nl.json` now has all 440 leaf keys with Dutch translations, matching `en.json` and `fr.json` exactly. Completed as part of GAP-M07 i18n centralization. Web `public/locales/nl/` may still have minor gaps (exchanges.json, notifications.json) — tracked separately as a web-only concern, not a mobile gap.
- **Resolved in**: Current session (pending commit, included in GAP-M07)

### ~~GAP-L04 — No Book Conditions Display on Detail~~ ✅ RESOLVED

- **Feature**: Exchanges
- **Resolution**: `ConditionsReviewModal` displays exchange conditions with translated condition keys and accept/close buttons. `DetailActions` opens the modal for `accepted` / `conditions_pending` statuses and calls `useAcceptConditions`. Exchange terms review is fully functional.
- **Resolved in**: `b3c78cf`

### ~~GAP-L05 — Username Check Not Available~~ ✅ RESOLVED

- **Feature**: Profile
- **Resolution**: `useCheckUsername` hook implemented in `features/profile/hooks/useProfile.ts` with 300ms debounce, `GET /users/check-username/?username=`, excludes current username, requires >= 3 chars. Integrated into `EditProfileScreen` with inline status icons (checkmark for available, X for taken, spinner while checking). Suggestions displayed when username is taken.
- **Resolved in**: Current session (pending commit, included in GAP-C05)

### ~~GAP-L06 — No Check Username During Registration~~ ✅ RESOLVED

- **Feature**: Auth
- **Resolution**: Inline username availability check added to `RegisterScreen`. Reuses existing `useCheckUsername` hook from `features/profile/hooks/useProfile.ts` (same 300ms debounce, `GET /users/check-username/`, >= 3 char threshold). `AuthInput` component extended with a `rightIcon` prop (ReactNode) for rendering status indicators inside the input field. Username field shows: green `CheckCircle2` when available, red `XCircle` when taken (with "Username is already taken" error text below), `ActivityIndicator` spinner while checking. Register button is disabled when username is taken, preventing fruitless form submissions. No new API endpoints or i18n keys needed — reuses existing `profile.edit.usernameTaken` key.
- **Resolved in**: Current session (pending commit)

---

## API Coverage Gaps

| Endpoint | Used by Web | Used by Mobile | Action Required |
|----------|-------------|----------------|-----------------|
| `POST /auth/email/verify/` | ✅ | ✅ | ~~GAP-C08~~: Resolved |
| `POST /auth/email/resend/` | ✅ | ✅ | ~~GAP-C08~~: Resolved |
| `POST /auth/password/reset/confirm/` | ✅ | ✅ | ~~GAP-H07~~: Resolved |
| `POST /auth/password/change/` | ✅ | ✅ | ~~GAP-H11~~: Resolved |
| `POST /auth/exchange-token/` | ✅ | ✅ | ~~GAP-H05~~: Resolved (native SDK approach) |
| `POST /auth/social/google-mobile/` | N/A | ✅ | ~~GAP-H05~~: Resolved (mobile-first endpoint) |
| `POST /auth/social/apple-mobile/` | N/A | ✅ | ~~GAP-H05~~: Resolved (mobile-first endpoint) |
| `POST /users/me/onboarding/complete/` | ✅ | ✅ | ~~GAP-H08~~: Resolved |
| `POST /users/me/delete/` | ✅ | ✅ | ~~GAP-C07~~: Resolved |
| `POST /users/me/delete/cancel/` | ✅ | ✅ | ~~GAP-C07~~: Resolved |
| `GET /users/me/data-export/` | ✅ | ✅ | ~~GAP-H09~~: Resolved |
| `GET /users/check-username/` | ✅ | ✅ | ~~GAP-L05~~: Resolved |
| `GET /users/{id}/` | ✅ | ✅ | ~~GAP-C04~~: Resolved |
| `GET /books/search-external/` | ✅ | ✅ | ~~GAP-H06~~: Resolved |
| `POST /books/{id}/photos/` | ✅ | ✅ | ~~GAP-H03~~: Resolved |
| `DELETE /books/{id}/photos/{photoId}/` | ✅ | ✅ | ~~GAP-H03~~: Resolved |
| `PATCH /books/{id}/photos/reorder/` | ✅ | ✅ | ~~GAP-H03~~: Resolved |
| `PUT/PATCH /books/{id}/` | ✅ | ✅ | ~~GAP-C06~~: Resolved |
| `GET/POST /wishlist/` | ✅ | ✅ | ~~GAP-H04~~: Resolved (+ `?book=` filter for toggle) |
| `DELETE /wishlist/{id}/` | ✅ | ✅ | ~~GAP-H04~~: Resolved |
| `GET /books/browse/radius-counts/` | ✅ | ✅ | ~~GAP-M04~~: Resolved |
| `POST /exchanges/{id}/counter/` | ❌ (hook exists) | ✅ | ~~GAP-H10~~: Resolved |
| `POST /exchanges/{id}/approve-counter/` | N/A | ✅ | ~~GAP-H10~~: Resolved (mobile-first) |
| `GET /exchanges/{id}/conditions/` | ✅ | ✅ | ~~GAP-L04~~: Resolved |
| `GET /messaging/.../meetup-suggestions/` | ✅ | ✅ | ~~GAP-M03~~: Resolved |
| `GET/POST /ratings/exchanges/{id}/` | ✅ | ✅ | ~~GAP-C01~~: Resolved |
| `GET /ratings/users/{id}/` | ✅ | ✅ | ~~GAP-C01~~: Resolved |
| `GET/POST /users/block/` | ✅ | ✅ | ~~GAP-C02~~: Resolved |
| `DELETE /users/block/{userId}/` | ✅ | ✅ | ~~GAP-C02~~: Resolved |
| `POST /reports/` | ✅ | ✅ | ~~GAP-C03~~: Resolved |
| `GET /notifications/` | ✅ | ✅ | ~~GAP-H01~~: Resolved |
| `POST /notifications/{id}/read/` | ✅ | ✅ | ~~GAP-H01~~: Resolved |
| `POST /notifications/mark-all-read/` | ✅ | ✅ | ~~GAP-H01~~: Resolved |
| `GET/PATCH /notifications/preferences/` | ✅ | ✅ | ~~GAP-H02~~: Resolved |

---

## i18n Gaps

| Area | In Web | In Mobile | Action |
|------|--------|-----------|--------|
| Ratings namespace | ✅ `ratings.json` | ✅ `ratings.*` (9 keys) in en/fr/nl | ~~GAP-C01~~ + ~~GAP-M07~~ resolved |
| Trust-safety namespace | ✅ `trust-safety.json` | ✅ `report.*` + `blocks.*` keys in en/fr/nl | ~~GAP-C02~~ + ~~GAP-C03~~ + ~~GAP-M07~~ resolved |
| Notifications namespace | ✅ `notifications.json` | ✅ `notifications.*` + `notifications.pref.*` in en/fr/nl | ~~GAP-H01~~ + ~~GAP-H02~~ + ~~GAP-M07~~ resolved |
| Settings expanded keys | ✅ in `translation.json` | ✅ `settings.*` (22 keys) in en/fr/nl | ~~GAP-M07~~ resolved |
| Books expanded keys | ✅ in `translation.json` | ✅ `books.*` nested (addBook, editBook, filter, myBooks, photo, search, wishlist) | ~~GAP-M07~~ resolved |
| Exchanges expanded keys | ✅ `exchanges.json` | ✅ `exchanges.*` (60+ keys) in en/fr/nl | ~~GAP-M07~~ resolved |
| Social auth namespace | N/A (web uses PSA redirect) | ✅ `socialAuth.*` keys in en/fr/nl | ~~GAP-H05~~ resolved |
| Dutch (nl) namespaces | ⚠️ Missing exchanges, notifications | ✅ All 440 keys translated in nl.json | ~~GAP-L03~~ + ~~GAP-M07~~ resolved |

---

## Security Parity Gaps

| Guard | Web | Mobile | Risk |
|-------|-----|--------|------|
| `IsEmailVerified` on book/exchange create | ✅ Backend enforces; web has verify UI | ✅ Backend enforces; mobile has verify pending + confirm screens + deep link + resend | Parity ✅ (inline gate deferred) |
| Block enforcement (prevent chat/exchange with blocked user) | ✅ Backend enforces; web has block UI | ✅ Backend enforces; mobile has blocked list + unblock in Settings; block/unblock hooks wired | Parity ✅ |
| Report capability | ✅ Report dialog accessible | ✅ ReportSheet on ExchangeDetail + UserProfile | Parity ✅ |
| Account deletion | ✅ Dialog in settings | ✅ DeleteAccountSheet + cancel banner + deep link | Parity ✅ |
| Auth stack prevents authed users from visiting login | ✅ `AuthRoutesWrapper` redirects | ✅ Conditional navigator | Parity ✅ |
| Protected routes require auth | ✅ `ProtectedRoute` | ✅ Conditional navigator (all main screens behind auth) | Parity ✅ |

---

## Implementation Order

Recommended order to fix gaps (critical first, then by user journey impact):

| Priority | Gap ID | Title | Effort | Rationale |
|----------|--------|-------|--------|-----------|
| ~~1~~ | ~~GAP-C08~~ | ~~Email Verification Flow~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~2~~ | ~~GAP-C04~~ | ~~UserProfileScreen~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~3~~ | ~~GAP-C01~~ | ~~Ratings UI~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~4~~ | ~~GAP-C02~~ | ~~Block/Unblock UI~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~5~~ | ~~GAP-C03~~ | ~~Report User UI~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~6~~ | ~~GAP-C05~~ | ~~EditProfileScreen~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~7~~ | ~~GAP-C06~~ | ~~EditBookScreen~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~8~~ | ~~GAP-C07~~ | ~~Account Deletion~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~9~~ | ~~GAP-H01~~ | ~~Notification List/Bell~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~10~~ | ~~GAP-H03~~ | ~~Book Photos~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~11~~ | ~~GAP-H05~~ | ~~Social Login~~ | ~~L~~ | ~~✅ Resolved~~ |
| ~~12~~ | ~~GAP-H08~~ | ~~Onboarding Flow~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~13~~ | ~~GAP-H07~~ | ~~Password Reset Confirm~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~14~~ | ~~GAP-H11~~ | ~~Password Change~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~15~~ | ~~GAP-H02~~ | ~~Notification Preferences~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~16~~ | ~~GAP-H04~~ | ~~Wishlist~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~17~~ | ~~GAP-H06~~ | ~~External Book Search~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~18~~ | ~~GAP-H09~~ | ~~Data Export~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~19~~ | ~~GAP-M01~~ | ~~Decline with Reason~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~20~~ | ~~GAP-M04~~ | ~~Radius Counts~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~21~~ | ~~GAP-M05~~ | ~~Shared Package Integration~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~22~~ | ~~GAP-M06~~ | ~~Dead useAuth.ts Cleanup~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~23~~ | ~~GAP-M07~~ | ~~i18n Key Centralization~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~24~~ | ~~GAP-M02~~ | ~~Offline Queue Wiring~~ | ~~M~~ | ~~✅ Resolved~~ |
| ~~25~~ | ~~GAP-L03~~ | ~~Dutch Translations~~ | ~~M~~ | ~~✅ Resolved (mobile; web nl gaps remain)~~ |
| ~~26~~ | ~~GAP-L02~~ | ~~Dead navigateToLogin~~ | ~~S~~ | ~~✅ Resolved~~ |
| ~~27~~ | ~~GAP-L05~~ | ~~Username Check~~ | ~~S~~ | ~~✅ Resolved (in GAP-C05)~~ |
| ~~28~~ | ~~GAP-L06~~ | ~~Registration Username Check~~ | ~~S~~ | ~~✅ Resolved~~ |

> ~~GAP-C01~~ Ratings UI, ~~GAP-C02~~ Block/Unblock UI, ~~GAP-C03~~ Report User UI, ~~GAP-C04~~ UserProfileScreen, ~~GAP-C05~~ EditProfileScreen, ~~GAP-C06~~ EditBookScreen, ~~GAP-C07~~ Account Deletion, ~~GAP-C08~~ Email Verification, ~~GAP-H01~~ Notification List/Bell, ~~GAP-H02~~ Notification Preferences, ~~GAP-H03~~ Book Photos, ~~GAP-H04~~ Wishlist, ~~GAP-H05~~ Social Login, ~~GAP-H06~~ External Book Search, ~~GAP-H07~~ Password Reset Confirm, ~~GAP-H08~~ Onboarding, ~~GAP-H09~~ Data Export, ~~GAP-H10~~ Counter-Propose, ~~GAP-H11~~ Password Change, ~~GAP-M01~~ Decline with Reason, ~~GAP-M02~~ Offline Queue Wiring, ~~GAP-M03~~ Meetup Suggestions, ~~GAP-M04~~ Radius Counts, ~~GAP-M05~~ Shared Package, ~~GAP-M06~~ Dead useAuth.ts Cleanup, ~~GAP-M07~~ i18n Key Centralization, ~~GAP-M08~~ Typing Indicator, ~~GAP-L01~~ Tab Bar Route, ~~GAP-L02~~ Dead navigateToLogin, ~~GAP-L03~~ Dutch Translations, ~~GAP-L04~~ Conditions Display, ~~GAP-L05~~ Username Check, ~~GAP-L06~~ Registration Username Check — all resolved.

---

## Status Tracking

> Updated by `gap-implement` after each gap is resolved.

| Gap ID | Status | Resolved in commit |
|--------|--------|-------------------|
| GAP-C01 | ✅ Resolved | `c869c59` |
| GAP-C02 | ✅ Resolved | `c869c59` |
| GAP-C03 | ✅ Resolved | `c869c59` |
| GAP-C04 | ✅ Resolved | `c869c59` |
| GAP-C05 | ✅ Resolved | `c869c59` |
| GAP-C06 | ✅ Resolved | `c869c59` |
| GAP-C07 | ✅ Resolved | `c869c59` |
| GAP-C08 | ✅ Resolved | `c869c59` |
| GAP-H01 | ✅ Resolved | `c869c59` |
| GAP-H02 | ✅ Resolved | `c869c59` |
| GAP-H03 | ✅ Resolved | `c869c59` |
| GAP-H04 | ✅ Resolved | `c869c59` |
| GAP-H05 | ✅ Resolved | `c869c59` |
| GAP-H06 | ✅ Resolved | pending commit |
| GAP-H07 | ✅ Resolved | pending commit |
| GAP-H08 | ✅ Resolved | pending commit |
| GAP-H09 | ✅ Resolved | pending commit |
| GAP-H10 | ✅ Resolved | `b3c78cf` |
| GAP-H11 | ✅ Resolved | pending commit |
| GAP-M01 | ✅ Resolved | pending commit |
| GAP-M02 | ✅ Resolved | pending commit |
| GAP-M03 | ✅ Resolved | `25e3e42` + `b5d9577` |
| GAP-M04 | ✅ Resolved | pending commit |
| GAP-M05 | ✅ Resolved | pending commit |
| GAP-M06 | ✅ Resolved | pending commit |
| GAP-M07 | ✅ Resolved | pending commit |
| GAP-M08 | ✅ Resolved | `25e3e42` |
| GAP-L01 | ✅ Resolved | `25e3e42` |
| GAP-L02 | ✅ Resolved | pending commit |
| GAP-L03 | ✅ Resolved | pending commit (in GAP-M07) |
| GAP-L04 | ✅ Resolved | `b3c78cf` |
| GAP-L05 | ✅ Resolved | `c869c59` (in GAP-C05) |
| GAP-L06 | ✅ Resolved | pending commit |
