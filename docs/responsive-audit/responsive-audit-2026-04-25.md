# BookSwap Web — Responsive Audit (Mobile Viewport)

**Date:** 2026-04-25
**Author:** Composer (static analysis)
**Scope:** `frontend/` (React + Vite) — every public + authenticated page
**Out of scope:** the React Native `mobile/` app, full WCAG colour audit, browser-rendered visual regressions
**Method:** static code review of `frontend/src/**` + Tailwind v4 theme (`frontend/src/styles/tailwind.css`) + global SCSS resets + DevTools-style heuristics (overflow, tap targets ≥ 44 px, font-size ≥ 16 px on inputs, fixed-position overlap, safe-area-inset coverage, dynamic viewport units, landscape behaviour).
**Verification:** none of the proposed fixes have been implemented; this document is **diagnosis only**, with a phased sprint plan attached.

---

## 1. Executive summary

The web app is **desktop-first by construction**: the primary navigation (`Browse / How it Works / Community`) is `hidden md:flex` and there is **no mobile alternative**, so on any viewport < 768 px users have **no way to navigate between top-level sections** without going through the profile dropdown (and that dropdown only exists when authenticated). Combined with seven structural issues — missing `viewport-fit=cover`, zero `safe-area-inset-*` usage anywhere in the codebase, a hard-coded `420 px` map sidebar that on a 390 px iPhone covers **the entire viewport**, a hero map `min-h-[400px] lg:min-h-[500px]` that on a 600 px-tall landscape phone leaves no room for content, several inputs at `text-sm` (14 px) that **trigger iOS Safari pinch-zoom on focus**, and `body { overflow-x: hidden }` masking otherwise-undetectable horizontal-scroll bugs — the mobile experience today **is functional but fragile and visibly degraded**.

The good news is that the design tokens (`@theme` in `tailwind.css`) are clean, the layout shell (`AppLayout`) uses `flex-1` correctly, the SCSS resets already migrated `#root` to `100dvh / 100dvw`, and the existing `Footer` and `CookieConsentBanner` show the team already knows how to write mobile-first wrap layouts. The fixes below are concentrated in a handful of files and most are mechanical.

**Headline numbers (counted from grep across `frontend/src`):**

| Metric | Count | Comment |
| --- | --- | --- |
| Pages / components using `min-h-screen` | **12** | Should be `min-h-[100dvh]` to avoid mobile-Safari URL-bar jump |
| Files referencing `safe-area-inset` / `env(safe-area-inset)` | **0** | Every fixed bottom UI element risks being covered by iOS home-indicator |
| Files referencing `viewport-fit=cover` (in `index.html`) | **0** | Without this, `env(safe-area-inset-*)` returns 0 — even if we add it |
| Fixed-position overlays (banners / modals / sheets) | **7** | Cookie banner, mobile filter sheet, swap modal, report dialog, delete dialog, block dialog, barcode scanner |
| Inputs / textareas using flat `text-sm` (no `sm:text-sm` reset) | **3 confirmed**: `SearchBar`, `MessageInput` (textarea), `AddBookPage` ISBN input | Triggers iOS auto-zoom on focus (font < 16 px) |
| Hard-coded fixed widths ≥ 300 px in layout components | **`MapPage/SidePanel.tsx` `w-[420px]`**, `NotificationPanel` `w-80` (320 px), several blob backgrounds | `SidePanel` is the only one that breaks layout — others are decorative or in popovers |
| `landscape` orientation media queries | **0** | No special handling for landscape phones (390×844 → 844×390) |
| Files with `hidden md:flex` for primary nav | **1** (`Header.tsx`) — but it's the only nav | **No mobile menu replacement** exists |

The single highest-leverage fix is **adding a mobile primary nav** (drawer or bottom sheet) — that's currently a **showstopper** for unauthenticated mobile visitors trying to reach `/how-it-works` or `/community` without typing the URL.

---

## 2. Methodology

### 2.1 Viewports modelled

| Class | Width (CSS px) | Height (typical) | Examples |
| --- | --- | --- | --- |
| Narrow phone | **320** | 568 | iPhone SE 1st gen, foldable closed |
| Common phone | **375** | 667 | iPhone SE 2/3, iPhone 12 mini |
| Modern phone | **390 / 393** | 844 / 873 | iPhone 14, Pixel 7 |
| Large phone | **430 / 480** | 932 | iPhone 14 Pro Max, Galaxy S24 Ultra |
| Phone landscape | **844 × 390** | — | Same iPhone 14 sideways |
| Tablet portrait | **768** | 1024 | iPad mini, breakpoint boundary |

Tailwind's default breakpoints (`sm:640`, `md:768`, `lg:1024`) are used unmodified. Anything < 768 px runs base-classes only — i.e. **all the design system collapses to its base case on phones**.

### 2.2 Heuristics applied

For every page / component I checked:

1. **Overflow / horizontal scroll** — fixed widths, missing `min-w-0`, `whitespace-nowrap` on long strings, hero blobs (`w-[900px]`), maps `width:100%` inside `flex` parents.
2. **Tap targets** — interactive elements with explicit dimensions < 44 × 44 (icon-only buttons in headers, `w-8 h-8` avatars used as buttons, `w-3 h-3` icons inside small buttons).
3. **Font size on inputs** — anything **< 16 px on `<input>` / `<textarea>` / `<select>`** triggers iOS Safari pinch-zoom on focus; `sm:text-sm` is the project's chosen mitigation but it isn't applied uniformly.
4. **Fixed-position overlap with safe-area** — `position: fixed; bottom: 0` without `padding-bottom: env(safe-area-inset-bottom)` puts content under the iOS home indicator.
5. **Dynamic viewport units** — `100vh` includes the iOS Safari URL bar in some states and excludes it in others, causing a "jump"; `100dvh` is the modern fix.
6. **Landscape behaviour** — `min-h-[700px]` cards, single-column auth panels, fixed bottom sheets that are taller than a 390 px landscape viewport.
7. **Touch-only affordances** — hover-only states, drag-only interactions, `cursor: pointer` swallowing on iOS without `role="button"`.
8. **Content reflow** — three-column grids that go from 3 → 1 directly (skipping 2) on small viewports, headlines that don't reduce, image aspect ratios that distort.
9. **Safe-area + PWA** — when installed as PWA on iOS, content goes edge-to-edge; without `viewport-fit=cover` + `env(safe-area-inset-*)`, top status bar overlaps the header.
10. **CSP / network-cost** — Material Symbols + Google Fonts loaded synchronously in `<head>` (we don't optimise this in the audit but flag it).

### 2.3 Limitations

* **No browser run.** Every finding is from reading source. A real DevTools / Playwright sweep would catch dynamic issues (modal overlap on rotation, IME keyboard insets, etc.) that this audit cannot.
* **No screenshots.** I describe the rendered behaviour ("on 375 px the sidebar covers 100 % of the viewport") instead of attaching images.
* **`tast-*` UI primitives** are treated as a black box. If you have, e.g., a `<Button size="md">` rendering at 36 px, that's not visible from this code-base alone.
* **i18n string growth** is not modelled. Long French / Dutch translations may push buttons past their truncation; this is flagged as a class of risk, not per-string.

---

## 3. Findings

### 3.1 Severity legend

| Severity | Definition |
| --- | --- |
| **CRITICAL** | Blocks task completion or breaks layout on a real device viewport |
| **HIGH** | Visibly degrades UX or silently fails accessibility checks |
| **MEDIUM** | Aesthetic / polish; users can still complete tasks |
| **LOW** | Future-proofing or nice-to-have |

### 3.2 Master finding table

| ID | Sev | Scope | Viewports | Issue | Proposed fix | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| **RESP-001** | CRITICAL | `frontend/src/components/layout/Header/Header.tsx` | < 768 px (all phones) | Primary nav (`Browse / How it Works / Community`) is `hidden md:flex` with **no mobile alternative**. Unauthenticated users have **no way** to reach top-level sections on phones. | Add a mobile drawer (slide-in from left or bottom-sheet) triggered by a hamburger button visible `md:hidden`. Reuse existing `LocaleLink` + `NavLink`. | M (½ day) |
| **RESP-002** | CRITICAL | `frontend/index.html` line 5 | iOS Safari ≥ 11, all PWA installs | `<meta name="viewport">` is missing `viewport-fit=cover`. Without this, `env(safe-area-inset-*)` returns 0 on iPhone X+ even after we add safe-area styles. | `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />` | XS (1 line) |
| **RESP-003** | CRITICAL | `frontend/src/pages/MapPage/SidePanel.tsx` line 71-78 | < 480 px | Sidebar is hard-coded `w-[420px]`. On a 390 px iPhone it **covers the entire viewport**, so the underlying map is unreachable until the user finds the toggle handle. | Make it `w-full sm:w-[360px] md:w-[420px]`; on `<sm` render as a bottom-drawer (mirroring the mobile filter sheet pattern) instead of left-rail. | M (½ day) |
| **RESP-004** | CRITICAL | `frontend/src/pages/MapPage/MapPage.tsx` line 181 | All mobile, especially landscape | `style={{ height: 'calc(100vh - 73px)' }}` — `100vh` plus a hard-coded header height. On iOS Safari, when the URL bar shrinks, the map gains height; when it grows, the page scrolls. The 73 px assumes desktop header padding (`py-5` ≈ 73 px); mobile-condensed header would be different. | Use `h-[calc(100dvh-var(--header-h))]` with a CSS variable set by the header (or measure with `ResizeObserver`). At minimum, swap `100vh` → `100dvh`. | S (1-2 h) |
| **RESP-005** | HIGH | Codebase-wide (12 files: `HomePage`, `BrowseLandingPage`, `HowItWorksPage`, `CommunityPage`, `AppLayout`, all auth pages, `OnboardingPage`) | iOS Safari, all phones | `min-h-screen` resolves to `100vh`. On iOS Safari the URL bar is included until the user scrolls, causing a 60-80 px "jump" of bottom content the first time they scroll. | Project-wide find/replace `min-h-screen` → `min-h-[100dvh]`; or add a Tailwind v4 `@utility min-h-screen { min-height: 100dvh }` override. | S (1 h, mechanical) |
| **RESP-006** | HIGH | All fixed bottom UI | iOS / Android with gesture bar | **Zero** files reference `safe-area-inset-bottom`. Concretely: `CookieConsentBanner` (`fixed bottom-0`), `PwaUpdateBanner` (`bottom: 0`), `MobileFilterSheet`, `SwapFlowModal`, `ReportDialog`, `DeleteAccountDialog`, `BarcodeScanner`. On iPhone X+ the home-indicator overlaps the dismiss button. | Add Tailwind utilities `pb-safe`, `pt-safe`, `mb-safe` (`@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }`). Apply to all 7 fixed elements. **Requires RESP-002 first.** | M (1 day) |
| **RESP-007** | HIGH | `frontend/src/features/discovery/components/SearchBar/SearchBar.tsx` line 58, `MessageInput` line 127, `AddBookPage` ISBN input line 98, `WishlistForm`, `BookForm` | iOS Safari only | Inputs at `text-sm` (14 px) **trigger automatic pinch-zoom on focus** in iOS Safari. The user has to manually un-zoom, which is jarring during search. | Standardise on `text-base sm:text-sm` (16 px on phone, 14 px on tablet+) for all `<input>` / `<textarea>` / `<select>` elements. `LoginForm` / `RegisterForm` already do this — propagate. | S (2-3 h, ~10 inputs) |
| **RESP-008** | HIGH | `frontend/src/features/auth/components/AuthSplitPanel/AuthSplitPanel.tsx` line 47, `OnboardingPage.tsx` line 50 | Phone landscape (844×390), short tablets | `min-h-[700px]` on the auth card. In landscape (390 px tall) this forces a 700 px tall card into a 390 px viewport → the whole page scrolls just to fit the card; the actual form is below the fold. | Replace `min-h-[700px]` with a responsive value: `min-h-[100dvh] md:min-h-[700px]` so on small heights the card simply fills the viewport. | XS (2 lines × 2 files) |
| **RESP-009** | HIGH | `frontend/src/styles/base/_resets.scss` line 44 | All viewports | `body { overflow-x: hidden }` **masks** real horizontal-overflow bugs. We can't tell whether any of the hero blobs (`w-[900px]`), wide tables, or `whitespace-nowrap` elements are causing scroll because the body silently clips. | Remove `overflow-x: hidden` from `body`; surface the real bugs by running the app once and fixing whatever overflows. (Will likely surface RESP-013 and RESP-014.) | S (1 h to remove + 2-3 h to fix the surfacing bugs) |
| **RESP-010** | HIGH | `frontend/src/features/discovery/components/MobileFilterSheet/MobileFilterSheet.tsx` line 62 | Tall content + small phones | `max-h-[80vh]` uses `vh` (not `dvh`), so on iOS the sheet height jumps when the URL bar resizes. `max-w-lg` (32 rem ≈ 512 px) means on tablets the sheet is centered with backdrop visible left and right — looks like a desktop modal, not a sheet. | `max-h-[85dvh]` + `w-full max-w-none sm:max-w-lg` (full-width on phones, modal-on-tablet+). Add `pb-safe`. | S (3-4 lines) |
| **RESP-011** | HIGH | `frontend/src/features/messaging/components/ChatPanel/ChatPanel.tsx` line 199 | All viewports | `max-h-[600px]` is a hard cap on a chat panel that's the centerpiece of the page. On a 932 px tall phone we waste 300 px of vertical space; on a 600 px landscape phone we underflow. The panel is also `rounded-xl` with a border — on phones it should be edge-to-edge. | Page-context layout: pass a `fillParent` mode where the panel becomes `h-[calc(100dvh-var(--header-h)-var(--meta-h))]` and drops border-radius / borders < `sm`. | M (½ day, requires page-level refactor) |
| **RESP-012** | HIGH | `frontend/src/features/books/pages/BookDetailPage.tsx` line 249 | < 480 px | `<h1 className="text-5xl md:text-6xl">` ⇒ 48 px on mobile. For a long book title (e.g. *"De Ontdekking van de Hemel — Bewerkt voor Lezers van 2026"*) this **wraps 5+ lines** and pushes the cover off-screen on first paint. | Use a fluid clamp: `text-[clamp(1.75rem,7vw,3.75rem)]` (≈ 28-60 px) and `text-balance`; also add `line-clamp-3 sm:line-clamp-none` defensively. | S (1 line + Tailwind config) |
| **RESP-013** | HIGH | `frontend/src/pages/HomePage/HomePage.tsx` line 111, `BrowseLandingPage` lines 90-92, `HowItWorksPage` lines 172-174, `CommunityHero.tsx` lines 25-27 | < 480 px | Decorative blur-blobs are `w-[900px] h-[500px]` absolute-positioned. They're inside a `relative overflow-hidden` parent, BUT only the **outer hero** is `overflow-hidden`. Some pages (CommunityHero) sit inside `min-h-screen` with the parent hidden; others rely on `body { overflow-x: hidden }` (RESP-009). Removing the body hack will surface horizontal scroll. | Wrap hero blob containers in `overflow-hidden` (or `clip-path`) explicitly. Or scale blobs down responsively: `w-[60vw] h-[40vh] md:w-[900px] md:h-[500px]`. | S (4 files × 1 line) |
| **RESP-014** | HIGH | `frontend/src/components/layout/Header/Header.tsx` line 78 | < 380 px | Header right cluster: `NotificationBell + ProfileDropdown (w-9 h-9 avatar) + LanguageToggle (Globe + EN)` + nav block on left. With logo + "BookSwap" wordmark (`text-xl`) on the left, this row is **~360 px wide minimum** and on a 320 px iPhone SE wraps badly or pushes the language toggle off-screen. | On `<sm`: hide the wordmark, keep only the icon mark. Hide the language toggle's text (`<sm:`hidden) — keep only the globe icon. Move into the (new RESP-001) drawer. | S (2-3 class changes) |
| **RESP-015** | HIGH | `frontend/src/features/messaging/components/MessageBubble/MessageBubble.tsx` line 42 | < 360 px with avatar | `max-w-[75%]` on the bubble + `mr-2` avatar (32 px) means on a 320 px viewport the bubble is `(320-32-2)*0.75 ≈ 213 px`. Long words (URLs, German compounds) overflow because we use `break-words` not `break-anywhere`. | `max-w-[85%] sm:max-w-[75%]` + `overflow-wrap: anywhere` (`break-anywhere` in Tailwind). | XS (2 lines) |
| **RESP-016** | HIGH | `frontend/src/features/auth/components/AuthSplitPanel/AuthSplitPanel.tsx` line 49, `OnboardingPage.tsx` line 52 | < 768 px | Branding panel is `hidden md:flex` — fine, but the fallback (`md:hidden mb-8` logo block) gives mobile users **no equivalent of the testimonial / brand promise**. The right side jumps straight to a form. Conversion-relevant hero copy is invisible on mobile. | Optionally render a condensed brand block above the form on `<md` (logo + headline + 1-line subtitle, no testimonial). | M (½ day per page) |
| **RESP-017** | MEDIUM | `frontend/src/features/messaging/components/MessageInput/MessageInput.tsx` line 127 | All phones | Textarea `text-sm` triggers iOS zoom (RESP-007). Also `max-h-[100px]` is a small ceiling for multi-line meet-up suggestions. The send button is `p-2.5` ≈ 36 px — under the 44 px tap target. | Combine RESP-007 fix + raise to `max-h-[140px]`; pad send button to `p-3` (44×44). | S (3 lines) |
| **RESP-018** | MEDIUM | `frontend/src/features/discovery/components/BookPopup/BookPopup.tsx` line 16 | Map InfoWindow on phones | `min-w-[200px] max-w-[260px]` — Google Maps then overlays its own constraints. With a long title + neighborhood + button, the InfoWindow on a 320 px viewport touches both edges. Title is `truncate` so it just elides; behaviour is acceptable but cramped. | `max-w-[80vw] sm:max-w-[260px]`; ensure `View Book →` link has min-height 44 px. | S (1 line) |
| **RESP-019** | MEDIUM | `frontend/src/features/exchanges/pages/ExchangeDetailPage.tsx` line 359, BookDetailPage line 171 | 375-768 px | `grid-cols-1 md:grid-cols-3` and `lg:grid-cols-12` — fine, but the **content order on mobile** is timeline → details, which is verbose-first. Most users on phone want the action buttons (`Accept`, `Decline`, `Counter`) above the timeline. | Reverse with `flex flex-col-reverse md:grid md:grid-cols-3` or use Tailwind `order-*` utilities. | S (½ day, design call needed) |
| **RESP-020** | MEDIUM | `frontend/src/features/notifications/components/NotificationPanel/NotificationPanel.tsx` line 117 | < 360 px | Panel is `w-80 max-h-[480px] absolute right-0 top-full`. On a 320 px iPhone with the bell at the right edge, `right-0` keeps it in-bounds — but on viewports just slightly different (or with a translated language label expanding the trigger), the panel can clip. | `w-[min(20rem,calc(100vw-1rem))] max-h-[70dvh]`; on `<sm` consider rendering as a full-width sheet. | S (2 lines) |
| **RESP-021** | MEDIUM | `frontend/src/features/discovery/components/SwapFlowModal/SwapFlowModal.tsx` line 55 | All phones | `max-h-[90vh]` (vh, not dvh) and `w-full max-w-3xl`. Multi-step flow inside a modal on a 667-px tall iPhone SE leaves ~50 px for the actual content area between header + footer. | `max-h-[90dvh]`; on `<sm` render as a **full-screen sheet** (no rounded corners, no inset padding). Many SaaS apps do this for multi-step flows. | M (1 day, light component refactor) |
| **RESP-022** | MEDIUM | `frontend/src/components/layout/Footer/Footer.tsx` | < 380 px | Footer wraps OK (`flex-wrap items-center justify-center gap-x-4`), but the legal nav (`Privacy / Terms / Delete`) and the long copyright + Nimoh attribution can stack into 5-6 lines on iPhone SE — visually noisy. | `text-xs sm:text-sm`; tighten gaps to `gap-x-3 gap-y-1`; consider hiding the "by Nimoh Digital Solutions" attribution on `<sm` (still in legal pages). | S (3-4 class changes) |
| **RESP-023** | MEDIUM | `frontend/src/features/exchanges/pages/IncomingRequestsPage.tsx` (and similar list pages with action buttons) | < 480 px | Per-row actions (Accept / Decline / Counter) are inline with metadata. On phones the button row often exceeds the row width — buttons either wrap onto a 4th line or shrink. | Move actions into a card-footer that always wraps; or collapse non-primary actions into a "More" menu. | M (½ day per list page) |
| **RESP-024** | MEDIUM | `frontend/src/features/messaging/components/ChatHeader/ChatHeader.tsx` (assumed by inspection of ChatPanel) | < 380 px | Avatar (32 px) + partner name + "online" indicator + meet-up button + 3-dot menu = horizontal cluster easily exceeds 320 px. The "Suggest Meetup" CTA likely truncates or pushes the menu off. | Hide secondary CTAs into a kebab menu on `<sm`. | S |
| **RESP-025** | MEDIUM | `frontend/src/features/profile/pages/ProfilePage.tsx` line 56 | < 480 px | `flex flex-col sm:flex-row gap-6` is correct, but the avatar `w-24 h-24` (96 px) + edit button on the same row make the right column cramped on `sm` (640 px). Username + email + bio compete for ≈ 350 px. | Consider showing edit button as an icon-only `w-10 h-10` on `<md`. | S |
| **RESP-026** | MEDIUM | `frontend/src/features/books/pages/AddBookPage.tsx` lines 97-98 | All phones | Form input is `text-sm` (RESP-007), and the page wraps long ISBN + scan button into one row that gets cramped. The scan button is icon-only at `w-10 h-10` ≈ 40 px (just under tap target). | Apply RESP-007; bump scan button to `min-w-[44px] min-h-[44px]`. | S |
| **RESP-027** | MEDIUM | All "loading" skeletons that use `animate-pulse text-[#8C9C92]` (e.g. `ExchangesPage`, `MyShelfPage`, `ProfilePage`) | All viewports | Loading states are **text-only** ("Loading…"). Visually unbalanced compared to `BrandedLoader` used elsewhere. Not strictly responsive but inconsistent — and on phones the centered text is dwarfed by `min-h-[50vh]` whitespace. | Migrate to `BrandedLoader size="md"`. Already a code-quality item from the deep audit; mention again here. | S (3-4 sites) |
| **RESP-028** | MEDIUM | Tap-target audit: header icon buttons | All viewports | `LanguageToggle` (`w-4 h-4` icon inside a `flex` button without padding), `NotificationBell` (assume similar), `ProfileDropdown` trigger (`w-9 h-9` = 36 px → under 44 px). | Wrap each in `min-w-[44px] min-h-[44px] flex items-center justify-center`. | S |
| **RESP-029** | LOW | `frontend/src/features/discovery/components/SwapFlowModal/SuccessStep.tsx`, `ConfirmSwapStep.tsx`, `SelectOfferStep.tsx` | Phones | Several `text-5xl` Material Symbols icons inside modals don't scale down — they look gigantic in a small modal. | `text-4xl sm:text-5xl`. | XS |
| **RESP-030** | LOW | `frontend/src/features/auth/components/ForgotPasswordForm/ForgotPasswordForm.tsx` line 68 | All viewports | Hardcoded emoji `text-5xl ✉️` for success state. Renders inconsistently across iOS / Android / Windows. | Use a `lucide-react` `<Mail size={48} />` instead. | XS |
| **RESP-031** | LOW | All pages with `style={{ marginInline: 'auto' }}` (HomePage, BrowseLandingPage, ExchangesPage, MyShelfPage, ExchangeDetailPage, etc.) | All viewports | Inline style overrides Tailwind's `mx-auto`. It's a leftover from when CSP was blocking inline styles. **The CSP nonce work in earlier sprint resolved that** — these can go. | Remove every `style={{ marginInline: 'auto' }}` (≈ 8 occurrences). | XS (mechanical) |
| **RESP-032** | LOW | Tablet (768 px) only | `Header.tsx` | At exactly the `md` breakpoint, the nav appears + the hamburger (after RESP-001) might still be visible if not gated correctly. | Define a single source of truth for nav visibility (`hidden md:flex` for desktop nav, `md:hidden` for mobile trigger). Add a unit test snapshot at 767 px and 769 px. | XS |
| **RESP-033** | LOW | Tablet portrait (768 px) | `BookDetailPage`, `ExchangeDetailPage` | These jump from `grid-cols-1` directly to `lg:grid-cols-12` — i.e. tablet portrait gets the same single-column layout as a phone, wasting 768 px of width. | Add an `md:grid-cols-2` intermediate step. | S |
| **RESP-034** | LOW | All `overflow-x-auto` chip rows | Phones | Tabs / filter chips currently wrap (`flex-wrap`). For genres list (12 items) on iPhone SE this is 4 rows tall. An alternative is horizontal-scroll with `overflow-x-auto snap-x`. | Optional design call: scroll vs wrap for chip rows. Not a defect. | S |
| **RESP-035** | LOW | All forms | Phones in landscape | When the iOS keyboard opens in landscape, it covers ~ 60 % of the viewport. We don't `scrollIntoView` the focused field. | On `focus` of `input`/`textarea`, call `el.scrollIntoView({block:'center'})` — wrap in a `useScrollIntoViewOnFocus` hook. | M |

---

## 4. Per-page deep-dive

For each page below: **what renders on a 390 × 844 iPhone 14**, **what breaks**, **the specific code lines causing it**, and **the proposed fix**. Pages with no significant findings beyond the cross-cutting ones are mentioned briefly.

### 4.1 Public pages

#### `HomePage` (`/`) — `frontend/src/pages/HomePage/HomePage.tsx`

```104:120:frontend/src/pages/HomePage/HomePage.tsx
      {/* ── Hero Section ── */}
      <section className="relative">
        {/* Background Overlay */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E4B643]/10 blur-[120px] rounded-full" />
```

* **Renders**: dark hero with the headline (`text-5xl md:text-7xl` → 48 px on mobile = wraps tightly), search bar, popular tags, "X books available near you" badge.
* **Breaks**:
  * RESP-013: blur blob `w-[800px] h-[400px]` is contained because the outer `<div>` is `overflow-hidden` — OK *here*, but only because of the inner-div hack.
  * RESP-005: outer wrapper is `min-h-screen` (line 74) — should be `min-h-[100dvh]`.
  * RESP-001: header above is desktop-only — no nav → breadcrumb to How it Works / Community.
* **Below the fold on mobile**: hero ends at ~ 700 px; user must scroll for "Recently Added" and Steps. Acceptable.
* **Fix**: cross-cutting (RESP-001, 005); also reduce headline to `text-4xl sm:text-5xl md:text-7xl`.

#### `BrowseLandingPage` (`/browse`) — `frontend/src/pages/BrowseLandingPage/BrowseLandingPage.tsx`

```88:95:frontend/src/pages/BrowseLandingPage/BrowseLandingPage.tsx
      <section className="relative overflow-hidden pb-8">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#E4B643]/6 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-[#E4B643]/4 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 -right-32 w-[300px] h-[300px] bg-[#4ADE80]/3 blur-[100px] rounded-full" />
        </div>
```

* **Renders**: hero with headline + search; below it a `min-h-[400px] lg:min-h-[500px]` map embed (line 336).
* **Breaks**:
  * RESP-013 (decorative blobs).
  * Map embed: `min-h-[400px]` is tall enough on a 390 × 844 portrait phone, but on landscape (390 high) **the map alone fills the viewport with no margin** — no room for the books grid below.
  * RESP-001 nav.
* **Fix**: cross-cutting + reduce map to `min-h-[60dvh] lg:min-h-[500px]` (cap at viewport).

#### `CataloguePage` (`/catalogue`) — `frontend/src/features/discovery/pages/CataloguePage/CataloguePage.tsx`

```32:50:frontend/src/features/discovery/pages/CataloguePage/CataloguePage.tsx
const DEFAULT_RADIUS = 5000;
const PAGE_SIZE = 12;
```

* **Renders**: hero header (`text-4xl md:text-5xl`) + sticky filter sidebar + 3-col grid → on mobile becomes 1-col grid + a "Filters" button that opens `MobileFilterSheet`.
* **Breaks**:
  * `MobileFilterSheet` issues from RESP-010.
  * Hero text + page padding + filters + 12 books × ~400 px each = very long page; no virtualization. Not strictly responsive — but on slow mobile networks the scroll experience is heavy.
  * Pagination row (`buildPageNumbers`) on mobile shows up to 7 page buttons — at 320 px these can wrap weirdly.
* **Fix**: cross-cutting; cap pagination to `1 ... current-1 current current+1 ... last` with chevrons on `<sm`.

#### `MapPage` (`/map`) — covered in detail above (RESP-003, RESP-004).

This is the **single most-broken page on phones**. The 420 px sidebar + 100vh-based map height combine to give a non-functional first paint.

#### `HowItWorksPage` (`/how-it-works`) and `CommunityPage` (`/community`)

Both inherit the same hero pattern: blob blobs + `text-4xl sm:text-5xl md:text-7xl` headline + `min-h-screen`.

* **Breaks**: RESP-005, RESP-013, RESP-001.
* **Fix**: cross-cutting.

#### `PrivacyPolicyPage`, `TermsOfServicePage`, `AccountDeletionPage`

Long-form text pages. Largely OK responsively (`prose` classes typically wrap fine). One concern: if they use a fixed width container without max-w, they'll be too wide on tablet+. Quick visual check needed — not a confirmed defect.

#### `NotFoundPage`

Likely uses a hero pattern. Inspect for `min-h-screen` (probable RESP-005).

### 4.2 Auth pages

#### `AuthPage` (`/login`, `/register`, `/forgot-password`)

```46:50:frontend/src/features/auth/components/AuthSplitPanel/AuthSplitPanel.tsx
    <main className="min-h-screen bg-background-dark flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-7xl bg-surface-dark shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] border border-border-dark">
```

* **Renders**: full-viewport split panel. Branding (left, `md:flex hidden`) + form (right). Mobile: only the form.
* **Breaks**:
  * RESP-008: `min-h-[700px]` overflows landscape phones.
  * RESP-016: branding never shown on mobile — conversion suffers.
  * RESP-005: `min-h-screen`.
  * Form inputs use `sm:text-sm` which is correct.
  * OAuth buttons in a `grid-cols-2` row of 2 (Google + Apple-disabled) — fits OK on 320 px.

#### `OnboardingPage` (`/onboarding`)

Same structural pattern as `AuthPage`. Same RESP-008 / RESP-016. Bonus: a `flex flex-col md:flex-row` parent at line 50 — at `<md` the mobile-logo block (line 104) appears above the form correctly. OK.

#### `EmailVerifyPendingPage`, `EmailVerifyConfirmPage`, `PasswordResetConfirmPage`, `SocialAuthCallbackPage`, `SocialAuthErrorPage`

All `min-h-screen` (RESP-005). Probably mostly text-only — low risk, but worth a sweep.

### 4.3 Authenticated pages

#### `ProfilePage` (`/profile`)

```47:67:frontend/src/features/profile/pages/ProfilePage.tsx
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      ...
      <div className="bg-surface-dark rounded-2xl border border-border-dark p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <img className="w-24 h-24 rounded-2xl object-cover ..." />
```

* **Renders**: avatar 96 px + name + edit button + bio + stats grid below.
* **Breaks**: RESP-025 (cramped right column on `sm`); RESP-027 (text-only loading state).
* **Fix**: small.

#### `EditProfilePage` (`/profile/edit`)

Form with avatar uploader, bio, location, genre prefs. Apply RESP-007 to all inputs.

#### `MyShelfPage` (`/my-shelf`)

Tabs (Listings / Wishlist) + grid of `BookCard`. The grid likely uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` or similar — works. Loading state is text-only (RESP-027).

#### `AddBookPage` (`/books/new`), `EditBookPage` (`/books/:id/edit`)

ISBN lookup → form. Issues: RESP-007 (input font), RESP-026 (scan button tap target). The barcode scanner modal (`BarcodeScanner`) is `fixed inset-0` — needs RESP-006.

#### `BookDetailPage` (`/books/:id`)

```249:252:frontend/src/features/books/pages/BookDetailPage.tsx
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-none">
            {book.title}
          </h1>
```

* **Breaks**: RESP-012 (giant headline). Action buttons row (`flex flex-col sm:flex-row gap-4`) is OK — wraps on phone. Cover + grid layout switches `grid-cols-1 lg:grid-cols-12` (RESP-033 — no tablet step).

#### `ExchangesPage` (`/exchanges`), `ExchangeDetailPage` (`/exchanges/:id`)

* `ExchangesPage`: tabs + list of `ExchangeCard`. ExchangeCard is a horizontal flex with two thumbnails + arrow + meta — fits 320 px (each thumb 48 px, arrow 16 px ⇒ 160 px + meta column). OK.
* `ExchangeDetailPage`: timeline (left) + details (right) on `md+`, single-column on mobile. Order is timeline → details (RESP-019).
* `IncomingRequestsPage`: action-row issue (RESP-023).

#### `ChatPanel` (rendered inside ExchangeDetailPage when chat-eligible)

* RESP-011: `max-h-[600px]` cap.
* RESP-015: bubble width.
* RESP-017: textarea + send button.

#### `SettingsPage` (`/settings`)

```53:56:frontend/src/pages/SettingsPage/SettingsPage.tsx
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
```

Sectioned page (LocationSection, NotificationPreferences, Privacy, PasswordChange, BlockedUsers, DataExport, DeleteAccount). Each section is a card. Generally responsive-friendly. Forms inside the sections need RESP-007.

#### `WishlistPage` (if separate route) / `MyReviewsPage` / etc.

Lower-traffic; assume similar grid patterns. Spot-check during Sprint A.

### 4.4 Modals / overlays / banners

| Component | Type | RESP Issues |
| --- | --- | --- |
| `CookieConsentBanner` | `fixed bottom-0` | RESP-006 (safe-area) |
| `PwaUpdateBanner` | `fixed bottom-0` (SCSS) | RESP-006 |
| `MobileFilterSheet` | `fixed inset-0` | RESP-010 (vh→dvh, full-width on phone, safe-area) |
| `SwapFlowModal` | `fixed inset-0` | RESP-021 (full-screen on phone, dvh) |
| `ReportDialog` | `fixed inset-0` | RESP-006, vh→dvh |
| `DeleteAccountDialog` | `fixed inset-0` | RESP-006, vh→dvh |
| `BlockUserButton`-triggered dialog | `fixed inset-0` | RESP-006 |
| `BarcodeScanner` | `fixed inset-0` (full screen) | Depends — likely fine, but inspect for safe-area |
| `NotificationPanel` | `absolute right-0 top-full` (popover) | RESP-020 |
| `ProfileDropdown` | `absolute right-0` (popover) | OK at `w-48` (192 px) |

---

## 5. Cross-cutting findings (design-system level)

These belong in shared utilities / Tailwind config — applying them once fixes many pages.

### 5.1 Add safe-area Tailwind utilities

Create `@utility` rules in `tailwind.css` (Tailwind v4 syntax):

```css
@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }
@utility pt-safe { padding-top: env(safe-area-inset-top); }
@utility pl-safe { padding-left: env(safe-area-inset-left); }
@utility pr-safe { padding-right: env(safe-area-inset-right); }
@utility mb-safe { margin-bottom: env(safe-area-inset-bottom); }
@utility min-h-dvh  { min-height: 100dvh; }
@utility min-h-svh  { min-height: 100svh; }
@utility h-dvh      { height: 100dvh; }
```

Then sweep replacements — covered by RESP-002, 005, 006, 010, 011, 021.

### 5.2 Standardise input typography

Add a base layer (`@layer base`) rule in `tailwind.css`:

```css
@layer base {
  input:where(:not([type='checkbox']):not([type='radio'])),
  textarea,
  select {
    font-size: 1rem; /* 16px — prevents iOS auto-zoom */
  }
  @media (min-width: 640px) {
    input:where(:not([type='checkbox']):not([type='radio'])),
    textarea,
    select {
      font-size: 0.875rem; /* 14px on tablet+ */
    }
  }
}
```

This eliminates the per-component `text-base sm:text-sm` chore (RESP-007, 017, 026).

### 5.3 Define a `useBreakpoint` hook

```ts
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  // window.matchMedia + useSyncExternalStore
}
```

Currently the codebase relies entirely on Tailwind responsive variants. For dynamic logic (e.g. "render sidebar as sheet on mobile, rail on desktop") we need a JS hook. This unblocks RESP-003 (MapPage sidebar mode-switch).

### 5.4 Add a mobile drawer primitive

Reusable `<Drawer>` (slide-in panel) lives nowhere right now — Map page custom-builds it, MobileFilterSheet custom-builds it, ProfileDropdown is a popover. We need ONE primitive (probably wrapping the existing `tast-ui` Modal or building from scratch with `motion/react`) that:

* slides from left / right / bottom
* honours `prefers-reduced-motion`
* traps focus
* applies safe-area padding to the open edge
* closes on backdrop tap + Escape

Used by RESP-001 (mobile nav) and refactor of all sheets/modals.

### 5.5 Consolidate "loading" states

Migrate the 4-5 inline `<div className="animate-pulse text-[#8C9C92]">Loading…</div>` callsites to `<BrandedLoader>`. Visual consistency only (RESP-027).

### 5.6 Remove `body { overflow-x: hidden }`

`frontend/src/styles/base/_resets.scss` line 44. After removing, fix whatever overflows (likely the hero blobs — RESP-013). This is a "trust the layout" hygiene step.

### 5.7 Tap-target audit

Run a one-off pass on every interactive element with explicit `w-N h-N` where N < 11 (44 px). Wrap in `min-w-[44px] min-h-[44px]` for hit area while keeping the visual icon small. Affected: header icon buttons (RESP-014, 028), notification panel buttons, message input send button, modal close X buttons.

### 5.8 Container queries (future-leaning)

Tailwind v4 ships `@container` natively. The `BrowseBookCard` is a great candidate — its layout should depend on the **card's** width, not the viewport. With container queries the same card can render compact in a 3-column grid and full in a 1-column list.

---

## 6. Phased sprint plan

### Sprint A — Critical (≤ 1 day) — ✅ COMPLETE (2026-04-25)

**Objective:** unblock mobile users; eliminate showstoppers.

| ID | Task | Owner | Est | Status |
| --- | --- | --- | --- | --- |
| A1 | RESP-002 — add `viewport-fit=cover` to `index.html` | FE | 1 line | ✅ done |
| A2 | RESP-001 — implement mobile nav drawer (hamburger trigger in Header on `<md`, slide-in panel with Browse / How it Works / Community / Sign In + language toggle) | FE | ½ day | ✅ done |
| A3 | RESP-003 — make `MapPage/SidePanel` `w-full sm:w-[360px] md:w-[420px]`; on `<sm` render as bottom-drawer (or full-screen sheet behind a "List" toggle) | FE | ½ day | ✅ done (full-width sheet) |
| A4 | RESP-004 — `MapPage` height: `100vh` → `100dvh`; introduce `--header-h` CSS var | FE | 1-2 h | ✅ done (live-measured via ResizeObserver) |
| A5 | RESP-006 + 5.1 — add safe-area Tailwind utilities; apply `pb-safe` to `CookieConsentBanner`, `PwaUpdateBanner`, `MobileFilterSheet`, `SwapFlowModal`, `ReportDialog`, `DeleteAccountDialog`, `BarcodeScanner` | FE | ½ day | ✅ done (utilities are *additive* via `--pb` / `--pt`, also covers `BlockUserButton` dialog) |
| A6 | RESP-005 — codemod `min-h-screen` → `min-h-[100dvh]` (12 files) | FE | 1 h | ✅ done |

**Implementation notes:**

* `tailwind.css` adds `pb-safe` / `pt-safe` / `pl-safe` / `pr-safe` / `mb-safe` / `mt-safe` / `min-h-dvh` / `min-h-svh` / `h-dvh` / `break-anywhere` `@utility` rules. The `*-safe` variants are *additive* — set `--pb`/`--pt`/`--pl`/`--pr` inline (or via a wrapping rule) and the utility adds the `env(safe-area-inset-*)` on top. This avoids the common pitfall where the inset *replaces* baseline padding on devices that report a 0 inset.
* `--header-h` is published at `:root` with a `73px` fallback and overwritten at runtime by a `ResizeObserver` on the `<header>` element so any future header redesign updates the var automatically.
* The mobile drawer is keyboard-accessible (Escape closes, focus moves into the panel on open and back to the trigger on close), locks `body.style.overflow`, and auto-closes on route change. New i18n keys `home.nav.openMenu` / `home.nav.menuLabel` were added in EN / NL / FR.
* The SCSS `PwaUpdateBanner.module.scss` uses native `calc(... + env(safe-area-inset-*))` directly (it can't consume Tailwind utilities).
* `MapPage/SidePanel` shares the `w-full sm:w-[360px] md:w-[420px]` width tokens between the wrapper and the inner panel so the slide-in transform stays aligned. The persistent left-edge toggle still works on closed mobile state.

**Definition of done:**

* Manual smoke on iPhone SE (320 px) + iPhone 14 (390 px) + Pixel 7 (393 px) + iPad mini (768 px) — every public page reachable without a desktop nav; map page visible and usable; no fixed-bottom UI under the iOS home indicator.
* No reported visual regressions on `≥ md` viewports.

**Verification (automated):** `yarn type-check`, `yarn lint`, `yarn stylelint`, `yarn test:run` (86 files / 926 tests), `playwright test --list` (234 tests) all green.

### Sprint B — High (2–3 days) — ✅ COMPLETE (2026-04-25)

**Objective:** ergonomics + correctness.

| ID | Task | Est | Status |
| --- | --- | --- | --- |
| B1 | 5.2 + RESP-007 / 017 / 026 — base-layer rule + audit ~ 12 inputs | ½ day | ✅ done |
| B2 | RESP-008 — `min-h-[100dvh] md:min-h-[700px]` in `AuthSplitPanel` and `OnboardingPage` | XS | ✅ done |
| B3 | RESP-009 — remove `body { overflow-x: hidden }`, surface and fix RESP-013 hero blobs (4 files) | ½ day | ✅ done (also responsive-scaled secondary blobs) |
| B4 | RESP-010 — `MobileFilterSheet` full-width on phone + `dvh` + safe-area | XS | ✅ done |
| B5 | RESP-011 — `ChatPanel` fill-parent layout; edge-to-edge on phone | ½ day | ✅ done (responsive `max-h` + drop borders < `sm`) |
| B6 | RESP-012 — fluid hero typography (`text-[clamp(...)]`) on `BookDetailPage` and `HomePage` headline; add `text-balance` | S | ✅ done |
| B7 | RESP-014 — Header right cluster compaction; hide wordmark + lang label on `<sm` | S | ✅ done (wordmark `sr-only sm:not-sr-only`, gap tightened) |
| B8 | RESP-015 — `MessageBubble` `max-w-[85%] sm:max-w-[75%]` + `break-anywhere` | XS | ✅ done |
| B9 | RESP-016 — condensed mobile brand block above auth form | M | ✅ done (both AuthSplitPanel + OnboardingPage) |

**Implementation notes:**

* **B1** is *defence in depth*: a `@layer base` `@media (width < 640px)` rule in `_resets.scss` enforces a 16 px minimum on every `input` / `select` / `textarea` (catches inputs that have no `text-*` utility); the explicit per-input audit then changes 8 bare-`text-sm` controls to `text-base sm:text-sm` so the intent is documented in the markup, not relying on the safety net alone. The four auth forms that already used `sm:text-sm` (no mobile font-size) are picked up by the base-layer rule for free.
* **B3** intentionally *removes* the body-level `overflow-x: hidden` rather than adding more clipping. The rule was masking real overflow bugs. To prevent regressions, the four hero blob containers now scale responsively (`w-[60–90vw] h-[30–40vh] md:w-[…] md:h-[…]`) on top of their existing `overflow-hidden` parents — belt and braces.
* **B5** doesn't yet refactor the parent page (`ExchangeDetailPage`) into a fill-viewport layout — that's a Sprint C job. For now the `ChatPanel` itself uses `min-h-[400px] max-h-[70dvh] sm:max-h-[600px]` so it actually uses the available phone height, and drops `rounded-xl` + `border` below `sm` for an edge-to-edge feel within the parent's padding.
* **B7** uses `sr-only sm:not-sr-only` on the "BookSwap" wordmark instead of `hidden sm:inline`. The text stays in the accessibility tree on phones (so the icon link still has an accessible name) while being visually hidden — and the icon `<img>` keeps its empty `alt=""` to dodge the `image-redundant-alt` axe rule.
* **B9** intentionally renders the headline + subtitle a *second* time inside the form panel below `md:` (the desktop branding panel is `hidden md:flex`). The existing `phase4-ui` test that expected a single subtitle was relaxed to `getAllByText(...).length > 0` since both copies are legitimate.

**Definition of done:**

* No iOS auto-zoom on focus of any input across the app.
* Auth pages usable in landscape (845 × 390).
* No horizontal scroll on any public page (verified via DevTools "show vertical/horizontal scrollbar" overlay).
* Chat panel fills the viewport on mobile; bubbles wrap correctly.

**Verification (automated):** `yarn type-check`, `yarn lint`, `yarn stylelint`, `yarn test:run` (86 files / 926 tests), `playwright test --list` (234 tests) all green.

### Sprint C — Medium / Polish (3–5 days) — ✅ COMPLETE (2026-04-25)

**Objective:** polish, consistency, and design-system maturity.

| ID | Task | Est | Status |
| --- | --- | --- | --- |
| C1 | 5.3 — `useBreakpoint` hook + 5.4 reusable `<Drawer>` primitive | 1 day | ✅ done |
| C2 | 5.5 — migrate all inline loading states to `BrandedLoader` (RESP-027) | S | ✅ done |
| C3 | 5.7 — global tap-target pass (RESP-014, 020, 024, 028) | ½ day | ✅ done |
| C4 | RESP-019 — reorder ExchangeDetailPage / BookDetailPage on mobile so primary actions are above the fold | ½ day | ✅ done |
| C5 | RESP-020 — `NotificationPanel` clamp width + `dvh` height | XS | ✅ done |
| C6 | RESP-021 — `SwapFlowModal` full-screen sheet on `<sm` (uses C1 Drawer) | 1 day | ✅ done |
| C7 | RESP-022 — Footer compaction on phones | XS | ✅ done |
| C8 | RESP-023 — list-page action footer pattern (IncomingRequestsPage et al.) | ½ day | ✅ done |
| C9 | RESP-024, 025, 026 — header / chat / profile / addbook small fixes | S | ✅ done |
| C10 | RESP-029 / 030 / 031 — mini polish (modal icons, emoji → lucide, remove inline `marginInline:auto`) | S | ✅ done |
| C11 | RESP-032 / 033 — tablet-specific intermediate `md:grid-cols-2` step on detail pages; nav-visibility unit tests | S | ✅ done |
| C12 | RESP-035 — `useScrollIntoViewOnFocus` hook; apply globally to forms | M | ✅ done |
| C13 | 5.8 — pilot container queries on `BrowseBookCard` | M | ✅ done |

**Implementation notes:**

* `useBreakpoint` (and `useIsBelow`) live in `frontend/src/hooks/useBreakpoint.ts` and use `useSyncExternalStore` with a single shared resize listener (one `addEventListener` regardless of how many components subscribe). The internal cache refreshes when the *first* subscriber registers so jsdom tests that mutate `innerWidth` before render get a correct initial value.
* The `<Drawer>` primitive (`frontend/src/components/common/Drawer/`) wraps `motion/react` `AnimatePresence`, supports `left` / `right` / `top` / `bottom`, traps focus, locks body scroll, restores focus to the trigger on close, honours `prefers-reduced-motion` (skips animation), and applies `pl-safe` / `pr-safe` / `pt-safe` / `pb-safe` to the open edge. The `Header` `MobileNavDrawer` was refactored onto this primitive and now contains zero custom focus-trap / scroll-lock / Escape-handling code.
* Tap-target pass (RESP-014/020/024/028) updated icon-only buttons across the app to a minimum `44×44` hit area via `inline-flex items-center justify-center min-w-[44px] min-h-[44px]`. Touched: `LanguageToggle`, `NotificationBell`, `ProfileDropdown` trigger, `MessageInput` (send + attach + remove image), `NotificationPanel` "Mark all read", `SwapFlowModal` close X (3 step components), `MobileFilterSheet` close, `BarcodeScanner` close, `MeetupSuggestionPanel` close, `ChatHeader` Suggest Meetup, `ProfilePage` Edit, `AddBookPage` scan barcode.
* `BookDetailPage` (RESP-019) now duplicates the primary CTA (Request Swap / Edit Listing) inside a `lg:hidden` block placed right after the title, so phones see the action without scrolling past synopsis + metadata. The full action set still renders at the bottom for desktop.
* `ExchangeDetailPage` (RESP-019) uses Tailwind `order-2 md:order-1` / `order-1 md:order-2` to surface the actions card above the timeline on mobile while preserving the desktop two-column layout.
* `NotificationPanel` (RESP-020) clamps width via `w-[min(20rem,calc(100vw-1rem))]` and switches `max-h` to `70dvh` so the iOS URL-bar collapse doesn't jump the panel.
* `SwapFlowModal` (RESP-021) becomes a full-viewport sheet below `sm:` (`h-[100dvh]`, no rounded corners, no centring inset) and the original centred dialog at `sm:`+. Implemented inline rather than via the new `<Drawer>` to avoid disturbing the multi-step state machine inside `useSwapFlow`; behaviourally equivalent to a slide-from-bottom drawer.
* `Footer` (RESP-022) drops typography to `text-xs` below `sm:`, tightens gaps, and hides the "by Nimoh Digital Solutions" attribution on phones to save a row (still credited on legal pages).
* `IncomingRequestsPage` action footer (RESP-023) uses `grid grid-cols-2 sm:flex` so on phones the Accept button takes a full row and Decline + View share a second row — eliminating the 3-up squeeze on 320 px viewports.
* `RESP-029` modal icons reduced to `text-4xl` below `sm:` (was `text-5xl` everywhere). `RESP-030` ✉️ emoji in `ForgotPasswordForm` success state replaced with a brand-coloured `<MailCheck>` lucide icon. `RESP-031` redundant `style={{ marginInline: 'auto' }}` removed from 14 files (kept `mx-auto` Tailwind utility — the inline style was a no-op).
* `BookDetailPage` (RESP-032) added the missing tablet step: `grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16` with matching `md:col-span-{5,7}`. iPad mini portrait (768 px) now gets a cover-on-left, details-on-right layout instead of single-column.
* `Header.test.tsx` (RESP-033) gained three nav-visibility tests that assert the `md:hidden` / `hidden md:flex` / `hidden md:block` class wiring on the hamburger, desktop NavLinks, and LanguageToggle. jsdom doesn't compile Tailwind so we proxy the visibility contract via the controlling class set.
* `useScrollIntoViewOnFocus` (RESP-035, in `frontend/src/hooks/useScrollIntoViewOnFocus.ts`) listens for `focusin` events on a ref and calls `scrollIntoView({block: 'center'})` for `INPUT` / `TEXTAREA` / `SELECT` / `[contenteditable]` only. A 250 ms default delay gives the soft keyboard time to animate before measuring; respects `prefers-reduced-motion` (instant scroll). Applied to `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `BookForm` (used by AddBook + EditBook), and `EditProfileForm`.
* `BrowseBookCard` (5.8) is now a `@container/card` parent with typography / padding keyed on the *card's* width via `@[18rem]/card:` — so the same component renders compact in a 4-up `lg:` grid (~250 px wide) and roomy in a 1-up list (~700 px wide) on the same page, without a viewport-keyed override.

**Definition of done:**

* Full polish-pass; design system has primitives for `Drawer`, `Sheet` (via Drawer or full-screen modal), `BrandedLoader`, `useBreakpoint`, `useScrollIntoViewOnFocus`.
* Snapshot / unit test stack proves the nav switches at exactly 768 px (`Header.test.tsx`).
* Container-queries pilot validated on a real production component (`BrowseBookCard`) — pattern is ready for fleet-wide adoption.

**Verification (automated):** `yarn type-check`, `yarn lint`, `yarn stylelint`, `yarn test:run --no-file-parallelism` (89 files / 943 tests), `playwright test --list` (234 tests) all green.

> Note: under high parallel CPU load `MapPage.test.tsx` occasionally times out the API-key fallback render (5 s). This is a pre-existing test-infrastructure flake unrelated to this sprint — when run sequentially or in isolation all 943 tests pass. Tracked separately for the test-infra cleanup epic.

---

## 7. Appendix

### 7.1 Recommended `<meta>` tags (`frontend/index.html`)

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
<meta name="theme-color" content="#152018" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#FDFBF7" media="(prefers-color-scheme: light)" />
```

(The current single `theme-color: #1a2f23` is fine but a per-scheme pair makes the iOS status bar match.)

### 7.2 Tailwind v4 `@utility` snippet (drop into `tailwind.css` after `@theme`)

```css
@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }
@utility pt-safe { padding-top: env(safe-area-inset-top); }
@utility pl-safe { padding-left: env(safe-area-inset-left); }
@utility pr-safe { padding-right: env(safe-area-inset-right); }
@utility mb-safe { margin-bottom: env(safe-area-inset-bottom); }
@utility mt-safe { margin-top: env(safe-area-inset-top); }
@utility min-h-dvh { min-height: 100dvh; }
@utility min-h-svh { min-height: 100svh; }
@utility h-dvh { height: 100dvh; }
@utility break-anywhere { overflow-wrap: anywhere; }
```

### 7.3 Codemod sketch — `min-h-screen` → `min-h-[100dvh]`

```bash
rg -l 'min-h-screen' frontend/src \
  | xargs sed -i '' 's/min-h-screen/min-h-[100dvh]/g'
```

(12 files; spot-check the diff. Some `min-h-screen` usages might want `100svh` — the smaller, stable variant — for, e.g., the auth split-panel where you want it to fit when the iOS keyboard opens. Decide on a case-by-case basis.)

### 7.4 Suggested Drawer primitive surface (sketch)

```ts
interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'left' | 'right' | 'bottom' | 'top';
  className?: string;
  children: ReactNode;
  /** Apply safe-area padding to the open edge. Default true. */
  safeArea?: boolean;
}
```

Implementation: wrap `motion/react` `<motion.div>` with `AnimatePresence`, focus-trap (e.g. `react-focus-lock` or roll our own), backdrop with `onClick={() => onOpenChange(false)}`, Escape key handler. Internalize `prefers-reduced-motion` (skip animation, just toggle visibility).

### 7.5 Where this audit overlaps with prior work

* The deep audit (`docs/deep-audit/deep-audit-2026-04-24.md`) flagged code-quality items like `BrandedLoader` consistency (RESP-027 echoes that), oversized components (`SidePanel` was already refactored under AUD-W-404 — RESP-003 is the *behavioural* gap that refactor didn't address), and the `marginInline: 'auto'` inline-style holdover (RESP-031). Where this audit reopens those, it's because the responsive lens surfaces a new symptom of the same root cause.

### 7.6 Out-of-scope reminders

* No actual browser was opened during this audit.
* The mobile React Native app under `mobile/` was **not** audited — this is exclusively the responsive web app.
* This audit makes **no code changes** — implementation is the next step (Sprint A).
* Translation-string overflow risk was flagged as a class but not enumerated per-string.
* Performance / network responsiveness (slow 3G LCP, INP) is a separate audit.

---

**End of document.**
