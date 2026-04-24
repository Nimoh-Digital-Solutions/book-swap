# BookSwap — Deep Audit (2026-04-24)

**Scope**: Backend (Django), Web frontend (React/Vite), Mobile (React Native/Expo), Cross-cutting.
**Mode**: Read-only. No changes were made.
**Method**: Static review via parallel exploration of all three layers, plus targeted scans for i18n drift, dead exports, route registration, shared-package usage, and oversized files.

---

## 0. Executive Summary

### Totals by severity

| Severity | Backend | Web | Mobile | Cross-cutting | Total |
|---|---:|---:|---:|---:|---:|
| Critical | 0 | 0 | 0 | 0 | **0** |
| High     | 5 | 4 | 6 | 3 | **18** |
| Medium   | 14 | 12 | 11 | 4 | **41** |
| Low      | 14 | 16 | 14 | 2 | **46** |
| Nit      | 5 | 5 | 2 | 1 | **13** |
| **Total**| **38** | **37** | **33** | **10** | **118** |

### Top 10 highest-impact findings (do these first)

1. **AUD-X-001 [High]** `packages/shared/` is built but **the web frontend imports from it 0 times**; mobile uses it from only 2 files. Both apps duplicate the type system that this package was created to share. (See §6.1)
2. **AUD-W-001 [High]** `frontend/auth-app/` is an **orphan AI-Studio prototype** (`react-example`, ships `@google/genai`, `express`, `better-sqlite3`) — 300 KB of unrelated code in the repo. Delete.
3. **AUD-B-001 [High]** Multiple list endpoints have **no pagination** and can return unbounded result sets: `ExchangeRequestViewSet.list`, `MessageViewSet.list`, `UserRatingsViewSet.list`, `BlockViewSet.list`, `ReportAdminListView.list`. DoS / data-exposure risk on power users.
4. **AUD-B-002 [High]** `SECRET_KEY` and `DATABASE_URL` in `backend/config/settings/base.py` have **non-empty defaults** (`environ.Env(SECRET_KEY=str)` falls back to a string; the `DATABASE_URL` default embeds a local user/password/db). Production must fail fast if either is missing.
5. **AUD-M-001 [High]** Mobile `profile.public.*` block flow strings (`blockTitle`, `blockMessage`, etc.) are referenced via `t(...)` but **not in any locale JSON** — fr/nl users always see English `defaultValue`.
6. **AUD-M-002 [High]** Mobile **offline mutation queue is partial**: `useExchanges` only queues create/accept/decline/cancel; counter / approve-counter / accept-conditions / confirm-swap **bypass the queue**. Photo messages are also not queued.
7. **AUD-W-002 [High]** Several pages do **not handle `isError`** from TanStack Query (`HomePage`, `BrowsePage` (landing)). On API failure the page silently shows a stale/empty state.
8. **AUD-B-003 [High]** Synchronous external HTTP in request path: `SetLocationView` → Nominatim, `ISBNLookupView`, `ExternalSearchView` → external APIs. No circuit breaker; one slow external = your worker stuck.
9. **AUD-X-002 [High]** **Test coverage for top user flows is thin**: no Maestro flow for sign-up/password-reset/email-verify/chat/swap; no Vitest for ~22 of ~28 web pages (incl. `BookDetailPage`, `ExchangeDetailPage`, `MapPage`, `SettingsPage`).
10. **AUD-X-003 [High]** **`AGENTS.md` documentation is stale** in three repository-wide ways: (a) says "future mobile app" — mobile is built; (b) says "Leaflet for maps" — we just migrated to Google Maps; (c) lists `docs/speaklinka-comparison-gap-analysis.md` which doesn't exist in this repo.

### Themes

- **Dead-or-unused infrastructure**: `frontend/auth-app/` (orphan), `packages/shared/` (almost unused on web), `bookswap/consumers.ExampleConsumer` (scaffold), `expo-blur` (unused dep), `ComponentsDemoPage` chunk shipped to prod bundle even though the route is dev-only.
- **Oversized files**: 9 files > 500 LoC; the worst (mobile `SettingsScreen` 1071, `BookDetailScreen` 995, `BrowseMapScreen` 954, backend `notifications/tasks.py` 949) are maintainability risks.
- **Inconsistent loaders / error states / haptics / `t()` usage**: many screens still use raw `ActivityIndicator` or hard-coded English; some lack empty/error states.
- **Pagination & external HTTP**: backend has several unbounded list endpoints and synchronous slow ops on the request path.
- **Test gaps on critical flows**: chat, swap, settings, map, payments-adjacent areas.

---

## 1. Backend (Django) — `AUD-B-NNN`

### 1.1 Dead code

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-101 | Med | `bookswap/consumers.py` (full file) | `ExampleConsumer` is never imported in `bookswap/routing.py` → delete or wire behind a dev-only path. |
| AUD-B-102 | Med | `bookswap/serializers.py` 229–256 | `BookswapRegisterSerializer` only used in tests, not by URL/view registration → wire it into the real registration path or drop. |
| AUD-B-103 | Low | `config/celery.py` 19–22 | `debug_task` defined but never referenced → remove or move to dev tooling. |
| AUD-B-104 | Nit | `config/settings/development.py` 29–32 | Large commented `debug_toolbar` block → remove. |

### 1.2 Incomplete features

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-201 | Low | `bookswap/views.py` 81–93 | `OnboardingCompleteView.get` returns a static "Hello from bookswap!" — placeholder beside real POST → remove or align contract. |
| AUD-B-202 | Low | `bookswap/ws_first_msg_auth.py` 175–177 | `post_authenticate` raises `NotImplementedError` by design → use `abc.ABC` for clarity. |
| AUD-B-203 | Nit | `bookswap/models.py` (avatar field) | Help text says "Validated … in Phase 2" while validation already exists → align doc. |

### 1.3 Code quality / oversized files

| ID | Sev | File | LoC | Issue → Fix |
|---|---|---|---:|---|
| AUD-B-301 | Med | `bookswap/views.py` | 664 | Monolith (custom login, social mobile, data export, user CRUD) → split by domain (`auth`, `users`, `devices`). |
| AUD-B-302 | Med | `apps/books/views.py` | 664 | Long module (CRUD + photos + ISBN + browse + stats) → split into `book_viewset`, `discovery`, `stats`. |
| AUD-B-303 | Med | `apps/notifications/tasks.py` | 949 | Too many tasks in one file → split per domain (`exchange.py`, `messaging.py`, `account.py`). |
| AUD-B-304 | Low | `apps/books/services.py` | — | `Any` in `_extract_year` and `dict[str, Any]` returns → use `TypedDict`. |
| AUD-B-305 | Low | `apps/messaging/views.py` | — | `MessageViewSet` is `GenericViewSet` while `ExchangeRequestViewSet` uses fuller mixin stack → standardise. |
| AUD-B-306 | Low | `bookswap/views.py` 119–123 | — | `import random` inside `CheckUsernameView.get` → move to module top. |

### 1.4 Pagination / unbounded responses (treat as security + code quality)

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-401 | High | `apps/exchanges/views.py` `ExchangeRequestViewSet` | `ListModelMixin` with no `pagination_class` → unbounded `GET /exchanges/`. |
| AUD-B-402 | High | `apps/messaging/views.py` 72–87 `MessageViewSet.list` | Paginates only if a paginator exists; view defines none → can return full chat history in one response. |
| AUD-B-403 | Med | `apps/ratings/views.py` 111–134 `UserRatingsViewSet.list` | Same pattern → unbounded public ratings per user. |
| AUD-B-404 | Med | `apps/trust_safety/views.py` 19–36 `BlockViewSet.list` | No pagination. |
| AUD-B-405 | Med | `apps/trust_safety/views.py` 120–131 `ReportAdminListView` | Admin list unpaginated — large-table risk. |

### 1.5 Test gaps

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-B-501 | Med | `GET /api/v1/books/community-stats/` | No tests → add success / bad lat-lng / radius-clamp tests. |
| AUD-B-502 | Med | `apps/trust_safety/tasks.send_report_notification_email` | No tests; signal triggers it → add unit test with mail backend. |
| AUD-B-503 | Low | Pagination contract tests | After fixing 401–405, add tests asserting capped page size. |

### 1.6 Security-lite (only NEW items, not previously covered)

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-601 | High | `bookswap/serializers.py` 112–145 + `UserDetailView` | `UserPublicSerializer` only excludes inactive/blocked, not `profile_public=False` → enforce in `get_queryset` or serializer. |
| AUD-B-602 | High | (See pagination 401–405) | Unbounded list endpoints are a data-exposure / DoS surface. |
| AUD-B-603 | Med | `apps/notifications/tasks.py` 146–148, 212, 947 | `user.email` logged at INFO → redact or lower to DEBUG outside prod. |
| AUD-B-604 | Med | `bookswap/views.py` 398 | `logger.error(extra={"email_or_username": ...})` on failed login → PII; hash or omit. |
| AUD-B-605 | Low | `apps/trust_safety/tasks.py` 28–35 | User-supplied `report.description` interpolated into plaintext admin email → strip control chars / normalise newlines. |
| AUD-B-606 | Low | `apps/notifications/tasks.py` | HTML email f-strings with `book_title`, usernames → escape or use template autoescape consistently. |
| AUD-B-607 | Med | `apps/books/views.py` `NearbyCountView`, `CommunityStatsView` | Public `AllowAny` + GIS aggregates with default DRF throttles → add a stricter dedicated throttle. |

### 1.7 Performance

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-701 | High | `bookswap/views.py` `SetLocationView` + `services.NominatimGeocodingService` | ✅ DONE (Sprint 3) — tight timeouts (3s forward / 2s reverse), 30d / 24h cache via `bookswap.external_http.cached_call`, and a cache-backed circuit breaker (5 fails → 60s open). |
| AUD-B-702 | High | `apps/books/views.py` `ISBNLookupView` / `ExternalSearchView` | ✅ DONE (Sprint 3) — 5s timeout, separate Open Library / Google Books circuit breakers, ISBN cached 7d (negative 6h), search cached 1h. |
| AUD-B-703 | Med | `apps/books/views.py` `BookPhotoViewSet.create` | Pillow resize in-request → optional Celery for large media policies. |
| AUD-B-704 | Med | `bookswap/views.py` `DataExportView` 223–228 + `services.build_data_export` | ✅ DONE (Sprint 3) — POST/GET enqueues `bookswap.send_data_export_email` Celery task; endpoint now returns 202 immediately and the JSON ships as an email attachment. Web + mobile clients updated. |
| AUD-B-705 | Med | `apps/books/views.py` `CommunityStatsView` | ✅ DONE (Sprint 3) — payload cached 5 min per (lat 2dp, lng 2dp, 1km-radius bucket); invalid input still rejected before any cache lookup. |
| AUD-B-706 | Low | `apps/exchanges/views.py` `get_queryset` 64–98 | Heavy annotations in list view → list/detail serializer split. |
| AUD-B-707 | Low | `apps/books/views.py` 153–161 | `Book.objects.get(pk=…)` without `select_related`; `book.photos.count()` extra COUNT. |

### 1.8 Settings / config drift

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-B-801 | High | `config/settings/base.py` 22–27, 35 | `SECRET_KEY` env has a non-empty default → fail fast in prod or require explicit `SECRET_KEY` when `DEBUG=False`. |
| AUD-B-802 | Med | `config/settings/base.py` 135–140 | `DATABASE_URL` default embeds local creds/db → empty default + fail in prod. |
| AUD-B-803 | Low | `config/settings/base.py` 92, 263 | `FRONTEND_URL` assigned twice — desync risk → single assignment. |
| AUD-B-804 | Nit | `config/celery.py` 8 vs `config/asgi.py` 6 | Celery defaults to `development`, ASGI defaults to `production` → document. |
| AUD-B-805 | Nit | `config/settings/development.py` 16 | Overrides SendGrid backend → document that dev never hits SendGrid. |

### 1.9 Notable

- **`apps/profiles/`** is **NOT vestigial**: `NIMOH_BASE["PROFILE_MODEL"] = "profiles.UserProfile"` (`base.py:74`) — required by nimoh-base. Most profile data still lives on `bookswap.User` by design.
- `apps/books/views_og.py:33` hard-codes `https://book-swaps.com` for OG canonical → use settings/env. (`AUD-B-901 [Low]`)

---

## 2. Web Frontend — `AUD-W-NNN`

### 2.1 Dead code / orphans

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-001 | High | `frontend/auth-app/` (300 KB) | Orphan AI-Studio prototype (`react-example`, `@google/genai`, `express`) — never imported by main app → delete. |
| AUD-W-002 | Med | `frontend/src/components/common/PrefetchLink/PrefetchLink.tsx` | Only referenced from its own test → wire into nav links or remove. |
| AUD-W-003 | Med | `routes/config/routeChunkMap.ts` | Maps `PATHS.COMPONENTS_DEMO` for prefetch even though the route is dev-only-registered → guard. |
| AUD-W-004 | Med | `pages/ComponentsDemoPage/` chunk (482 LoC) | Lazy chunk still in production bundle even though route is dev-only → exclude from prod build (e.g. `if (DEV) lazy(...)`). |
| AUD-W-005 | Low | `pages/index.ts` | Only barrels 3 of 11 pages — partial barrel → barrel all or document. |
| AUD-W-006 | Low | `e2e/smoke.spec.ts` | Tests `/en/components` (dev-only route) → would fail against `vite preview` prod build. |
| AUD-W-007 | Nit | `public/locales/**` | Unused English keys not measured (no script) → add CI check (i18next-parser). |

### 2.2 Incomplete features / stubs

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-101 | Med | `features/auth/components/LoginForm/LoginForm.tsx` | Apple CTA gated `import.meta.env.DEV` with title `auth.appleComingSoon` → product call: hide in prod or implement. |
| AUD-W-102 | Low | `features/discovery/components/SwapFlowModal/SwapFlowModal.tsx` | Hard-coded English ("Personal Note (Optional)", "Estimated Shipping / Meetup", "Swap Protection", "Local Pickup", "Active") → i18n + final copy. |

### 2.3 UX / UI polish

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-201 | Med | `pages/HomePage/HomePage.tsx` | `useBooks` `isLoading` handled, no `isError` → add error + retry UI. |
| AUD-W-202 | Med | `pages/BrowsePage/BrowsePage.tsx` (landing) | Same pattern — no `isError` for `useBooks` / `useMapBooks` → add error UI. |
| AUD-W-203 | Low | `routes/config/routesConfig.tsx` `PageLoader` vs feature loaders | Section loaders mix `BrandedLoader` with raw spinners / nothing → align across feature pages. |
| AUD-W-204 | Low | `components/layout/Header/Header.tsx:78` | `aria-label="Main navigation"` hard-coded English; `navigation.mainLabel` exists → use `t()`. |
| AUD-W-205 | Nit | `features/books/components/BookCard/BookCard.tsx` | `<img loading="lazy">` without `width`/`height` — CLS risk → set dimensions / aspect-ratio. |

### 2.4 i18n drift (web)

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-301 | Low | `public/locales/{fr,nl}/translation.json` | **Only 1 missing key**: `navigation.exchanges` (present in en, missing in fr/nl) → add the key in fr.json and nl.json. |
| AUD-W-302 | Nit | All 6 namespaces | No CI check that fails on key drift → add a `i18n:check` script. |

> *Computed*: en=262/78/29/28/14/71 = 482; fr/nl differ only by 1 (`navigation.exchanges`). All other namespaces are perfectly synced.

### 2.5 Code quality

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-401 | High | `hooks/useUserCity.ts` | Direct `fetch` to `ipapi.co` and Nominatim — bypasses `services/http.ts` → centralise. |
| AUD-W-402 | Med | `features/discovery/components/SwapFlowModal/SwapFlowModal.tsx` (550 LoC) | God-component (multi-step + data + copy) → split steps into subcomponents + hooks. |
| AUD-W-403 | Med | `pages/CommunityPage/CommunityPage.tsx` (527 LoC) | God-component → decompose stats / lists / marketing sections. |
| AUD-W-404 | Med | `pages/MapPage/SidePanel.tsx` (568 LoC) | Recently extracted but still large → split filter-controls vs book list. |
| AUD-W-405 | Med | Two `BrowsePage` implementations | `pages/BrowsePage` (landing) vs `features/discovery/pages/BrowsePage` (catalogue) → rename to `BrowseLandingPage` / `CataloguePage`. |
| AUD-W-406 | Low | `features/auth/interceptors/authInterceptors.ts` | `fetch` for token retry (intentional) → document as exception. |
| AUD-W-407 | Low | `features/books/components/BarcodeScanner/BarcodeScanner.tsx` | `(window as any).BarcodeDetector` → narrow with feature-detect helper. |
| AUD-W-408 | Low | Test layout | Mixed: co-located `*.test.tsx` and `__tests__/` directories — `frontend/AGENTS.md` prefers co-location → standardise. |
| AUD-W-409 | Nit | Whole codebase | No `React.memo` usage in `src/` (grep) → not always needed but consider for `BookCard` in large grids. |

### 2.6 Performance

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-W-501 | Med | `features/ratings/components/RatingsList/RatingsList.tsx` | Maps `data.results` with no virtualization → window when N is large. |
| AUD-W-502 | Med | `features/discovery/components/MapView/MapView.tsx` (and `MapPage`) | Many markers without clustering → cluster or cap when > N. |
| AUD-W-503 | Low | `lucide-react` | Per-icon imports (good); no `import *` found. |

### 2.7 Test gaps (web)

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-W-601 | High | E2E for map | No Playwright spec for `/en/map` → add smoke (loads, basic interaction). |
| AUD-W-602 | High | Page tests | Only 5 page-level test files; ~22 pages have **no** tests, including `BookDetailPage`, `ExchangeDetailPage`, `MapPage`, `BrowsePage` (catalogue), `MyShelfPage`, `EditBookPage`, `AddBookPage`, `EditProfilePage`, `PublicProfilePage`, `SettingsPage`, all legal pages, `CommunityPage`, `HowItWorksPage`. |
| AUD-W-603 | Med | `features/exchanges` | `ExchangeDetailPage` has no dedicated test (covered indirectly by `exchanges.test.tsx`). |

---

## 3. Mobile — `AUD-M-NNN`

### 3.1 Dead code

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-001 | Med | `package.json` | `expo-blur` listed but not imported anywhere in `mobile/src` → remove dep. |
| AUD-M-002 | Low | `i18n/locales/{en,fr,nl}.json` | `profile.public.comingSoon` present in all 3 but never referenced via `t()` → delete keys. |
| AUD-M-003 | Nit | `package.json` | `react-native-nitro-modules` likely peer of MMKV — keep unless verified dropable. |

### 3.2 Incomplete features

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-101 | High | `features/profile/screens/UserProfileScreen.tsx` + `i18n/locales/*.json` | Block flow uses `t('profile.public.blockTitle' \| 'blockMessage' \| ...)` but those keys are NOT in JSON → fr/nl users see English `defaultValue`. Add the missing keys. |
| AUD-M-102 | High | `features/exchanges/hooks/useExchanges.ts` | Offline queue covers create/accept/decline/cancel; `useCounterExchange`, `useApproveCounter`, `useAcceptConditions`, `useConfirmSwap` have **no offline branch** → add `enqueueMutation` for these. |
| AUD-M-103 | High | `hooks/useMessages.ts` | Offline queue only handles text messages — image sends require network → silent gap. |
| AUD-M-104 | Low | `features/books/screens/BrowseMapScreen.tsx` | `any` for optional native `react-native-maps`/`supercluster` dynamic requires → strict types. |
| AUD-M-105 | Low | `features/messaging/screens/ChatScreen.tsx` ~108 | `eslint-disable-line` on `useEffect` deps → review for subscription bugs. |

### 3.3 UX / UI polish

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-201 | High | `navigation/stacks/HomeStack.tsx` | Header title hard-coded `"Hi, {name}"` (not `t()`) → use i18n. |
| AUD-M-202 | Med | `navigation/MainTabs.tsx` + `components/FloatingTabBar.tsx` | `ProfileTab` has `tabBarButton: () => null` AND `FloatingTabBar` hides profile too → profile only reachable via other entry points. Document or unify. |
| AUD-M-203 | Med | Loader inconsistency | `SettingsScreen`, `BookDetailScreen`, `OnboardingScreen`, many sheets/buttons still use raw `ActivityIndicator` → migrate to `BrandedLoader` where appropriate. |
| AUD-M-204 | Low | `features/books/screens/BookSearchScreen.tsx` | No `RefreshControl` on results — inconsistent with other lists → add pull-to-refresh. |
| AUD-M-205 | Low | `navigation/headerOptions.tsx` + multiple screens | `useNavigation<any>()` → use typed `CompositeNavigationProp`. |
| AUD-M-206 | Low | `lib/haptics.ts` callers | Only 5 places use haptics; primary actions (send swap, accept, save) feel flat → expand vocabulary. |
| AUD-M-207 | Low | `components/FloatingTabBar.tsx` | Custom animated tab bar — full a11y audit needed (`accessibilityState`, names, tab order). |

### 3.4 i18n drift (mobile)

> **All three locales perfectly aligned**: en/fr/nl each have 708 keys, 0 missing, 0 extra.

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-301 | Med | `blocks.unblockTitle` | en: `"Unblock {{name}}?"`, fr: `"Débloquer l'utilisateur"`, nl: `"Gebruiker deblokkeren"` — **interpolation dropped** in fr/nl → restore `{{name}}`. |
| AUD-M-302 | High | `profile.public.*` (block flow) | Keys referenced in code but not in any locale → see AUD-M-101. |

### 3.5 Code quality / oversized files

| ID | Sev | File | LoC | Issue → Fix |
|---|---|---|---:|---|
| AUD-M-401 | High | `features/profile/screens/SettingsScreen.tsx` | 1071 | Split into settings sections + location sheets + account-deletion. |
| AUD-M-402 | High | `features/books/screens/BookDetailScreen.tsx` | 995 | Split presentation vs logic (extract hooks + subcomponents). |
| AUD-M-403 | High | `features/books/screens/BrowseMapScreen.tsx` | 954 | Extract clustering, sheet list, map placeholder. |
| AUD-M-404 | Med | `features/profile/screens/EditProfileScreen.tsx` | 785 | Split form sections + media handling. |
| AUD-M-405 | Med | `features/books/screens/EditBookScreen.tsx` / `AddBookScreen.tsx` | 646 / 630 | Extract photo manager usage + form blocks. |
| AUD-M-406 | Med | `components/FloatingTabBar.tsx` | ~340 | Split `computeVisibility` + indicator logic. |
| AUD-M-407 | Med | Mobile typing | — | `useNavigation<any>()`, `BrowseMapScreen` `any` escapes — tighten types. |
| AUD-M-408 | Med | `services/websocket.ts` | — | Token refresh uses raw `axios.post` to `env.apiUrl` (not `http` service) → unify HTTP layer. |

### 3.6 Performance

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-501 | Med | `features/messaging/screens/ChatScreen.tsx` | Verify `renderItem` `useCallback` + stable `extraData` so chat list doesn't over-render (only `MessageBubble` is memo'd). |
| AUD-M-502 | Low | `features/books/screens/BookDetailScreen.tsx` | Horizontal `FlatList` for photos uses index keyExtractor + inline `renderItem` (minor, fixed gallery). |
| AUD-M-503 | Low | `features/books/screens/BrowseMapScreen.tsx` | `BottomSheetFlatList` — tune `windowSize`/`getItemLayout` for low-end devices. |

### 3.7 Mobile-specific concerns

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-M-601 | Med | `services/notificationHandler.ts` | Unlisted backend notification `type` strings no-op silently → keep types in sync with server payloads (consider switch-default warn). |
| AUD-M-602 | Med | `services/notificationHandler.ts` | `book_available` / `wishlist_match` always navigate to `HomeTab → BookDetail`; users on `BrowseTab` get context-switched → product review. |
| AUD-M-603 | High | Offline queue | (See AUD-M-102, AUD-M-103) Partial coverage = inconsistent UX. |
| AUD-M-604 | Med | `services/WebSocketGate.tsx` + `useChatWebSocket.ts` | Single `wsManager` shared; chat overrides path — verify edge cases when switching chat ↔ notifications. |
| AUD-M-605 | Low | `lib/sentry.ts` | `beforeSend` scrubs auth; no explicit `onUnhandledrejection` — verify default behaviour in installed `@sentry/react-native`. |
| AUD-M-606 | Low | `services/pushNotifications.ts` | `console.warn` for simulator (dev noise only). |

### 3.8 Test gaps (mobile)

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-M-701 | High | Maestro flows | Only `01-login`, `02-browse`, `03-book-detail`, `04-notifications`, `05-profile-settings` — **no** sign-up, password reset, email verify, chat, swap → add at least one happy-path Maestro per critical flow. |
| AUD-M-702 | High | Screen tests | Most `__tests__/` cover services + a couple of components; **no** screen tests for `ChatScreen`, `ExchangeDetail`, swap flows. |
| AUD-M-703 | Med | `services/notificationHandler` | No tests for navigation routing on tap. |

---

## 4. Cross-cutting / Parity — `AUD-X-NNN`

### 4.1 Shared package usage (the big one)

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-X-001 | High | `packages/shared` adoption | **Web frontend imports from `@shared/*` in 0 files**; mobile imports it from only 2 files (`mobile/src/types/index.ts` re-export hub + `features/exchanges/constants.ts`). The package contains 30+ types, schemas (Zod), and constants meant to be the source of truth. → Migrate web to import types/schemas/constants from `@shared/*` (planned migration path: types first, then constants, then schemas). |

### 4.2 Web ↔ Mobile parity

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-X-101 | Med | **Mobile-only screens not on web**: `AboutScreen`, `AppearanceScreen`, `LanguageScreen` | Decide whether the web should expose About / Appearance / Language settings or whether these are intentionally mobile-only. |
| AUD-X-102 | Med | **Web-only pages not on mobile**: `CommunityPage`, `HowItWorksPage` (both substantive marketing/landing pages) | Determine if mobile users should access via in-app webview or native screens. Currently mobile users have no equivalent. |
| AUD-X-103 | Low | `AccountDeletionPage`, `PrivacyPolicyPage`, `TermsOfServicePage` are web-only | Mobile shows these via in-app links to web — verify the UX is acceptable for app-store reviewers (they typically want native legal pages). |
| AUD-X-104 | Low | `ComponentsDemoPage` web-only (dev) | Intentional. |

### 4.3 Documentation drift

| ID | Sev | File | Issue → Fix |
|---|---|---|---|
| AUD-X-201 | High | `AGENTS.md` 24, 25, 33 | Says "future mobile app" (mobile is built); says "Leaflet for maps" (we migrated to Google Maps); references `docs/speaklinka-comparison-gap-analysis.md` which doesn't exist → update. |
| AUD-X-202 | Med | `frontend/AGENTS.md` | Still the upstream TAST template (mentions packages/, Storybook) — does not describe BookSwap-specific PRDs → add BookSwap context. |
| AUD-X-203 | Med | Stale audit files | `docs/gap-analysis/`, `docs/adversarial-review/`, `docs/mobile-production-readiness-2026-04-21.md`, `app-audit.md` — ensure contributors know which is current. → Add an `INDEX.md` in `docs/` listing active vs archived docs. |
| AUD-X-204 | Low | `docs/action-plan-epic-9.md` | 6 TODO/FIXME markers in a doc → action items still open. |
| AUD-X-205 | Low | `docs/gap-analysis.md` | 2 TODO markers — open items. |

### 4.4 Test infrastructure parity

| ID | Sev | Area | Issue → Fix |
|---|---|---|---|
| AUD-X-301 | High | (See AUD-W-602 + AUD-M-701, AUD-M-702) | Both clients are thin on critical-flow tests; coordinate one parity-aware test plan. |

---

## 5. Suggested next-step ordering

**Sprint 1 — quick wins & safety (1–2 days)**
1. AUD-W-001 — Delete `frontend/auth-app/` (300 KB, no risk).
2. AUD-W-301 — Add the single missing `navigation.exchanges` key to `fr.json` and `nl.json`.
3. AUD-M-301 — Restore `{{name}}` interpolation in mobile `blocks.unblockTitle` for fr/nl.
4. AUD-M-101 / AUD-M-302 — Add the missing `profile.public.*` block-flow keys to all three mobile locales.
5. AUD-M-001 — Remove unused `expo-blur` dep.
6. AUD-M-002 — Delete dead `profile.public.comingSoon` keys.
7. AUD-X-201 — Update `AGENTS.md` (mobile is built, Google Maps, fix dead doc reference).
8. AUD-B-101 — Delete `bookswap/consumers.ExampleConsumer`.
9. AUD-W-003 / AUD-W-004 — Guard `ComponentsDemoPage` chunk + prefetch entry behind `import.meta.env.DEV`.

**Sprint 2 — pagination & secrets (2–3 days)**
10. AUD-B-401 → AUD-B-405 — Add `pagination_class` to all unbounded list endpoints; add cap.
11. AUD-B-801, AUD-B-802 — Fail fast on missing `SECRET_KEY` / `DATABASE_URL` in production settings.
12. AUD-B-601 — Enforce `profile_public` filter in `UserPublicSerializer.get_queryset`.
13. AUD-B-603 / AUD-B-604 — Stop logging email addresses at INFO/ERROR.

**Sprint 3 — async hot paths (3–5 days)**
14. AUD-B-701 — ✅ DONE — Tight timeout + cache + circuit breaker for `SetLocationView` / Nominatim.
15. AUD-B-702 — ✅ DONE — Same for `ISBNLookupView`, `ExternalSearchView`.
16. AUD-B-704 — ✅ DONE — `DataExportView` now enqueues a Celery job and emails the JSON.
17. AUD-B-705 — ✅ DONE — `CommunityStatsView` cached per (lat, lng, radius) bucket.

**Sprint 4 — mobile offline gaps & UX consistency (3–5 days)**
18. AUD-M-102 — ✅ DONE — `useCounterExchange`, `useApproveCounter`, `useAcceptConditions`, `useConfirmSwap` now mirror the offline-queue pattern used by create/accept/decline/cancel.
19. AUD-M-103 — ✅ DONE — Offline queue grew a `QueuedImageAttachment` descriptor; `useSendMessage` queues image-bearing messages and the drainer rebuilds `FormData` at send time.
20. AUD-M-203 — ✅ DONE — Section-level loader in `MeetupSuggestionPanel` migrated to `BrandedLoader`. Remaining `ActivityIndicator` instances are inline button spinners (small, in-Pressable, action-state) where `BrandedLoader` would be visually wrong.
21. AUD-M-201 — ✅ DONE — `HomeStack` header title now uses `t('home.greeting', { name })` with a fallback to `home.greetingDefault`.
22. AUD-W-201, AUD-W-202 — ✅ DONE — `HomePage` and `BrowsePage` now render explicit error banners with retry buttons when `useBooks` / `useMapBooks` fail instead of leaving sections blank.

**Sprint 5 — refactors & shared package (1–2 weeks, can parallelise)**
23. AUD-X-001 — ✅ DONE — Web frontend now imports books / exchange / messaging / notification / profile / discovery / rating / trust-safety types from `@shared/*` (book/exchange types extended with reorder + filter extras to match what the FE was already consuming).
24. AUD-M-401 → AUD-M-405 — ✅ DONE — Oversized mobile screens decomposed:
    - **AUD-M-401** `SettingsScreen` (1071 → 156 LoC) split into `components/settings/*` sections + `useProfileVisibility` / `useSearchRadius` / `useLocationManager` hooks.
    - **AUD-M-402** `BookDetailScreen` (995 → ~280 LoC) split into `components/detail/*` (CoverGallery, MetaPills, OwnerStrip, etc.) + `useWishlistToggle` hook.
    - **AUD-M-403** `BrowseMapScreen` (954 → ~330 LoC) split into `components/browse-map/*` (MapSearchBar, MapFilters, MapControls, BookListItem, mapsLoader) + `useUserLocation` / `useMapClusters` hooks.
    - **AUD-M-404** `EditProfileScreen` (785 → 221 LoC) split into `components/edit-profile/*` (AvatarPickerSection, BasicInfoFields, GenresField, PreferencePickers, SubmitButton, UsernameField) + `useAvatarPicker` hook.
    - **AUD-M-405** `AddBookScreen` / `EditBookScreen` (630 / 646 LoC) now share a `components/book-form/*` package (CoverHeader, ChipPicker, GenreGrid, SectionLabel, styles, constants) — eliminates the duplicated chip/genre/condition/language/swap-type rendering across the two screens.
25. AUD-B-301 → AUD-B-303 — ✅ DONE — Oversized backend modules split into packages with `__init__.py` re-exports preserving the public API (and Celery task names): `bookswap/views.py` → `bookswap/views/{users,account,auth,social_auth,devices}.py`; `apps/books/views.py` → `apps/books/views/{crud,photos,lookups,wishlist,discovery,stats,_helpers}.py`; `apps/notifications/tasks.py` → `apps/notifications/tasks/{exchange,messaging,ratings,account,_helpers}.py`.
26. AUD-W-402 → AUD-W-405 — ✅ DONE — Web: `SwapFlowModal` split into per-step subcomponents + step hooks; `CommunityPage` decomposed into stats / lists / marketing sections; `MapPage` `SidePanel` split into filter-controls + book-list; duplicate `BrowsePage` resolved (`/browse` landing → `BrowseLandingPage`, `/catalogue` → `CataloguePage`).

**Sprint 6 — test coverage on critical flows (ongoing)**
27. AUD-M-701 — Add Maestro flows for sign-up / password-reset / email-verify / chat / swap.
28. AUD-W-601 — Playwright spec for `/map`.
29. AUD-W-602 — Vitest for `BookDetailPage`, `ExchangeDetailPage`, `MapPage`, `SettingsPage`, `MyShelfPage`.
30. AUD-M-702 — Screen tests for `ChatScreen` + swap flows.

---

## 6. Notes on what was NOT in scope

- Re-running the security/adversarial deep audit (see `security-action-plan.md`, `docs/adversarial-review/`).
- Infrastructure / Docker / CI tuning (recently iterated on).
- Dynamic / runtime profiling (this is a static review).
- Bundle size analysis with actual numbers (recommended: `vite-bundle-visualizer` follow-up).
- A full `i18next-parser` extraction to enumerate every unused English key (recommended follow-up — easy to add as a CI gate).

---

*Generated by deep-audit on 2026-04-24. Each finding has a stable ID; an implement-skill could pick them up in priority order.*
