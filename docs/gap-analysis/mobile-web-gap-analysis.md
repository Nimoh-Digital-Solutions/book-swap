# BookSwap — Mobile / Web Gap Analysis

> Generated: 2026-04-17
> Web source: frontend/
> Mobile source: mobile/
> Status key: ✅ Full parity · ⚠️ Partial · ❌ Gap

---

## Executive Summary

The mobile app covers the core happy-path flows — auth, browse, scan ISBN, add book, request swap, exchange lifecycle, and 1:1 chat — but **significant functional gaps** remain before the app is store-ready. Five screens are placeholder stubs (edit book, edit profile, user profile, wishlist, notification preferences), and critical safety features (block, report, ratings) have zero mobile UI despite backend support. The notification system is wired at the hook layer but has no visible UI. Photo management, email verification, account deletion, and social login are entirely absent.

**Gap count: 8 Critical · 11 High · 8 Medium · 6 Low**

The app is **not ready for production launch** without resolving at minimum the 8 critical gaps, which block core user actions or safety requirements.

---

## Feature Parity Overview

| Feature | Web | Mobile | Parity | Notes |
|---------|-----|--------|--------|-------|
| Authentication (email) | ✅ | ⚠️ | Partial | Login/register/forgot works; email verify + password reset confirm missing |
| Social Login (Google/Apple) | ✅ | ❌ | Gap | API defined, no UI |
| Onboarding / Location Setup | ✅ | ❌ | Gap | API defined, no flow |
| Browse / Discovery | ✅ | ⚠️ | Partial | Map browse works; radius counts missing |
| Book CRUD | ✅ | ⚠️ | Partial | Add + delete work; edit is a stub, no photo management |
| ISBN Scanner | N/A | ✅ | Mobile-only | |
| Wishlist | ✅ | ❌ | Gap | Placeholder screen |
| Exchange Lifecycle | ✅ | ⚠️ | Partial | Core flow works; counter-propose + decline reason missing |
| Messaging / Chat | ✅ | ⚠️ | Partial | Works; meetup suggestions + typing indicator display missing |
| Ratings | ✅ | ❌ | Gap | No UI at all |
| Notifications List | ✅ | ❌ | Gap | Hooks exist, no screen/bell |
| Notification Preferences | ✅ | ❌ | Gap | Placeholder screen |
| Push Notifications | N/A | ⚠️ | Partial | Device registration exists; no in-app display |
| Profile (own) | ✅ | ⚠️ | Partial | View works; edit is placeholder |
| Profile (public / other users) | ✅ | ❌ | Gap | Placeholder screen |
| Block / Unblock | ✅ | ❌ | Gap | API defined, no UI |
| Report User | ✅ | ❌ | Gap | API defined, no UI |
| Account Deletion | ✅ | ❌ | Gap | API defined, no UI (GDPR concern) |
| Data Export | ✅ | ❌ | Gap | No equivalent on mobile |
| Password Change | ✅ | ❌ | Gap | Settings section missing |
| Settings | ✅ | ⚠️ | Partial | Radius/location/theme/biometric; missing password change + account actions |
| i18n | ✅ | ⚠️ | Partial | Same 3 langs; many keys use inline fallbacks, not centralized |
| Offline Support | N/A | ⚠️ | Partial | Queue infra built, not wired to any mutation |
| Shared Package (@bookswap/shared) | ✅ | ❌ | Gap | Alias configured, zero imports |

---

## Gaps — Critical 🔴

### GAP-C01 — No Ratings UI

- **Feature**: Ratings
- **Web behaviour**: After an exchange reaches `swap_confirmed` / `completed`, users can submit star + comment rating. Ratings shown on public profiles and exchange detail.
- **Mobile state**: `API.ratings.*` defined in `apiEndpoints.ts`. Zero hooks or UI consume them. No rating prompt, no rating list, no rating display anywhere.
- **Impact**: Users completing swaps on mobile can never rate their partners. Breaks trust ecosystem.
- **Root cause**: Missing screen components + hooks not created for ratings.
- **Fix scope**: `mobile/src/features/ratings/` (new), update `ExchangeDetailScreen` to show rating prompt.
- **Effort estimate**: M

### GAP-C02 — No Block / Unblock UI

- **Feature**: Trust & Safety
- **Web behaviour**: Users can block/unblock others from public profiles. Blocked users list in settings. Blocks prevent chat + exchange initiation.
- **Mobile state**: `API.blocks.*` defined. No hooks, no UI, no block buttons, no blocked list screen.
- **Impact**: Users cannot protect themselves from unwanted contact or harassment on mobile.
- **Root cause**: Missing feature module entirely.
- **Fix scope**: `mobile/src/features/trust-safety/` (new), integrate into `UserProfileScreen`, `SettingsScreen`.
- **Effort estimate**: M

### GAP-C03 — No Report User UI

- **Feature**: Trust & Safety
- **Web behaviour**: Report dialog accessible from public profiles. Sends `POST /reports/` with category + reason.
- **Mobile state**: `API.reports.create` defined. No hooks, no report dialog, no entry point.
- **Impact**: Users cannot report abusive behaviour. Required for App Store compliance and user safety.
- **Root cause**: Missing feature module.
- **Fix scope**: Add `ReportDialog` component, wire from `UserProfileScreen` / `ExchangeDetailScreen`.
- **Effort estimate**: S

### GAP-C04 — UserProfileScreen is a Placeholder

- **Feature**: Profile (public)
- **Web behaviour**: `PublicProfilePage` shows avatar, bio, genres, ratings list, listed books, block/report buttons.
- **Mobile state**: Renders only an `EmptyState` with "coming soon" text. The `userId` param is received but unused.
- **Impact**: Tapping a book owner from browse/home/exchange navigates to a dead-end. Breaks discovery-to-swap flow.
- **Root cause**: Screen not implemented; needs `GET /users/{id}/` and user ratings hooks.
- **Fix scope**: `mobile/src/features/profile/screens/UserProfileScreen.tsx`, add `usePublicProfile` hook.
- **Effort estimate**: M

### GAP-C05 — EditProfileScreen is a Placeholder

- **Feature**: Profile (edit)
- **Web behaviour**: `EditProfileForm` with avatar upload, bio, genres, display name, username uniqueness check.
- **Mobile state**: Renders only an `EmptyState` with "coming soon".
- **Impact**: Users cannot edit any aspect of their profile after registration.
- **Root cause**: Screen not implemented; needs `PATCH /users/me/` hook with image picker for avatar.
- **Fix scope**: `mobile/src/features/profile/screens/EditProfileScreen.tsx`, `useUpdateProfile` hook.
- **Effort estimate**: M

### GAP-C06 — EditBookScreen is a Stub

- **Feature**: Books
- **Web behaviour**: Full form to edit book title, author, condition, description, language, genres, photos.
- **Mobile state**: Only renders `bookId` text. No form, no API call, no photo handling.
- **Impact**: Users who make a typo or want to update their book listing are stuck. Must delete and re-add.
- **Root cause**: Screen never implemented; no `useUpdateBook` mutation hook exists.
- **Fix scope**: `mobile/src/features/books/screens/EditBookScreen.tsx`, add update hook in `useBooks.ts`.
- **Effort estimate**: M

### GAP-C07 — No Account Deletion Flow

- **Feature**: Settings / Account
- **Web behaviour**: Delete account dialog with confirmation. `POST /users/me/delete/` soft-deletes, `POST /users/me/delete/cancel/` reverses.
- **Mobile state**: API endpoints defined, no UI or hooks.
- **Impact**: GDPR compliance requires users to be able to request data deletion. **App Store requirement** for iOS.
- **Root cause**: Missing settings section + hooks.
- **Fix scope**: `SettingsScreen` (add section), `useDeleteAccount` hook.
- **Effort estimate**: S

### GAP-C08 — No Email Verification Flow

- **Feature**: Auth
- **Web behaviour**: After registration, shows `EmailVerifyPendingPage`. Resend verification link. `EmailVerifyConfirmPage` for token confirmation. Email-verified gate on book creation, exchange creation, reports.
- **Mobile state**: `API.auth.emailVerify/emailResend` defined but unused. No screens for verify pending / confirm. `IsEmailVerified` backend permission applies to mobile API calls but users have no way to verify.
- **Impact**: Mobile-registered users with unverified email will get 403s when trying to create books or exchanges. Silent failure with no way to fix.
- **Root cause**: Missing screens + deep link handling for verification emails.
- **Fix scope**: Add `EmailVerifyPendingScreen`, handle email verify deep link, add resend button.
- **Effort estimate**: M

---

## Gaps — High 🟠

### GAP-H01 — No Notification List / Bell

- **Feature**: Notifications
- **Web behaviour**: Bell icon in header with unread count badge, dropdown panel listing notifications, mark individual/all read, real-time via WebSocket.
- **Mobile state**: `useNotifications`, `useMarkNotificationRead`, `useMarkAllRead` hooks exist and are fully implemented. **Not imported by any screen.** WS notifications channel is connected via `WebSocketGate` but events have no display target.
- **Root cause**: Missing NotificationListScreen or overlay component.
- **Fix scope**: New `NotificationListScreen` (or header bell), wire hooks + WS events.
- **Effort estimate**: M

### GAP-H02 — No Notification Preferences

- **Feature**: Notifications
- **Web behaviour**: Toggles for email/in-app/push per notification type. `GET/PATCH /notifications/preferences/`.
- **Mobile state**: `NotificationPreferencesScreen` is a "coming soon" placeholder. API endpoint defined.
- **Root cause**: Screen not implemented.
- **Fix scope**: Implement screen with toggle switches, add `useNotificationPreferences` hook.
- **Effort estimate**: S

### GAP-H03 — No Book Photo Management

- **Feature**: Books
- **Web behaviour**: Upload multiple photos, delete individual photos, reorder via drag. `POST/DELETE photos/`, `PATCH photos/reorder/`.
- **Mobile state**: `API.books.photos*` defined. Zero hooks, zero usage in AddBook or EditBook screens. Books on mobile are text-only listings.
- **Root cause**: No photo hooks; image picker not integrated.
- **Fix scope**: Photo hooks in `useBooks.ts`, integrate into `AddBookScreen` + `EditBookScreen`.
- **Effort estimate**: M

### GAP-H04 — No Wishlist Functionality

- **Feature**: Wishlist
- **Web behaviour**: Add/remove books to wishlist, view wishlist list. Helps discovery matching.
- **Mobile state**: `WishlistScreen` is "coming soon" placeholder. `API.wishlist.*` defined, no hooks.
- **Root cause**: Feature not implemented.
- **Fix scope**: `WishlistScreen`, add hooks, integrate add-to-wishlist from `BookDetailScreen`.
- **Effort estimate**: M

### GAP-H05 — No Social Login (Google / Apple)

- **Feature**: Auth
- **Web behaviour**: Google OAuth button on login page. Token exchange flow.
- **Mobile state**: `API.auth.socialLoginStart` and `exchangeToken` defined. No UI buttons, no `expo-auth-session` or native OAuth integration.
- **Root cause**: Missing OAuth configuration + login screen buttons.
- **Fix scope**: `LoginScreen` (add buttons), `expo-auth-session` or `@react-native-google-signin`, Apple Sign-In (iOS requirement).
- **Effort estimate**: L

### GAP-H06 — No External Book Search

- **Feature**: Books
- **Web behaviour**: When ISBN lookup fails or user doesn't have ISBN, can search by title/author via external API (Google Books).
- **Mobile state**: `API.books.searchExternal` defined, unused.
- **Root cause**: Missing hook + UI path in `AddBookScreen` / `ScanResultScreen`.
- **Fix scope**: Add `useExternalBookSearch` hook, fallback search in AddBook flow.
- **Effort estimate**: S

### GAP-H07 — No Password Reset Confirm Screen

- **Feature**: Auth
- **Web behaviour**: `PasswordResetConfirmPage` handles the token link from reset email. User sets new password.
- **Mobile state**: `ForgotPasswordScreen` sends the reset request. No screen to handle the confirm link. Deep link to `password-reset/confirm` not in `linking.ts`.
- **Root cause**: Missing screen + deep link route.
- **Fix scope**: Add `PasswordResetConfirmScreen`, register deep link.
- **Effort estimate**: S

### GAP-H08 — No Onboarding / Location Setup

- **Feature**: Onboarding
- **Web behaviour**: After first login, `OnboardingPage` prompts location setup (used for radius-based browse). `POST /users/me/onboarding/complete/`.
- **Mobile state**: `API.users.meOnboardingComplete` defined, unused. New users go straight to home after login. `SettingsScreen` has location set, but no guided first-run flow.
- **Root cause**: Missing onboarding screen/flow after registration.
- **Fix scope**: Add `OnboardingScreen` to auth flow, call onboarding complete endpoint.
- **Effort estimate**: M

### GAP-H09 — No Data Export

- **Feature**: Settings / Privacy
- **Web behaviour**: Data export button triggers `GET /users/me/data-export/` → downloads JSON.
- **Mobile state**: No endpoint usage, no UI.
- **Root cause**: Missing settings section + hook.
- **Fix scope**: `SettingsScreen` (add button), share/save downloaded file.
- **Effort estimate**: S

### GAP-H10 — No Counter-Propose Exchange Flow

- **Feature**: Exchanges
- **Web behaviour**: `counterProposeSchema` defined; `useCounterExchange` hook exists (unused in web UI too). Backend `POST /exchanges/{id}/counter/` fully implemented.
- **Mobile state**: `useCounterExchange` hook exists in `useExchanges.ts` but is **not imported** by `DetailActions.tsx`. No UI button or form for counter-proposals.
- **Root cause**: UI for counter-propose not built on either surface. Backend ready.
- **Fix scope**: Add counter-propose button + modal in `DetailActions`, show counter-offered books.
- **Effort estimate**: M

### GAP-H11 — No Password Change

- **Feature**: Settings
- **Web behaviour**: `PasswordChangeSection` in Settings for email-authenticated users. `PATCH /auth/password/change/`.
- **Mobile state**: `API.auth.passwordChange` defined. No UI in `SettingsScreen`.
- **Root cause**: Missing settings section.
- **Fix scope**: `SettingsScreen` — add password change form/modal.
- **Effort estimate**: S

---

## Gaps — Medium 🟡

### GAP-M01 — Decline Without Reason

- **Feature**: Exchanges
- **Web behaviour**: Decline dialog includes optional reason selection (`DeclineReason` enum on backend). `DeclineSerializer` accepts `reason` field.
- **Mobile state**: `useDeclineExchange` sends `{ exchangeId }` without a reason. `DetailActions` confirms via `Alert.alert` but collects no reason.
- **Root cause**: Mutation payload incomplete.
- **Fix scope**: Update decline flow to include reason picker before confirm.
- **Effort estimate**: S

### GAP-M02 — Offline Mutation Queue Not Wired

- **Feature**: Offline support
- **Web behaviour**: N/A (web assumes connectivity).
- **Mobile state**: `lib/offlineMutationQueue.ts` fully implemented + tested. `enqueueMutation` / `useOfflineMutationDrain` never imported by any screen or App component.
- **Root cause**: Infrastructure built but integration skipped.
- **Fix scope**: Wire `useOfflineMutationDrain` in `App.tsx`, enqueue key mutations (send message, create exchange) when offline.
- **Effort estimate**: M

### GAP-M03 — No Meetup Suggestions in Chat

- **Feature**: Messaging
- **Web behaviour**: Meetup suggestions panel shows safe public locations near both parties.
- **Mobile state**: `API.messaging.meetupSuggestions` defined, not called. No UI in `ChatScreen`.
- **Root cause**: Missing hook + UI component.
- **Fix scope**: Add `useMeetupSuggestions` hook, integrate into `ChatScreen`.
- **Effort estimate**: S

### GAP-M04 — No Radius Counts in Browse

- **Feature**: Discovery
- **Web behaviour**: Radius count indicators show how many books at different distances.
- **Mobile state**: `API.browse.radiusCounts` defined, unused in `BrowseMapScreen`.
- **Root cause**: Missing hook + UI element.
- **Fix scope**: Add `useRadiusCounts` hook, show in browse filter panel.
- **Effort estimate**: S

### GAP-M05 — Shared Package (@bookswap/shared) Not Consumed

- **Feature**: Code architecture
- **Web behaviour**: Web uses shared types, schemas, constants where applicable.
- **Mobile state**: `tsconfig` + Jest alias for `@shared/*` configured. Zero imports in application source. Types duplicated in `mobile/src/types/`.
- **Root cause**: Integration deferred during initial mobile build.
- **Fix scope**: Replace local type definitions with shared imports, validate schemas match.
- **Effort estimate**: M

### GAP-M06 — Dead `useAuth.ts` Hook (Technical Debt)

- **Feature**: Auth (internal)
- **Web behaviour**: N/A.
- **Mobile state**: `hooks/useAuth.ts` duplicates login/register/logout/refresh via `http` directly. Not imported anywhere. Active code uses `useLogin`/`useRegister`/`auth.api.ts` path.
- **Root cause**: Alternate implementation never cleaned up.
- **Fix scope**: Delete `features/auth/hooks/useAuth.ts`.
- **Effort estimate**: S

### GAP-M07 — i18n Keys Not Centralized

- **Feature**: i18n
- **Web behaviour**: All strings in `public/locales/{lng}/{namespace}.json` files.
- **Mobile state**: Many screens use `t('key', 'English fallback')` for keys not present in `en.json`. Works at runtime but makes translation management impossible — translators can't see what strings exist.
- **Root cause**: Rapid iteration with inline fallbacks instead of proper key registration.
- **Fix scope**: Audit all `t()` calls, add missing keys to `en.json` / `fr.json` / `nl.json`.
- **Effort estimate**: M

### GAP-M08 — Chat Typing Indicator Not Displayed

- **Feature**: Messaging
- **Web behaviour**: Shows "user is typing..." indicator when partner types.
- **Mobile state**: WebSocket handles `chat.message` and `chat.read` events. `chat.typing` events may arrive but there's no visible typing indicator in `ChatScreen` UI.
- **Root cause**: Missing UI component for typing state.
- **Fix scope**: Listen for `chat.typing` WS events, show indicator in `ChatScreen`.
- **Effort estimate**: S

---

## Gaps — Low 🟢

### GAP-L01 — FloatingTabBar Chat Route Name Mismatch

- **Feature**: Navigation
- **Web behaviour**: N/A.
- **Mobile state**: `HIDDEN_CHILD_ROUTES` set includes `'ChatScreen'` but the actual stack route name is `'Chat'`. Tab bar may still show on the chat screen.
- **Root cause**: String mismatch.
- **Fix scope**: Fix `'ChatScreen'` → `'Chat'` in `FloatingTabBar.tsx`.
- **Effort estimate**: S

### GAP-L02 — `navigateToLogin()` Unused

- **Feature**: Navigation
- **Mobile state**: `navigation/navigationRef.ts` exports `navigateToLogin()` which resets to Auth stack. Never called; logout via store clears auth → conditional navigator already handles redirect.
- **Root cause**: Dead code from early implementation.
- **Fix scope**: Remove or integrate if needed for deep-link edge cases.
- **Effort estimate**: S

### GAP-L03 — Dutch (nl) Translation Gaps

- **Feature**: i18n
- **Web behaviour**: `public/locales/nl/` is also missing `exchanges.json` and `notifications.json`.
- **Mobile state**: `nl.json` has same key structure as `en.json` / `fr.json` but many extended keys are missing on both surfaces. Falls back to English.
- **Root cause**: Translation work incomplete for nl locale.
- **Fix scope**: Complete nl translations across both surfaces.
- **Effort estimate**: M

### GAP-L04 — No Book Conditions Display on Detail

- **Feature**: Exchanges
- **Web behaviour**: Exchange detail shows `GET /exchanges/{id}/conditions/` data.
- **Mobile state**: `API.exchanges.conditions` defined. No hook fetches it; `ExchangeDetailScreen` doesn't show conditions text.
- **Root cause**: Missing hook + UI section.
- **Fix scope**: Add conditions fetch + display in detail screen.
- **Effort estimate**: S

### GAP-L05 — Username Check Not Available

- **Feature**: Profile
- **Web behaviour**: `EditProfileForm` checks username availability via `GET /users/check-username/?username=`.
- **Mobile state**: `API.users.checkUsername` defined. No hook or UI. `EditProfileScreen` is a placeholder anyway (GAP-C05).
- **Root cause**: Dependent on GAP-C05 resolution.
- **Fix scope**: Include in `EditProfileScreen` implementation.
- **Effort estimate**: S (included in GAP-C05)

### GAP-L06 — No Check Username During Registration

- **Feature**: Auth
- **Web behaviour**: Registration form doesn't check username availability inline either.
- **Mobile state**: Same gap on both surfaces; not mobile-specific.
- **Fix scope**: Optional UX enhancement.
- **Effort estimate**: S

---

## API Coverage Gaps

| Endpoint | Used by Web | Used by Mobile | Action Required |
|----------|-------------|----------------|-----------------|
| `POST /auth/email/verify/` | ✅ | ❌ | GAP-C08: Add email verification flow |
| `POST /auth/email/resend/` | ✅ | ❌ | GAP-C08: Add resend button |
| `POST /auth/password/reset/confirm/` | ✅ | ❌ | GAP-H07: Add confirm screen |
| `POST /auth/password/change/` | ✅ | ❌ | GAP-H11: Add settings section |
| `POST /auth/exchange-token/` | ✅ | ❌ | GAP-H05: Social login flow |
| `GET /auth/social/login/{backend}/` | ✅ | ❌ | GAP-H05: Social login flow |
| `POST /users/me/onboarding/complete/` | ✅ | ❌ | GAP-H08: Onboarding flow |
| `POST /users/me/delete/` | ✅ | ❌ | GAP-C07: Account deletion |
| `POST /users/me/delete/cancel/` | ✅ | ❌ | GAP-C07: Account deletion |
| `GET /users/me/data-export/` | ✅ | ❌ | GAP-H09: Data export |
| `GET /users/check-username/` | ✅ | ❌ | GAP-L05: Username check |
| `GET /users/{id}/` | ✅ | ❌ | GAP-C04: Public profile |
| `GET /books/search-external/` | ✅ | ❌ | GAP-H06: External search |
| `POST /books/{id}/photos/` | ✅ | ❌ | GAP-H03: Photo upload |
| `DELETE /books/{id}/photos/{photoId}/` | ✅ | ❌ | GAP-H03: Photo delete |
| `PATCH /books/{id}/photos/reorder/` | ✅ | ❌ | GAP-H03: Photo reorder |
| `PUT/PATCH /books/{id}/` | ✅ | ❌ | GAP-C06: Book edit |
| `GET/POST /wishlist/` | ✅ | ❌ | GAP-H04: Wishlist |
| `DELETE /wishlist/{id}/` | ✅ | ❌ | GAP-H04: Wishlist |
| `GET /books/browse/radius-counts/` | ✅ | ❌ | GAP-M04: Radius counts |
| `POST /exchanges/{id}/counter/` | ❌ (hook exists) | ❌ (hook exists) | GAP-H10: Counter-propose |
| `GET /exchanges/{id}/conditions/` | ✅ | ❌ | GAP-L04: Conditions display |
| `GET /messaging/.../meetup-suggestions/` | ✅ | ❌ | GAP-M03: Meetup suggestions |
| `GET/POST /ratings/exchanges/{id}/` | ✅ | ❌ | GAP-C01: Ratings |
| `GET /ratings/users/{id}/` | ✅ | ❌ | GAP-C01: Ratings on profile |
| `GET/POST /users/block/` | ✅ | ❌ | GAP-C02: Block/unblock |
| `DELETE /users/block/{userId}/` | ✅ | ❌ | GAP-C02: Unblock |
| `POST /reports/` | ✅ | ❌ | GAP-C03: Report |
| `GET /notifications/` | ✅ | ❌ (hook exists, unused) | GAP-H01: Wire hooks |
| `POST /notifications/{id}/read/` | ✅ | ❌ (hook exists, unused) | GAP-H01: Wire hooks |
| `POST /notifications/mark-all-read/` | ✅ | ❌ (hook exists, unused) | GAP-H01: Wire hooks |
| `GET/PATCH /notifications/preferences/` | ✅ | ❌ | GAP-H02: Preferences |

---

## i18n Gaps

| Area | In Web | In Mobile | Action |
|------|--------|-----------|--------|
| Ratings namespace | ✅ `ratings.json` | ❌ No keys | Add when GAP-C01 resolved |
| Trust-safety namespace | ✅ `trust-safety.json` | ❌ No keys | Add when GAP-C02/C03 resolved |
| Notifications namespace | ✅ `notifications.json` | ⚠️ Minimal (`title`, `markAllRead`, `empty`) | Expand when GAP-H01/H02 resolved |
| Settings expanded keys | ✅ in `translation.json` | ❌ Inline fallbacks only | GAP-M07 |
| Books expanded keys | ✅ in `translation.json` | ⚠️ Partial, many inline | GAP-M07 |
| Exchanges expanded keys | ✅ `exchanges.json` | ⚠️ Partial, many inline | GAP-M07 |
| Dutch (nl) namespaces | ⚠️ Missing exchanges, notifications | ⚠️ Same structure but sparse | GAP-L03 |

---

## Security Parity Gaps

| Guard | Web | Mobile | Risk |
|-------|-----|--------|------|
| `IsEmailVerified` on book/exchange create | ✅ Backend enforces; web has verify UI | ❌ Backend enforces; mobile has **no verify UI** → 403 with no recovery path | Users stuck; can't create books or exchanges |
| Block enforcement (prevent chat/exchange with blocked user) | ✅ Backend enforces; web has block UI | ❌ Backend enforces; mobile has **no block UI** → user can't initiate blocks | User can't defend against harassment |
| Report capability | ✅ Report dialog accessible | ❌ No report UI | User safety gap; App Store concern |
| Account deletion | ✅ Dialog in settings | ❌ No UI | GDPR / App Store compliance gap |
| Auth stack prevents authed users from visiting login | ✅ `AuthRoutesWrapper` redirects | ✅ Conditional navigator | Parity ✅ |
| Protected routes require auth | ✅ `ProtectedRoute` | ✅ Conditional navigator (all main screens behind auth) | Parity ✅ |

---

## Implementation Order

Recommended order to fix gaps (critical first, then by user journey impact):

| Priority | Gap ID | Title | Effort | Rationale |
|----------|--------|-------|--------|-----------|
| 1 | GAP-C08 | Email Verification Flow | M | Unblocks book/exchange creation for mobile-registered users |
| 2 | GAP-C04 | UserProfileScreen | M | Unblocks discovery→profile→swap flow |
| 3 | GAP-C01 | Ratings UI | M | Core trust feature, needed for launch |
| 4 | GAP-C02 | Block/Unblock UI | M | Safety requirement |
| 5 | GAP-C03 | Report User UI | S | Safety + App Store requirement |
| 6 | GAP-C05 | EditProfileScreen | M | Users must be able to manage their identity |
| 7 | GAP-C06 | EditBookScreen | M | Users must be able to fix listings |
| 8 | GAP-C07 | Account Deletion | S | GDPR + App Store requirement |
| 9 | GAP-H01 | Notification List/Bell | M | Core engagement feature |
| 10 | GAP-H03 | Book Photos | M | Listings without photos have low engagement |
| 11 | GAP-H05 | Social Login | L | Reduces registration friction |
| 12 | GAP-H08 | Onboarding Flow | M | First-run experience |
| 13 | GAP-H07 | Password Reset Confirm | S | Completes forgot-password flow |
| 14 | GAP-H11 | Password Change | S | Basic account management |
| 15 | GAP-H02 | Notification Preferences | S | User control over communications |
| 16 | GAP-H04 | Wishlist | M | Discovery enhancement |
| 17 | GAP-H06 | External Book Search | S | Add-book flow enhancement |
| 18 | GAP-H09 | Data Export | S | Privacy compliance |
| 19 | GAP-H10 | Counter-Propose | M | Exchange flexibility (neither surface has it) |
| 20 | GAP-M01 | Decline with Reason | S | Better UX for declined exchanges |
| 21 | GAP-M03 | Meetup Suggestions | S | Safety enhancement for physical meetups |
| 22 | GAP-M08 | Typing Indicator | S | Chat polish |
| 23 | GAP-M04 | Radius Counts | S | Browse enhancement |
| 24 | GAP-M05 | Shared Package Integration | M | Technical debt / consistency |
| 25 | GAP-M06 | Dead useAuth.ts Cleanup | S | Technical debt |
| 26 | GAP-M07 | i18n Key Centralization | M | Translation management |
| 27 | GAP-M02 | Offline Queue Wiring | M | Mobile resilience |
| 28 | GAP-L01 | Tab Bar Route Mismatch | S | Navigation bug |
| 29 | GAP-L04 | Conditions Display | S | Detail completeness |
| 30 | GAP-L03 | Dutch Translations | M | Locale completeness |
| 31 | GAP-L02 | Dead navigateToLogin | S | Cleanup |
| 32 | GAP-L05 | Username Check | S | Included in GAP-C05 |
| 33 | GAP-L06 | Registration Username Check | S | Optional enhancement |

---

## Status Tracking

> Updated by `gap-implement` after each gap is resolved.

| Gap ID | Status | Resolved in commit |
|--------|--------|-------------------|
| GAP-C01 | ❌ Pending | — |
| GAP-C02 | ❌ Pending | — |
| GAP-C03 | ❌ Pending | — |
| GAP-C04 | ❌ Pending | — |
| GAP-C05 | ❌ Pending | — |
| GAP-C06 | ❌ Pending | — |
| GAP-C07 | ❌ Pending | — |
| GAP-C08 | ❌ Pending | — |
| GAP-H01 | ❌ Pending | — |
| GAP-H02 | ❌ Pending | — |
| GAP-H03 | ❌ Pending | — |
| GAP-H04 | ❌ Pending | — |
| GAP-H05 | ❌ Pending | — |
| GAP-H06 | ❌ Pending | — |
| GAP-H07 | ❌ Pending | — |
| GAP-H08 | ❌ Pending | — |
| GAP-H09 | ❌ Pending | — |
| GAP-H10 | ❌ Pending | — |
| GAP-H11 | ❌ Pending | — |
| GAP-M01 | ❌ Pending | — |
| GAP-M02 | ❌ Pending | — |
| GAP-M03 | ❌ Pending | — |
| GAP-M04 | ❌ Pending | — |
| GAP-M05 | ❌ Pending | — |
| GAP-M06 | ❌ Pending | — |
| GAP-M07 | ❌ Pending | — |
| GAP-M08 | ❌ Pending | — |
| GAP-L01 | ❌ Pending | — |
| GAP-L02 | ❌ Pending | — |
| GAP-L03 | ❌ Pending | — |
| GAP-L04 | ❌ Pending | — |
| GAP-L05 | ❌ Pending | — |
| GAP-L06 | ❌ Pending | — |
