# BookSwap Frontend Audit — 2026-04-19

Comprehensive audit of the web frontend (`frontend/src/`) on staging.
Covers mock data, broken features, parity gaps, i18n, and visual inconsistencies.

---

## 1. CRITICAL — Mock / Hardcoded Data in Production (5) — ALL RESOLVED

| ID | Location | Finding | Status |
|----|----------|---------|--------|
| FE-C01 | `pages/HomePage/HomePage.tsx` | **Hardcoded `BOOKS` array** — 4 fake books with fake owners | **RESOLVED** — Replaced with `useBooks({ page_size: 4, ordering: '-created_at' })` + real `BookCard` components with loading skeletons |
| FE-C02 | `pages/HomePage/HomePage.tsx` | **Swap buttons decorative** — no onClick | **RESOLVED** — `BookCard` already links to `/books/:id`; decorative buttons removed with fake card grid |
| FE-C03 | `features/profile/pages/PublicProfilePage.tsx` | **Listed books hardcoded placeholder** | **RESOLVED** — Fetches user books via `useBooks({ owner: id })`, renders `BookCard` grid with loading skeletons, empty state only when API returns empty |
| FE-C04 | `pages/CataloguePage/` | **Entire page is a stub** | **RESOLVED** — Deleted directory (tsx + test). Not referenced in routes. |
| FE-C05 | `pages/HomePage/HomePage.tsx` | **`POPULAR_TAGS` hardcoded English** | **RESOLVED** — Replaced with `t()` calls for each tag, making them translatable |

---

## 2. HIGH — Fake Stats & Fabricated Content (7) — ALL RESOLVED

| ID | Location | Finding | Status |
|----|----------|---------|--------|
| FE-H01 | `pages/HomePage/HomePage.tsx` | **CTA "Join 15,000+ book lovers in Amsterdam"** | **RESOLVED** — Changed to `t('home.cta.subtitle', 'Join book lovers in {{city}}…', { city })` using dynamic city from `useUserCity()` |
| FE-H02 | `features/auth/pages/RegisterPage.tsx` | **"Join over 15,000 book lovers…"** | **RESOLVED** — Changed to: "Trade stories, share recommendations, and build a sustainable reading culture in {{city}}." |
| FE-H03 | `features/auth/pages/ForgotPasswordPage.tsx` | **Same "15,000" + wrong branding title** | **RESOLVED** — Appropriate "Reset Your Password" title, removed stats, removed `useUserCity` (not needed) |
| FE-H04 | `features/auth/pages/AuthPage.tsx` | **"15,000" in BRANDING + citySubtitles** | **RESOLVED** — Removed all fake numbers from BRANDING object and citySubtitles |
| FE-H05 | Multiple auth pages + `AuthSplitPanel` | **Fabricated testimonials** (Sarah Jenkins, Elena Rodriguez, David Park) | **RESOLVED** — Made `quote`/`authorName`/`authorDetails` optional in `AuthSplitPanel`; removed all fake testimonial props from `AuthPage`, `RegisterPage`, `LoginPage`, `ForgotPasswordPage` |
| FE-H06 | `pages/HomePage/HomePage.tsx` | **Community title "Connect with Amsterdam"** | **RESOLVED** — Changed to `t('home.community.title', 'Connect with {{city}}', { city })` |
| FE-H07 | `components/layout/Footer/Footer.tsx` | **Footer "BookSwap Amsterdam"** | **RESOLVED** — Changed to just "BookSwap" |

---

## 3. MEDIUM — Unwired Features & Parity Gaps (10) — 9 RESOLVED, 1 SKIPPED

| ID | Location | Finding | Status |
|----|----------|---------|--------|
| FE-M01 | `features/exchanges/` | **Counter-offer flow not wired** | **RESOLVED** — Added `approveCounter` endpoint, service method, `useApproveCounter` mutation hook. Wired `counter_proposed` status handling into `ExchangeDetailPage` (requester can approve/decline, owner sees waiting state). Added `counter_proposed` to `ExchangeStatus` type and `ExchangeStatusBadge`. |
| FE-M02 | `features/ratings/` | **Ratings list not shown on public profiles** | **RESOLVED** — Imported and rendered `RatingsList` on `PublicProfilePage` below the listed books section. |
| FE-M03 | `features/books/hooks/useReorderPhotos.ts` | **Photo reorder not exposed in UI** | **SKIPPED** — Needs drag-and-drop library, low ROI for now. |
| FE-M04 | `features/books/hooks/useExternalBookSearch.ts` | **External title search not used** | **RESOLVED** — Wired `useExternalBookSearch` into `AddBookPage` as an "Or Search by Title" section with search results list and auto-fill on selection. |
| FE-M05 | `features/discovery/` | **Map books, radius counts, and radius selector unused** | **RESOLVED** — `FilterPanel` already has a full distance slider with radius support; `RadiusSelector` segmented control is a cosmetic alternative. No action needed. |
| FE-M06 | `features/profile/services/profile.service.ts` | **Account deletion cancel not wired** | **RESOLVED** — Backend `UserPrivateSerializer` now exposes `deletion_requested_at`. `DeleteAccountDialog` saves cancel token to localStorage on deletion. `SettingsPage` shows a "Cancel Deletion" banner when `deletion_requested_at` is set, with a button that calls `profileService.cancelDeletion`. |
| FE-M07 | `features/trust-safety/hooks/useIsBlocked.ts` | **`useIsBlocked` unused** | **RESOLVED** — `PublicProfilePage` shows a "You have blocked this user" banner. `BookDetailPage` hides swap/message actions when viewing a blocked user's book. |
| FE-M08 | Multiple files | **`Link`/`navigate` without locale prefix** | **RESOLVED** — Replaced `Link` with `LocaleLink` and `useNavigate` with `useLocaleNavigate` in: `HomePage`, `ExchangeCard`, `BrowseBookCard`, `BookCard`, `BookPopup`. |
| FE-M09 | `pages/HomePage/HomePage.tsx` | **"How it Works" steps not i18n-wrapped** | **RESOLVED** — Moved step titles and descriptions to `t()` calls with i18n keys (`home.howItWorks.steps.{list,find,swap}.{title,description}`). |
| FE-M10 | `configs/apiEndpoints.ts` | **Unused API endpoint definitions** | **RESOLVED** — Removed `API.auth.verify`, `API.auth.sessions`, `API.reports.adminList`, `API.reports.adminUpdate`. |

---

## 4. LOW — Cleanup & Polish (5) — ALL RESOLVED

| ID | Location | Finding | Status |
|----|----------|---------|--------|
| FE-L01 | `features/auth/components/LoginForm/LoginForm.tsx` | **Apple sign-in shows "coming soon"** | **RESOLVED** — Button is now hidden in production (`import.meta.env.DEV` guard). Only visible in dev mode with `opacity-50 cursor-not-allowed` styling. |
| FE-L02 | `hooks/useUserCity.ts` | **Amsterdam hardcoded as geolocation fallback** | **RESOLVED** — Changed fallback label from `'Amsterdam'` to `'your area'`. Coordinates kept for map centering. |
| FE-L03 | Multiple filter components | **Genre/condition/language options duplicated** | **RESOLVED** — Extracted to single `constants/bookOptions.ts` with typed exports. `FilterPanel`, `BookGenrePicker`, and `GenrePicker` now import from `@constants/bookOptions`. Added `@constants` alias to tsconfig + vite config. |
| FE-L04 | `pages/ComponentsDemoPage/ComponentsDemoPage.tsx` | **Dev showcase page still routed** | **RESOLVED** — Route guarded behind `import.meta.env.DEV` in `routesConfig.tsx`. Not accessible in production. |
| FE-L05 | `features/auth/pages/` | **`BRANDING` config duplicates page-level props** | **RESOLVED** — Deleted legacy `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx` and their test. Removed exports from auth index. `AuthPage` is the single source of truth for branding + form routing. |

---

## Priority Execution Order

### Phase 1 — Remove all fake data (CRITICAL)
1. **FE-C01 + FE-C02**: Replace hardcoded `BOOKS` with real API query + working cards
2. **FE-C03**: Wire public profile listed books to API
3. **FE-C04**: Delete dead `CataloguePage`
4. **FE-C05**: Move popular tags to i18n

### Phase 2 — Remove fake stats & social proof (HIGH)
5. **FE-H01 to FE-H04**: Replace/remove all "15,000" fake stats
6. **FE-H05**: Remove fabricated testimonials
7. **FE-H06 + FE-H07**: Fix hardcoded "Amsterdam" in community title + footer

### Phase 3 — Wire missing features (MEDIUM)
8. **FE-M01**: Complete counter-offer flow
9. **FE-M02**: Show ratings on public profiles
10. **FE-M03 to FE-M05**: Wire unused hooks/components into UI
11. **FE-M06 + FE-M07**: Deletion cancel + block checking
12. **FE-M08**: Fix locale-prefixed navigation
13. **FE-M09 + FE-M10**: i18n for steps + clean up unused endpoints

### Phase 4 — Cleanup (LOW)
14. **FE-L01 to FE-L05**: Apple sign-in, fallback city, shared constants, demo page guard, BRANDING consolidation

---

*Total: 27 findings — 5 Critical, 7 High, 10 Medium, 5 Low*
