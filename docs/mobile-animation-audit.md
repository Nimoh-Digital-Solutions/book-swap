# Mobile Animation Audit — BookSwap

**Date:** 2026-04-20
**Scope:** `mobile/src/` — all screens, navigation, shared components
**Philosophy:** Subtle & functional (Linear / Stripe style)
**Primary focus:** Screen transitions & navigation animations

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Library Recommendation](#2-library-recommendation)
3. [Navigation & Screen Transitions](#3-navigation--screen-transitions)
4. [Floating Tab Bar](#4-floating-tab-bar)
5. [Modal & Sheet Transitions](#5-modal--sheet-transitions)
6. [Screen-Level Recommendations](#6-screen-level-recommendations)
7. [Shared Component Recommendations](#7-shared-component-recommendations)
8. [Priority Ranking](#8-priority-ranking)
9. [Animation Constants Reference](#9-animation-constants-reference)

---

## 1. Current State Assessment

### What exists today

| Layer | Current Animation | Library |
|-------|-------------------|---------|
| Stack navigation | Native iOS/Android defaults — no customisation | `@react-navigation/native-stack` |
| Tab bar | None — instant tab switch, `Pressable` opacity only | Custom `FloatingTabBar` |
| Bottom sheets | Pan/snap/backdrop fade (library defaults) | `@gorhom/bottom-sheet` (Reanimated under the hood) |
| Modals | `animationType="slide"` on 8 RN `Modal` instances | Built-in `Modal` |
| Skeleton loading | `Animated.loop` opacity pulse (0.3↔0.7, 800ms) | RN `Animated` |
| Offline banner | `Animated.spring` translateY | RN `Animated` |
| Photo reorder | Drag + `ScaleDecorator` | `react-native-draggable-flatlist` |
| Star rating press | Instant `transform: [{ scale: 1.15 }]` on Pressable | Inline style |
| Image loading | `transition={150–200}` on some `expo-image` instances | `expo-image` |
| Typing indicator | Static italic text — no animation | None |
| List items | No enter/exit animations on any `FlatList` | None |
| Auth flow | No screen-level transitions beyond native stack defaults | None |
| Root auth→main switch | Hard swap (conditional rendering in `RootNavigator`) | None |

### What's installed but unused

- **`react-native-reanimated` ~4.1** — installed, Babel plugin enabled, but zero direct imports in `mobile/src/`. Only consumed internally by `@gorhom/bottom-sheet` and `react-native-draggable-flatlist`.
- **`react-native-gesture-handler`** — `GestureHandlerRootView` wraps the app, but no direct `PanGestureHandler` / `GestureDetector` / `Swipeable` usage in screens.
- **`expo-blur`** — in `package.json`, no `BlurView` usage.

### Verdict

The app has a solid structural foundation (Reanimated installed, gesture handler wrapping) but almost no intentional motion design. Transitions rely entirely on platform defaults. This is a high-ROI opportunity — the infrastructure is already in place.

---

## 2. Library Recommendation

**Use React Native Reanimated directly** for all new animations.

Rationale:
- Already installed at v4.1 with Babel plugin configured
- Runs on the UI thread — 60fps guaranteed, no JS bridge bottleneck
- New Architecture enabled (`newArchEnabled: true` in `app.json`) — Reanimated v4 takes full advantage
- `@gorhom/bottom-sheet` already depends on it, so no additional bundle cost
- Provides `Layout` animations for list items and `entering`/`exiting` transitions out of the box
- `useAnimatedStyle`, `withTiming`, `withSpring` are the three primitives needed for 95% of what's recommended below

**Do not add Moti.** It's a nice declarative wrapper, but it adds another abstraction layer without meaningful benefit when you're already using Reanimated directly. Keep the dependency tree lean.

---

## 3. Navigation & Screen Transitions

### 3.1 Root-level auth ↔ main transition

**Current:** Hard conditional swap in `RootNavigator` — `Auth` screen group simply disappears and `Main` appears instantly.

**Recommendation:** Add `animationTypeForReplace` to the root navigator so login→main and logout→main feel intentional:

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Auth → Main (login success) | `fade_from_bottom` | 350ms | `Easing.out(Easing.cubic)` |
| Main → Auth (logout) | `fade` | 250ms | `Easing.in(Easing.cubic)` |

Implementation: Set `animation` on the `Stack.Screen` options in `RootNavigator`:

```tsx
<Stack.Screen
  name="Auth"
  component={AuthStack}
  options={{ animation: 'fade' }}
/>
<Stack.Screen
  name="Main"
  component={MainTabs}
  options={{ animation: 'fade_from_bottom' }}
/>
<Stack.Screen
  name="Onboarding"
  component={OnboardingScreen}
  options={{ animation: 'fade_from_bottom' }}
/>
```

### 3.2 Auth stack internal transitions

**Current:** Default native push/pop (right-to-left slide).

**Recommendation:** Use `slide_from_right` for forward navigation and `slide_from_bottom` for the "forgot password" modal-style screen:

| From → To | Animation | Why |
|-----------|-----------|-----|
| Login → Register | `slide_from_right` (default) | Linear forward navigation |
| Login → ForgotPassword | `slide_from_bottom` | Feels like a modal/aside — different mental model |
| Register → EmailVerifyPending | `fade_from_bottom` | Completion state — new context |
| Deep link → EmailVerifyConfirm | `fade` | Arriving from outside the app |
| Deep link → PasswordResetConfirm | `fade` | Same as above |

Implementation: Per-screen `options` in `AuthStack`.

### 3.3 Tab stack child screen transitions

**Current:** All child screens use `createNativeStackNavigator` defaults (platform-native push/pop). This is actually fine for most cases — the native iOS swipe-back gesture and slide animation are well-understood by users.

**Recommendation:** Keep native defaults for most push/pop transitions but customise specific high-impact routes:

| Route | Animation | Rationale |
|-------|-----------|-----------|
| Any → BookDetail | `slide_from_right` (keep default) | Standard drill-down |
| Any → Chat | `slide_from_bottom` | Chat is a focused, full-screen context — sliding up signals "entering a conversation" |
| BookDetail → RequestSwap | `slide_from_bottom` | Action modal feel — you're committing to an action |
| ExchangeDetail → CounterOffer | `slide_from_bottom` | Same — action commitment |
| ExchangeList → IncomingRequests | `slide_from_right` (keep default) | Standard drill-down |
| MyProfile → Settings | `slide_from_right` (keep default) | Standard drill-down |
| Settings sub-screens | `slide_from_right` (keep default) | Standard drill-down |
| Scanner → ScanResult | `fade_from_bottom` | "Result reveal" — distinct from navigation |
| ScanResult → AddBook | `slide_from_right` (keep default) | Continuation of a flow |

Implementation: Set `options={{ animation: 'slide_from_bottom' }}` on the Chat, RequestSwap, CounterOffer screens in their respective stack files.

### 3.4 Onboarding → Main transition

**Current:** Conditional rendering swap (same as auth→main).

**Recommendation:** `fade_from_bottom` with 400ms duration. The user has just completed setup — the transition into the main app should feel like an arrival, like a door opening.

---

## 4. Floating Tab Bar

### 4.1 Active tab indicator

**Current:** Active tab gets a tinted background (`backgroundColor: brand + '12'`), applied instantly via `isFocused` boolean.

**Recommendation:** Animate the active indicator with a sliding/morphing pill behind the active tab.

| Property | Animation | Config |
|----------|-----------|--------|
| Active pill position | `useAnimatedStyle` + `withSpring` on `translateX` | `damping: 18, stiffness: 180` |
| Active pill width | `withSpring` interpolated to match tab width | Same spring config |
| Active pill opacity | `withTiming` 0→1 on mount | 200ms, `Easing.out(Easing.quad)` |

This is one of the highest-impact changes in the entire app. A smoothly sliding tab indicator immediately communicates spatial awareness — "I moved from here to there."

### 4.2 Tab icon transition

**Current:** Icon colour changes instantly between active/inactive.

**Recommendation:** Add a subtle scale bump on the active icon:

| Property | From → To | Animation |
|----------|-----------|-----------|
| `scale` | 1.0 → 1.08 (active) | `withSpring({ damping: 14, stiffness: 200 })` |
| `opacity` | 0.5 → 1.0 | `withTiming(1.0, { duration: 150 })` |

Keep it subtle — 1.08 max scale, not 1.2. The pill indicator does the heavy lifting.

### 4.3 Tab bar show/hide

**Current:** Tab bar renders/returns `null` based on route — hard appear/disappear.

**Recommendation:** Animate the bar's `translateY` and `opacity` when it enters/exits:

| Property | Show | Hide |
|----------|------|------|
| `translateY` | from +80 to 0 | from 0 to +80 |
| `opacity` | 0 → 1 | 1 → 0 |
| Timing | `withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) })` | `withTiming(80, { duration: 200, easing: Easing.in(Easing.cubic) })` |

This prevents the jarring layout jump when navigating into a child route (e.g. BookDetail) where the tab bar currently vanishes.

---

## 5. Modal & Sheet Transitions

### 5.1 Replace RN `Modal` with Reanimated-powered sheets

**Current:** 8 screens use RN's built-in `Modal` with `animationType="slide"`. This produces a generic platform slide with no customisation of timing, backdrop, or gesture dismissal.

**Recommendation:** Migrate these to either `@gorhom/bottom-sheet` (already in the project) or a custom Reanimated-powered modal wrapper. The app already uses gorhom for `AddWishlistSheet` and `BrowseMapScreen` — standardising on it creates consistency.

**Affected files:**

| Component | Current | Recommended |
|-----------|---------|-------------|
| `AddBookModal` | RN Modal slide | `@gorhom/bottom-sheet` with 70% snap point |
| `DeleteAccountSheet` | RN Modal slide | Bottom sheet, 50% snap — destructive actions should feel contained |
| `GenrePickerSheet` | RN Modal slide | Bottom sheet, 60% snap with scrollable content |
| `ReportSheet` | RN Modal slide | Bottom sheet, 50% snap |
| `ConditionsReviewModal` | RN Modal slide | Bottom sheet, 75% snap — reading content |
| `DeclineReasonSheet` | RN Modal slide | Bottom sheet, 50% snap |
| `MeetupSuggestionPanel` | RN Modal slide | Bottom sheet, 60% snap |
| `SettingsScreen` (radius modal) | RN Modal slide | Bottom sheet, 40% snap — small picker |

**Transition spec for all bottom sheets:**

| Property | Config |
|----------|--------|
| Sheet enter | Spring: `damping: 20, stiffness: 200` |
| Sheet exit | Timing: `200ms, Easing.in(Easing.cubic)` |
| Backdrop | `withTiming` opacity 0→0.5, 250ms |
| Handle indicator | Subtle 40ms pulse-width on mount |

### 5.2 Backdrop blur

`expo-blur` is installed but unused. For premium feel, add a `BlurView` behind the backdrop overlay of sheets — intensity 15–20, `tint` based on theme (light/dark). This is optional and lower priority.

---

## 6. Screen-Level Recommendations

### 6.1 Home Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Location denied banner | Instant appear | `FadeIn.duration(300).delay(100)` — entering layout animation |
| Nearby badge (loading) | Static placeholder rectangles | Use `Skeleton` component (already exists) for consistency |
| Quick action buttons | Static row | Staggered `FadeInUp` on mount: delay 0ms, 50ms, 100ms per item |
| Recently Added section | Cards appear instantly | `FadeInUp.duration(250).delay(index * 80)` for up to 3 cards |
| Community section | Static | `FadeInUp.duration(250)` on the section card |
| Pull-to-refresh return | Data pops in instantly | Animate content opacity 0→1 after refresh completes, 200ms |

### 6.2 Book Detail Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Cover image load | expo-image `transition` (implicit) | Ensure `transition={{ duration: 200 }}` is set explicitly |
| Info section | Instant render after skeleton | `FadeIn.duration(300)` on the info container when data arrives |
| Action buttons (Wishlist/Swap) | Static | `FadeInUp.duration(200).delay(150)` — appear after content |
| Photo strip | Horizontal FlatList, no item animation | `FadeIn` per item as they mount |

### 6.3 Exchange List Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Tab indicator | Instant background colour | Animated underline or pill that slides between tabs (same pattern as FloatingTabBar §4.1) |
| Tab switch content | Instant swap | `FadeIn.duration(150)` on the list when tab changes |
| Exchange cards | No enter animation | `FadeInUp.duration(200).delay(index * 60)` — cap at 8 items for perf |
| Incoming requests badge | Static count | Subtle `withSequence(withTiming(1.15), withTiming(1.0))` scale pulse when count changes |

### 6.4 Chat Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| New message (received) | Appended to FlatList instantly | `SlideInLeft.duration(200).springify()` |
| New message (sent) | Appended instantly | `SlideInRight.duration(200).springify()` |
| Typing indicator | Static italic text | Animated three-dot bounce (classic pattern): three `Animated.View` circles with staggered `withRepeat(withSequence(withTiming(-4), withTiming(0)))` |
| Message input focus | Static | Smooth keyboard-avoiding transition (verify `KeyboardAvoidingView` behavior is set correctly) |
| Read-only banner | Static render | `FadeIn.duration(200)` |

### 6.5 Scanner Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Camera viewfinder | Static | Animated scan line: a thin horizontal line that moves up/down slowly using `withRepeat(withTiming(...))` on `translateY`. Purely decorative but gives "scanning" feedback. |
| Barcode detected | Navigation fires immediately | Brief 200ms scale pulse on the viewfinder frame before navigating — confirms "got it" |

### 6.6 Scan Result Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Book found card | Appears instantly after loading | `FadeInDown.duration(300)` — slides down from where the scanner was |
| "Not found" state | Static | `FadeIn.duration(250)` |

### 6.7 My Books Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Book cards | No list animation | `FadeInUp.duration(200).delay(index * 60)` — first load only (use `entering` prop on Reanimated wrapper) |
| Add book FAB/modal | RN Modal slide | Migrate to bottom sheet (§5.1) |
| Filter/search | Instant results | `Layout.duration(200)` on list container — smooth relayout when items filter in/out |

### 6.8 Wishlist Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Grid/list items | No animation | `FadeIn.duration(200).delay(index * 50)` on first render |
| Item removal | Instant disappear | `FadeOut.duration(150)` + `Layout.springify()` on remaining items — smooth close-up |
| Add wishlist sheet | Already gorhom (good) | No change needed |

### 6.9 Notification List Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Notification items | No list animation | `FadeInRight.duration(200).delay(index * 40)` — first page only |
| Mark as read | No visual feedback | Brief opacity pulse (0.5→1.0, 200ms) on the tapped item |
| New notification arrival | Item appears at top | `FadeInDown.duration(250)` for items pushed via WS |

### 6.10 Auth Screens (Login / Register)

| Element | Current | Recommendation |
|---------|---------|----------------|
| Logo | Static | `FadeIn.duration(400)` on mount |
| Form fields | Static | Staggered `FadeInUp.duration(250).delay(index * 60)` per field |
| Social auth buttons | Static | `FadeInUp.duration(200).delay(300)` — appear after form |
| Error messages | Instant appear | `FadeIn.duration(200)` + slight `translateY` nudge |
| Submit button loading | `ActivityIndicator` swap | Cross-fade between label and spinner using `FadeIn`/`FadeOut` |

### 6.11 Profile Screen (MyProfile)

| Element | Current | Recommendation |
|---------|---------|----------------|
| Avatar | Static | `FadeIn.duration(300)` on mount |
| Stats row | Static | `FadeInUp.duration(200).delay(100)` |
| Menu rows | Static | Staggered `FadeInUp` (same pattern as auth fields) |

### 6.12 Onboarding Screen

| Element | Current | Recommendation |
|---------|---------|----------------|
| Step content | Static | `FadeIn.duration(300)` when each step mounts |
| GPS permission prompt | Static | `FadeInUp.duration(300)` |
| Continue/Skip buttons | Static | `FadeIn.duration(200).delay(200)` |

---

## 7. Shared Component Recommendations

### 7.1 Skeleton (`Skeleton.tsx`)

**Current:** RN `Animated.loop` with opacity timing (0.3↔0.7, 800ms).

**Recommendation:** Migrate to Reanimated for consistency and UI-thread performance. Functionally equivalent but uses `withRepeat(withSequence(withTiming(...)))`:

| Property | Config |
|----------|--------|
| Opacity range | 0.3 ↔ 0.65 (slightly tighter — avoids looking "flashy") |
| Half-cycle duration | 750ms (slightly faster feels more alive) |
| Easing | `Easing.inOut(Easing.ease)` |

### 7.2 Offline Banner (`OfflineBanner.tsx`)

**Current:** RN `Animated.spring` on `translateY`. Works well.

**Recommendation:** Migrate to Reanimated `withSpring` for consistency with the rest of the app. Same visual result, but keeps all animation code on the same runtime. No urgency.

### 7.3 Empty State (`EmptyState.tsx`)

**Current:** Static icon + text + CTA.

**Recommendation:** `FadeIn.duration(300)` as an entering animation. Empty states should gently appear, not flash in. This signals "nothing here yet" rather than "something broke."

### 7.4 Toast (`Toast.tsx`)

**Current:** `react-native-toast-message` defaults.

**Recommendation:** Configure the toast library's `topOffset` and animation duration. If the library supports custom animations, use a 200ms `withSpring` slide-down. Low priority — toast animations are rarely a pain point.

### 7.5 Notification Bell Badge

**Current:** Static red dot.

**Recommendation:** When `unread` transitions from 0→n, pulse the badge with `withSequence(withSpring(1.3), withSpring(1.0))` scale animation. Draws attention without being obnoxious.

### 7.6 BookCard

**Current:** `Pressable` opacity (0.85 on press). No motion.

**Recommendation:** Replace opacity-only feedback with a slight scale-down:

| State | Property | Value |
|-------|----------|-------|
| Pressed | `scale` | 0.97 |
| Released | `scale` | 1.0 (spring back) |
| Transition | Config | `withSpring({ damping: 15, stiffness: 200 })` |

This provides tactile feedback that feels more intentional than opacity alone.

### 7.7 TypingIndicator

**Current:** Static italic text "X is typing...".

**Recommendation:** Add the classic three-dot bounce animation next to (or replacing) the text:

| Dot | Size | Animation |
|-----|------|-----------|
| 1 | 4px circle | `withRepeat(withSequence(withTiming(-3, 300), withTiming(0, 300)), -1)` delay 0ms |
| 2 | 4px circle | Same, delay 150ms |
| 3 | 4px circle | Same, delay 300ms |

This is a universally understood "someone is typing" signal that adds life to the chat.

### 7.8 StarInput (Ratings)

**Current:** Instant `scale: 1.15` on Pressable press.

**Recommendation:** Use `withSpring` for the scale change so it bounces slightly and settles:

```
withSpring(1.15, { damping: 10, stiffness: 300 })
```

On release, spring back to 1.0 with the same config. Small change, noticeable improvement.

---

## 8. Priority Ranking

Ranked by **impact-to-effort ratio** — highest impact, lowest effort first.

### Tier 1 — High Impact, Low Effort (do first)

| # | Item | Section | Est. Effort |
|---|------|---------|-------------|
| 1 | **Root navigator auth↔main transition** | §3.1 | 15 min |
| 2 | **Chat screen `slide_from_bottom`** | §3.3 | 5 min |
| 3 | **RequestSwap / CounterOffer `slide_from_bottom`** | §3.3 | 5 min |
| 4 | **Scanner → ScanResult `fade_from_bottom`** | §3.3 | 5 min |
| 5 | **ForgotPassword `slide_from_bottom`** | §3.2 | 5 min |
| 6 | **Auth screen form stagger animations** | §6.10 | 30 min |
| 7 | **TypingIndicator three-dot bounce** | §7.7 | 20 min |
| 8 | **BookCard press scale feedback** | §7.6 | 15 min |

### Tier 2 — High Impact, Medium Effort (do second)

| # | Item | Section | Est. Effort |
|---|------|---------|-------------|
| 9 | **FloatingTabBar sliding indicator** | §4.1 | 1–2 hours |
| 10 | **FloatingTabBar show/hide animation** | §4.3 | 45 min |
| 11 | **Tab icon active scale** | §4.2 | 20 min |
| 12 | **Exchange list tab indicator animation** | §6.3 | 45 min |
| 13 | **Home screen section stagger** | §6.1 | 45 min |
| 14 | **Empty state fade-in** | §7.3 | 15 min |
| 15 | **Notification bell badge pulse** | §7.5 | 20 min |

### Tier 3 — Medium Impact, Medium Effort (do third)

| # | Item | Section | Est. Effort |
|---|------|---------|-------------|
| 16 | **Chat message enter animations** | §6.4 | 1 hour |
| 17 | **FlatList item stagger (Exchange/Book lists)** | §6.3, §6.7 | 1–2 hours |
| 18 | **Migrate RN Modals to gorhom bottom sheets** | §5.1 | 2–3 hours (8 files) |
| 19 | **Book detail fade-in on data load** | §6.2 | 30 min |
| 20 | **Wishlist item removal animation** | §6.8 | 30 min |
| 21 | **Notification list enter/read animations** | §6.9 | 45 min |
| 22 | **Scanner viewfinder scan line** | §6.5 | 30 min |

### Tier 4 — Polish (do last)

| # | Item | Section | Est. Effort |
|---|------|---------|-------------|
| 23 | **Migrate Skeleton to Reanimated** | §7.1 | 20 min |
| 24 | **Migrate OfflineBanner to Reanimated** | §7.2 | 15 min |
| 25 | **StarInput spring scale** | §7.8 | 10 min |
| 26 | **Profile screen section stagger** | §6.11 | 30 min |
| 27 | **Onboarding step transitions** | §6.12 | 30 min |
| 28 | **Backdrop blur on sheets** | §5.2 | 30 min |
| 29 | **Toast animation customisation** | §7.4 | 15 min |
| 30 | **Pull-to-refresh content fade** | §6.1 | 20 min |

**Total estimated effort:** ~15–18 hours for all 30 items. Tier 1 alone takes ~1.5 hours and covers the most noticeable improvements.

---

## 9. Animation Constants Reference

Create a `mobile/src/constants/animation.ts` file to centralise all animation parameters. This ensures consistency across the app and makes tuning easy.

```ts
import { Easing } from 'react-native-reanimated';

export const ANIMATION = {
  spring: {
    default: { damping: 18, stiffness: 180 },
    snappy: { damping: 14, stiffness: 200 },
    gentle: { damping: 22, stiffness: 150 },
    bounce: { damping: 10, stiffness: 300 },
  },

  timing: {
    fast: { duration: 150, easing: Easing.out(Easing.quad) },
    normal: { duration: 250, easing: Easing.out(Easing.cubic) },
    slow: { duration: 400, easing: Easing.out(Easing.cubic) },
    exit: { duration: 200, easing: Easing.in(Easing.cubic) },
  },

  stagger: {
    fast: 40,   // ms between items (notifications, small lists)
    normal: 60, // ms between items (cards, form fields)
    slow: 80,   // ms between items (large cards, sections)
  },

  scale: {
    pressed: 0.97,
    active: 1.08,
    badge: 1.3,
  },

  skeleton: {
    opacityRange: [0.3, 0.65] as const,
    halfCycleDuration: 750,
  },
} as const;
```

Use these constants everywhere. When something "doesn't feel right," you tune one number in one file.

---

## Principles Applied Throughout

1. **Motion communicates spatial relationships.** Slide-from-right = deeper in hierarchy. Slide-from-bottom = new context/action. Fade = state change.
2. **Springs for interactive elements, timing for non-interactive.** Tabs, buttons, and draggable things should spring. Fading in content should use timing curves.
3. **Stagger, don't animate everything at once.** When multiple items appear (list items, form fields), stagger them by 40–80ms. This creates a cascade that's more digestible than a simultaneous flash.
4. **Respect `useReducedMotion`.** Reanimated v4 has built-in support for `useReducedMotion()`. Wrap all entering/exiting animations with a check — if reduced motion is preferred, fall back to instant transitions. The Jest mock already stubs this (`jest.setup.ts` line 97).
5. **Cap list stagger at visible items.** Never stagger more than 8–10 items. Beyond that, the animation becomes annoying. For `FlatList` items, only animate the first render batch.
6. **Exit animations should be faster than enter animations.** Users don't want to wait for things to leave. Enter: 200–400ms. Exit: 150–200ms.

---

*End of audit. Implement Tier 1 first for maximum impact in ~1.5 hours of work.*
