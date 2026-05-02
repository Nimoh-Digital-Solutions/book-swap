# BookSwap Mobile — Deep UX & Polish Audit

**Date:** 2 May 2026  
**Scope:** Full pass — every screen, component, hook, and user flow  
**Focus:** UX polish, flow gaps, feature completeness, improvement suggestions  
**Audited against:** App Store quality bar (not PRD/user stories)

**Verification status (2026-05-02 22:20 CEST):** All P0 / P1 / P2 items
manually re-verified against the live codebase. Every "✅ Done" line in
§ 11 maps to working code in `main` (commits c37e901 / 5cadf40 / 77cf404
/ 813b517). Mobile CI runs 137/137 tests green, type-check + lint clean.
One minor caveat: P2 #11 (ActivityIndicator colour audit) intentionally
keeps `color="#000"` in `AppleAuthButton.tsx` and `SocialAuthSection.tsx`
because the dark sign-in button background needs that contrast — these
are Apple-mandated styling and not theme-tokenised on purpose.

---

## Executive Summary

The BookSwap mobile app is **remarkably well-built**. All five critical user flows (onboarding, listing, exchanging, messaging, profile management) are complete end-to-end. The offline mutation queue, WebSocket layer, and error recovery are production-grade. The theme system is well-structured with full light/dark parity.

The gaps found are almost entirely in the **polish layer** — missing pull-to-refresh on 4 screens, sparse haptic feedback, a few hardcoded colours that risk dark mode issues, and accessibility gaps on toast/banner components. There are no broken flows, no incomplete features, and zero TODO/FIXME comments in the codebase.

**Stats:** 36 screens audited · 50+ components · 40+ hooks · 5 critical flows traced · 3 services reviewed

---

## Table of Contents

1. [Flow Gaps](#1-flow-gaps)
2. [Pull-to-Refresh Gaps](#2-pull-to-refresh-gaps)
3. [Loading, Empty & Error State Gaps](#3-loading-empty--error-state-gaps)
4. [Accessibility Gaps](#4-accessibility-gaps)
5. [Dark Mode & Theming Gaps](#5-dark-mode--theming-gaps)
6. [Haptic Feedback Gaps](#6-haptic-feedback-gaps)
7. [Animation & Micro-Interaction Gaps](#7-animation--micro-interaction-gaps)
8. [i18n Gaps](#8-i18n-gaps)
9. [Keyboard Handling](#9-keyboard-handling)
10. [Improvement Suggestions](#10-improvement-suggestions)
11. [Prioritised Action Plan](#11-prioritised-action-plan)

---

## 1. Flow Gaps

### FG-01 · No first-time guided tour after onboarding
**Severity:** Medium  
**Screen:** Post-onboarding (HomeScreen first visit)

After completing location setup, the user lands on HomeScreen with no orientation. There's no feature tour, tooltip highlights, or "getting started" checklist. First-time users may not discover:
- The scan tab for adding books via ISBN
- The profile tab (hidden from the tab bar — only reachable via avatar)
- How exchanges work

**Suggestion:** Add a lightweight coach-mark overlay (3–4 steps) on first HomeScreen visit. Alternatively, add a dismissible "Getting Started" card to HomeScreen that tracks completion (add book, browse, make first request).

### FG-02 · ProfileTab hidden from tab bar — discoverability risk
**Severity:** Low  
**File:** `mobile/src/navigation/MainTabs.tsx`

ProfileTab is excluded from the floating tab bar and only reachable via the header avatar. This is a deliberate design choice but may confuse users expecting a profile icon in the tab bar.

**Suggestion:** Consider adding a subtle visual cue (pulse animation on the avatar on first launch, or a tooltip arrow) to guide users to their profile.

### FG-03 · No unsaved changes warning on EditProfileScreen
**Severity:** Low  
**File:** `mobile/src/features/profile/screens/EditProfileScreen.tsx`

If a user edits their bio/name/genres and navigates away (back button, tab switch), changes are silently lost. No "Discard changes?" confirmation.

**Suggestion:** Use `navigation.addListener('beforeRemove')` to intercept navigation when the form is dirty.

### FG-04 · Messages tab has no unread badge
**Severity:** Medium  
**File:** `mobile/src/navigation/MainTabs.tsx`

The `TabItem` component supports rendering a badge via `options.tabBarBadge`, but `MainTabs.tsx` never sets a badge on the MessagesTab. Users have no indication of new exchanges or messages without opening the tab.

The notification bell in the header does show an unread count, but that's for notifications — not for unread chat messages or pending exchange requests specifically.

**Suggestion:** Set `tabBarBadge` on MessagesTab using `useIncomingCount()` or an unread messages count. The infrastructure is already there.

### FG-05 · MyProfileScreen doesn't refresh from server
**Severity:** Low  
**File:** `mobile/src/features/profile/screens/MyProfileScreen.tsx`

MyProfileScreen reads entirely from the Zustand auth store (local state). There's no API query and no pull-to-refresh. If another device updates the profile, or if a rating comes in, this screen won't reflect it until the next login/token refresh.

**Suggestion:** Add a lightweight `useQuery` that fetches `/users/me/` on mount (with long staleTime), and pull-to-refresh support.

---

## 2. Pull-to-Refresh Gaps

| # | Screen | Has Pull-to-Refresh? | Issue |
|---|--------|---------------------|-------|
| PR-01 | HomeScreen | ✅ Yes | — |
| PR-02 | MyBooksScreen | ✅ Yes | — |
| PR-03 | ExchangeListScreen | ✅ Yes | — |
| PR-04 | NotificationListScreen | ✅ Yes | — |
| PR-05 | UserReviewsScreen | ✅ Yes | — |
| PR-06 | WishlistScreen | ✅ Yes | — |
| PR-07 | **BookDetailScreen** | ❌ No | ScrollView only — user can't refresh stale book data |
| PR-08 | **BrowseMapScreen** | ❌ No | Has retry banner for errors, but no pull-to-refresh on the list |
| PR-09 | **ChatScreen** | ❌ No | Uses `useFocusEffect` auto-refetch; inverted FlatList makes PTR awkward but "scroll to load older" exists |
| PR-10 | **MyProfileScreen** | ❌ No | Reads from local Zustand store; no server query to refresh |

**Severity:** Medium (PR-07, PR-08), Low (PR-09, PR-10)

**Fix:** Add `RefreshControl` to BookDetailScreen and BrowseMapScreen's bottom sheet list. ChatScreen's inverted list makes standard PTR feel wrong — consider a "pull down to load newer" or keep auto-refetch. MyProfileScreen needs a server query first.

---

## 3. Loading, Empty & Error State Gaps

### Coverage Matrix

| Screen | Loading | Empty | Error + Retry |
|--------|---------|-------|---------------|
| HomeScreen | ✅ Section-level | ✅ Location denied banner | ✅ Error hint + retry |
| BrowseMapScreen | ✅ SkeletonCard | ✅ EmptyState | ✅ MapLoadErrorBanner |
| BookDetailScreen | ✅ SkeletonBookDetail | ✅ "Not found" | ✅ Retry button |
| **BookSearchScreen** | ✅ ActivityIndicator | ✅ "No books found" | ⚠️ **Text only — no retry button** |
| MyBooksScreen | ✅ SkeletonCard | ✅ "Add your first book" | ✅ Retry |
| ExchangeListScreen | ✅ SkeletonCard | ✅ Per-tab empty | ✅ Retry |
| ChatScreen | ✅ BrandedLoader | ✅ EmptyState | ✅ Retry button |
| NotificationListScreen | ✅ BrandedLoader | ✅ "No notifications" | ✅ Retry |
| MyProfileScreen | N/A (local) | Returns null if no user | N/A |

### LE-01 · BookSearchScreen error state has no retry button
**Severity:** Low  
**File:** `mobile/src/features/books/screens/BookSearchScreen.tsx`

When the external book search API fails, the screen shows "Search failed — Please check your connection and try again" but there's no retry button. The user must re-type or edit their search query to trigger a new request.

**Suggestion:** Add a "Retry" `Pressable` that calls `refetch()`.

### LE-02 · No skeleton loader for community stats section on HomeScreen
**Severity:** Low  
**File:** `mobile/src/features/books/components/home/HomeCommunitySection.tsx`

While `HomeRecentlyAdded` shows skeletons during loading, the community stats section shows nothing until data arrives. Creates a layout shift.

**Suggestion:** Add a simple skeleton for the stats section (2 placeholder rows).

### LE-03 · No skeleton for notification list
**Severity:** Low  
**File:** `mobile/src/features/notifications/screens/NotificationListScreen.tsx`

Uses `BrandedLoader` (full-screen branded spinner) instead of skeleton placeholders. Every other list screen (MyBooks, Exchanges, Browse) uses `SkeletonCard` which feels more modern and less blocking.

**Suggestion:** Replace `BrandedLoader` with a skeleton list pattern matching other screens.

---

## 4. Accessibility Gaps

### A11Y-01 · Toast notifications not announced to screen readers
**Severity:** High  
**File:** `mobile/src/components/Toast.tsx`

The toast component (`react-native-toast-message` with custom config) has no `accessibilityLiveRegion`, no `accessibilityRole="alert"`, and no explicit announcement. VoiceOver/TalkBack users will miss all toast feedback (success confirmations, error messages, info notifications).

**Suggestion:** Add `accessibilityLiveRegion="polite"` (or `"assertive"` for errors) to the toast wrapper View. Consider also using `AccessibilityInfo.announceForAccessibility()` as a fallback.

### A11Y-02 · OfflineBanner has no accessibility role or label
**Severity:** Medium  
**File:** `mobile/src/components/OfflineBanner.tsx`

The offline/degraded connectivity banner appears visually but has no `accessibilityRole="alert"` or `accessibilityLabel`. Screen reader users won't know the app has lost connectivity.

**Suggestion:** Add `accessibilityRole="alert"` and `accessibilityLabel={t('offline.banner')}`.

### A11Y-03 · Skeleton components have no accessibility attributes
**Severity:** Low  
**File:** `mobile/src/components/Skeleton.tsx`

Skeleton shimmer placeholders have no `accessibilityRole="progressbar"` or `accessibilityLabel="Loading"`. Screen readers see empty elements.

**Suggestion:** Add `accessibilityRole="progressbar"` and `accessibilityLabel={t('common.loading')}` to the Skeleton wrapper.

### A11Y-04 · accessibilityHint used in only 2 places
**Severity:** Low  
**Files:** App-wide

`accessibilityLabel` is well-distributed (40+ usages). `accessibilityRole` is present in ~30 places. But `accessibilityHint` (which tells the user what will happen when they interact) exists in only 2 locations: WishlistScreen and a SettingsRow.

**Suggestion:** Add `accessibilityHint` to primary CTAs: "Request Swap" button, exchange action buttons, tab items, and navigation-triggering cards.

---

## 5. Dark Mode & Theming Gaps

### Theme System Assessment: ✅ Well-structured

The token system is solid: `theme.ts` (light) + `darkColors.ts` (dark) with full parity. Semantic categories (`brand`, `text`, `surface`, `border`, `status`). Consistent spacing/radius/typography scales. `useColors()` + `useIsDark()` hooks used throughout.

### DM-01 · Hardcoded hex colours in feature screens
**Severity:** Medium  
**Affected files:**

| File | Hardcoded Values |
|------|-----------------|
| `OnboardingScreen.tsx` | `#152018`, `#EF4444`, `#fff` (6+ instances) |
| `EmptyState.tsx` | `#152018` for action button text |
| `BrandedLoader.tsx` | `rgba(20, 34, 25, 0.92)` for backdrop |
| `LocationMismatchBanner.tsx` | `rgba(228, 182, 67, 0.08)` for background |
| Various `ActivityIndicator` usages | `#152018`, `#000`, `#fff` for spinner colours |

These won't adapt in dark mode. `#152018` (dark green) becomes invisible on a dark background. `#fff` text on a light surface disappears in light mode but looks fine in dark.

**Suggestion:** Replace all hardcoded hex values with theme tokens: `c.text.primary`, `c.text.inverse`, `c.status.error`, `c.brand.primaryBg`, etc. The tokens already exist for every case.

### DM-02 · Exchange placeholder book cover colours are hardcoded
**Severity:** Low  
**File:** Exchange detail components

`COVER_COLORS` arrays use hardcoded hex values for placeholder book covers when no photo exists. This is likely intentional (decorative) and won't cause readability issues, but could be theme-aware for extra polish.

---

## 6. Haptic Feedback Gaps

### Current Haptic Usage (6 locations)

| Location | Haptic Type |
|----------|------------|
| ChatScreen (send message) | `hapticImpact('light')` |
| StarInput (select rating) | `hapticSelection()` |
| BookCard (press) | `hapticImpact('light')` |
| DetailActions (accept/decline) | `hapticNotification(success/warning)` |
| WishlistScreen (delete) | `hapticImpact('light')` |
| ExchangeCard (press) | `hapticImpact('light')` |

### HF-01 · Missing haptic feedback on key interactions
**Severity:** Low  
**Impact:** Reduced tactile polish — the 6 existing usages create an expectation that isn't met elsewhere

**Missing from:**
- **Tab bar presses** — the floating tab bar has no haptic on switch
- **Pull-to-refresh completion** — no haptic when refresh finishes
- **Form submission success** — login, register, add book, edit profile
- **Toggle switches** — settings toggles (biometric, privacy, notification prefs)
- **Destructive action confirmation** — delete book, delete account, block user
- **Toast appearance** — success/error toasts could trigger haptic
- **ISBN scan success** — satisfying moment when barcode is recognised
- **Exchange status transitions** — when an exchange moves to a new state

**Suggestion:** Add `hapticSelection()` to tab switches and toggles. Add `hapticNotification('success')` to form submissions and scan success. Add `hapticNotification('warning')` to destructive confirmations.

---

## 7. Animation & Micro-Interaction Gaps

### Current Animation Usage

| Feature | Animation Library | What |
|---------|------------------|------|
| Onboarding | Reanimated | `FadeIn`, `FadeInUp` for content entry |
| Scanner | Reanimated | Bouncing scan line in viewfinder |
| Chat bubbles | Reanimated | `SlideInLeft`/`SlideInRight` on new messages |
| Typing indicator | Reanimated | Bouncing dots |
| HomeScreen | Reanimated | `FadeIn`, `FadeInUp` for sections |
| ExchangeList | Reanimated | Animated tab indicator underline |
| WishlistScreen | Reanimated | `FadeOut`, `Layout` on item removal |
| FloatingTabBar | Reanimated | Active tab indicator animation |
| Notification bell | Reanimated | Badge scale animation |

### AN-01 · No page transition animations beyond React Navigation defaults
**Severity:** Low  
**Impact:** Screens use the default iOS push/Android fade. Custom transitions (shared element, modal slide) would add polish.

**Suggestion:** Consider shared element transitions for BookCard → BookDetailScreen (the book cover image could animate between screens). React Navigation supports this via `sharedTransitionTag`.

### AN-02 · No skeleton shimmer animation
**Severity:** Low  
**File:** `mobile/src/components/Skeleton.tsx`

The Skeleton component exists and uses Reanimated, but the shimmer effect could be enhanced. Currently uses `ANIMATION.skeleton` constants from the centralised config.

### AN-03 · No success animation on key moments
**Severity:** Low  

These "celebration moments" currently show a plain Alert or toast:
- Book successfully added to shelf
- Exchange request sent
- Exchange completed
- Rating submitted

**Suggestion:** Add a brief success animation (checkmark with scale-in, or confetti for exchange completion) using Reanimated. Even a simple `FadeInUp` + `BounceIn` checkmark icon before the toast would elevate the feel.

---

## 8. i18n Gaps

### Coverage Assessment: ✅ Excellent

Three locales fully translated: `en.json`, `fr.json`, `nl.json`. 500+ keys covering all feature areas. Consistent use of `t()` across screens.

### I18N-01 · One hardcoded English string
**Severity:** Low  
**File:** `mobile/src/features/notifications/hooks/useNotificationPreferences.ts`

```ts
showErrorToast('Failed to update preferences')
```

Should be `showErrorToast(t('notifications.preferencesUpdateError'))`.

### I18N-02 · Some Alert.alert calls may use English strings from hooks
**Severity:** Low  
**Files:** Various hooks that call `Alert.alert()`

Hooks don't always have access to the `t()` function (they're not React components). Some may pass English strings to `Alert.alert()`. Worth a targeted audit of all `Alert.alert()` calls in hooks.

---

## 9. Keyboard Handling

### Coverage Assessment: ✅ Good

| Screen | Has KeyboardAvoidingView? | Notes |
|--------|--------------------------|-------|
| Login/Register | ✅ Via AuthScreenWrapper | `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` |
| ChangePassword | ✅ Direct | — |
| Onboarding | ✅ Direct | — |
| RequestSwap | ✅ Direct | — |
| EditProfile | ✅ Direct | — |
| EditBook | ✅ Direct | — |
| AddBook | ✅ Direct | — |
| ChatScreen | ✅ Direct | + Android keyboard listener |

### KB-01 · Register screen may clip on small devices
**Severity:** Low  
**File:** `mobile/src/features/auth/screens/RegisterScreen.tsx`

RegisterScreen has 6 form fields (first name, last name, username, email, password, confirm password). While `AuthScreenWrapper` provides `KeyboardAvoidingView` + `ScrollView`, the sheer number of fields may cause the submit button to be obscured on shorter devices (iPhone SE, older Android).

**Suggestion:** Test on iPhone SE simulator. May need `keyboardVerticalOffset` adjustment or `scrollToEnd` on field focus.

---

## 10. Improvement Suggestions

Beyond the gaps above, these are suggestions that would elevate the app from "works well" to "delightful":

### S-01 · Add a "Getting Started" checklist card on HomeScreen
Show a dismissible progress card for new users: ☐ Add your first book · ☐ Browse nearby books · ☐ Make your first swap request. Dismiss after all complete or after manual dismiss.

### S-02 · Staggered list item entry animations
Several list screens (MyBooks, Exchanges, Notifications, Wishlist) render items without entry animation. Adding `FadeInUp` with stagger delay (the `ANIMATION.stagger` constants already exist) would make lists feel smoother.

### S-03 · Image zoom on BookDetailScreen
Book cover photos in the detail gallery can't be zoomed/pinched. For a book swap app, users want to inspect book condition closely.

**Suggestion:** Add `react-native-image-zoom-viewer` or a pinch-to-zoom gesture on the photo carousel.

### S-04 · Swipe actions on list items
ExchangeListScreen and NotificationListScreen could benefit from swipe-to-archive or swipe-to-mark-read gestures. WishlistScreen already has swipe-to-remove as a pattern to follow.

### S-05 · Search history / recent searches on BrowseMapScreen
The search bar has no search history or suggestions. Users re-type the same queries.

**Suggestion:** Store recent 5 search terms in MMKV and show as chips below the search bar.

### S-06 · Book condition photos
Users set a condition level (Like New, Good, Fair, Poor) but can't highlight specific damage. A "condition note" text field or the ability to annotate photos would help.

### S-07 · Exchange chat unread indicator on ExchangeListScreen
Each exchange card could show an unread message dot if there are unread messages in that exchange's chat. Currently there's no per-exchange unread indicator.

### S-08 · Smooth radius change on BrowseMapScreen
When the user changes the search radius, the map could animate its zoom level to match. Currently it likely jumps.

### S-09 · Pull-down quick actions on HomeScreen
A pull-down gesture could reveal quick actions (scan book, search, refresh) similar to iOS Spotlight. The existing quick action buttons are good but not as discoverable.

### S-10 · Empty state illustrations
The `EmptyState` component uses Lucide icons (BookOpen, Inbox, Heart, etc.). Custom illustrations (even simple SVGs) for key empty states (no books yet, no exchanges, no messages) would add personality.

---

## 11. Prioritised Action Plan

### P0 — High Impact, Low Effort ✅ DONE (c37e901)

| # | Item | Files | Status |
|---|------|-------|--------|
| 1 | A11Y-01: Add `accessibilityLiveRegion` to Toast | `components/Toast.tsx` | ✅ Done |
| 2 | FG-04: Add unread badge to Messages tab | `navigation/MainTabs.tsx` | ✅ Done |
| 3 | DM-01: Replace hardcoded hex in OnboardingScreen | `features/onboarding/screens/OnboardingScreen.tsx` | ✅ Done |
| 4 | DM-01: Replace hardcoded hex in EmptyState | `components/EmptyState.tsx` | ✅ Done |
| 5 | I18N-01: Fix hardcoded string in notification prefs | `features/notifications/hooks/useNotificationPreferences.ts` | ✅ Done |

### P1 — High Impact, Medium Effort ✅ DONE

| # | Item | Files | Status |
|---|------|-------|--------|
| 6 | PR-07: Add pull-to-refresh to BookDetailScreen | `features/books/screens/BookDetailScreen.tsx` | ✅ Done |
| 7 | PR-08: Add pull-to-refresh to BrowseMap bottom sheet | `features/books/screens/BrowseMapScreen.tsx` | ✅ Done |
| 8 | A11Y-02: Add a11y to OfflineBanner | `components/OfflineBanner.tsx` | ✅ Done |
| 9 | HF-01: Add haptics to tab bar + toggles + scan + toasts | `TabItem.tsx`, `Toast.tsx`, scanner, settings, notif prefs | ✅ Done |
| 10 | FG-01: Add getting started checklist card | `HomeGettingStarted.tsx` + `HomeScreen.tsx` + storage + i18n | ✅ Done |

### P2 — Medium Impact, Variable Effort ✅ DONE

| # | Item | Files | Status |
|---|------|-------|--------|
| 11 | DM-01: Audit all ActivityIndicator colour props | App-wide (17 files) | ✅ Done |
| 12 | LE-01: Add retry button to BookSearchScreen error | `features/books/screens/BookSearchScreen.tsx` | ✅ Done |
| 13 | LE-03: Replace BrandedLoader with skeleton in notifications | `features/notifications/screens/NotificationListScreen.tsx` | ✅ Done |
| 14 | S-02: Add staggered list entry animations | MyBooksScreen, ExchangeListScreen, WishlistScreen | ✅ Done |
| 15 | FG-03: Add unsaved changes warning to EditProfile | `features/profile/screens/EditProfileScreen.tsx` | ✅ Done |
| 16 | AN-03: Add success animations for key moments | AddBookScreen, RequestSwapScreen, DetailRating, DetailActions | ✅ Done |
| 17 | S-03: Add image zoom to BookDetailScreen gallery | `features/books/components/detail/CoverGallery.tsx` | ✅ Done |

### P3 — Nice to Have

| # | Item | Effort |
|---|------|--------|
| 18 | A11Y-03: Add a11y to Skeleton component | 15 min |
| 19 | A11Y-04: Add accessibilityHint to primary CTAs | 2 hr |
| 20 | S-05: Search history on BrowseMapScreen | 2 hr |
| 21 | S-07: Per-exchange unread message dot | 3 hr |
| 22 | S-10: Custom empty state illustrations | Design task |
| 23 | FG-02: Profile tab discoverability (coach mark) | 2 hr |
| 24 | AN-01: Shared element transition for book cards | 4 hr |

---

## What's Already Excellent

Credit where due — these aspects are production-quality:

- **Offline mutation queue** — 7 exchange mutations + chat messages queue with MMKV persistence, 24hr TTL, 3 retries, automatic drain on reconnect
- **WebSocket layer** — Exponential backoff, token refresh on auth failure, AppState-aware reconnect, exhaustion handling with user notification
- **Exchange state machine** — Full lifecycle from pending through completion/return, with contextual actions per status per role
- **Error recovery** — Circuit breaker on 5xx, 429 retry with `retry-after`, token refresh race protection, Sentry integration
- **Theme system** — Complete light/dark token parity, consistent spacing/radius/typography scales
- **Chat** — Real-time WebSocket messages, typing indicators, read receipts, image attachments, meetup suggestions, read-only mode, offline queueing
- **Deep linking** — Full route mapping with UUID param validation, push notification routing, cold-start handling
- **Skeleton loaders** — Used in 7+ list screens for perceived performance
- **Confirmation dialogs** — 20+ destructive actions gated by `Alert.alert()`
