# Action Plan — Epic 1: Onboarding & Authentication

> Generated: 2026-03-21
> First epic in dependency order — all other epics depend on auth + location.

---

## 1. Story Status Overview — All Epics

### Epic 1: Onboarding & Authentication

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-101 | Landing Page Value Proposition | P0 | ❌ Pending | HomePage is a design-system demo (surfaces/typography), not a product landing page |
| US-102 | Email Registration | P0 | ⚠️ Partial | Phase 1 done: User model has `date_of_birth` field for age gate + domain fields. Still missing: DOB in RegisterForm, email verification UI, password validation rules per spec |
| US-103 | OAuth Login (Google & Apple) | P0 | ❌ Pending | No OAuth integration on frontend or backend. nimoh-base supports python-social-auth but not configured |
| US-104 | Secure Login | P0 | ⚠️ Partial | Phase 1 done: User model has `auth_provider` field for OAuth detection. Still missing: rate limiting (5 attempts / 10 min lockout), OAuth-only account detection logic |
| US-105 | Onboarding — Location Setup | P0 | ⚠️ Partial | Phase 1 done: PostGIS enabled, PointField(srid=4326) + neighborhood + preferred_radius + onboarding_completed on User model, GiST index. Still missing: onboarding flow UI, geocoding integration, API endpoints |
| US-106 | Password Reset | P1 | ⚠️ Partial | Frontend has ForgotPasswordPage + apiEndpoints for reset/confirm. Backend nimoh-base has endpoints. Missing: password-reset-confirm page component, session invalidation on reset |

### Epic 2: User Profile

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-201 | Create & Edit Profile | P0 | ⚠️ Partial | Phase 1 done: User model now has bio, avatar, preferred_genres, preferred_language, avg_rating, swap_count, rating_count fields. Still missing: profile pages, serializers, API endpoints |
| US-202 | View Another User's Profile | P0 | ❌ Pending | No public profile page or API endpoint |
| US-203 | Account Deletion (GDPR) | P1 | ❌ Pending | No deletion flow, no soft-delete, no anonymization pipeline |

### Epic 3: Book Listing & Management

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-301 | Add Book via ISBN Scan | P0 | ❌ Pending | No Book model, no ISBN integration, no barcode scanning |
| US-302 | Add Book via Manual Search | P0 | ❌ Pending | No search UI or Open Library API integration |
| US-303 | Upload Book Photos | P0 | ❌ Pending | No image upload pipeline |
| US-304 | Set Book Condition & Details | P0 | ❌ Pending | No condition enum, genre list, or language fields |
| US-305 | My Shelf Dashboard | P0 | ❌ Pending | No shelf page or book listing UI |
| US-306 | Wishlist — "Looking For" | P1 | ❌ Pending | No wishlist model or UI |

### Epic 4: Discovery & Search

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-401 | Browse Nearby Books | P0 | ❌ Pending | No spatial query, no browse feed |
| US-402 | Distance Filter | P0 | ❌ Pending | No filter UI or preference storage |
| US-403 | Search by Title/Author/ISBN | P0 | ❌ Pending | No full-text search setup |
| US-404 | Filter by Genre/Language/Condition | P0 | ❌ Pending | No filter components |
| US-405 | Map View | P1 | ❌ Pending | No Leaflet integration |

### Epic 5: Exchange Flow (Book Partner System)

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-501 | Send Book Partner Request | P0 | ❌ Pending | No exchange_requests model |
| US-502 | Review & Respond to Request | P0 | ❌ Pending | No review UI |
| US-503 | Accept Exchange Conditions | P0 | ❌ Pending | No conditions flow |
| US-504 | Confirm Exchange Completion | P0 | ❌ Pending | No confirmation flow |
| US-505 | Book Return Flow | P1 | ❌ Pending | No return flow |

### Epic 6: Messaging

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-601 | In-App Chat | P0 | ❌ Pending | ExampleConsumer is a WebSocket echo stub. MVP uses async REST messaging, not WebSocket |
| US-602 | Safe Meetup Location Suggestions | P1 | ❌ Pending | No meetup locations data |

### Epic 7: Ratings & Reviews

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-701 | Rate Your Swap Partner | P0 | ❌ Pending | No ratings model or UI |

### Epic 8: Trust & Safety

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-801 | Block User | P0 | ❌ Pending | No blocks model |
| US-802 | Report User or Listing | P0 | ❌ Pending | No reports model |
| US-803 | Email Verification Gate | P0 | ❌ Pending | No gating logic on frontend or backend |
| US-804 | GDPR Privacy Compliance | P0 | ❌ Pending | No privacy policy page, cookie consent, DPIA |

### Epic 9: Notifications

| ID | Title | Priority | Status | Notes |
|----|-------|----------|--------|-------|
| US-901 | Email Notifications | P0 | ❌ Pending | No notification Celery tasks, no templates |
| US-902 | In-App Notification Bell | P1 | ❌ Pending | No notifications model or UI |

### Summary

| Status | Count |
|--------|-------|
| ✅ Implemented | 0 |
| ⚠️ Partial | 5 (US-102, US-104, US-105, US-106, US-201) |
| ❌ Pending | 25 |
| **Total** | **30** |

**Legend**: ✅ Implemented · ⚠️ Partial · ❌ Pending

---

## 2. Gaps in Previously Implemented Stories

### Gap: [US-102] — Registration missing age gate and email verification UI

- **AC not met**: AC requiring DOB field for 16+ age gate (PRD Q5 resolved decision), AC for email verification link handling and "resend" button UX
- **Evidence**: `frontend/src/features/auth/components/RegisterForm/` exists but the form fields only include email/password/display_name. No DOB input. No email verification landing page. Backend nimoh-base provides `/api/v1/auth/email/verify/` and `/api/v1/auth/email/resend/` endpoints (referenced in `apiEndpoints.ts`) but no frontend pages consume them.
- **Fix needed**: Add DOB field to RegisterForm with under-16 rejection, build EmailVerificationPage that handles the verification link, add "Resend" button to login gate for unverified users.

### Gap: [US-104] — Login missing rate limiting and OAuth-only detection

- **AC not met**: AC4 — "After 5 failed attempts from the same IP within 10 min: temporary lockout (15 min)" and edge case "User tries to log in with email that only has OAuth → show message"
- **Evidence**: No rate-limiting middleware configured in `backend/config/settings/base.py`. Login service in `auth.service.ts` has no error handling for 429 status. No OAuth provider check logic.
- **Fix needed**: Add django-axes or nimoh-base rate limiting for login. Add frontend handling for 429 lockout response. OAuth detection depends on US-103 being implemented first.

### Gap: [US-106] — Password reset confirm page missing

- **AC not met**: AC4 — "Reset link opens a form to enter a new password"
- **Evidence**: `PATHS.PASSWORD_RESET_CONFIRM` is defined in `paths.ts` but no corresponding page component or route exists in `routesConfig.tsx`. API endpoint `API.auth.passwordResetConfirm` is defined but unused.
- **Fix needed**: Create PasswordResetConfirmPage component and register route at `/password-reset/confirm`.

### ~~Gap: [CRITICAL CONFIG] — AUTH_USER_MODEL misconfigured~~ ✅ RESOLVED

- **Resolved in**: Phase 1 commit `881c9c0` on `feat/epic-1-phase-1-data-layer`
- **Fix applied**: Changed `AUTH_USER_MODEL = 'bookswap.User'` in base.py. Migration reset performed before first migration.

---

## 3. Implementation Plan — Epic 1: Onboarding & Authentication

### Context

Epic 1 is the absolute foundation — every other epic depends on users being able to register, log in, and set their location. The platform currently has scaffold-level auth (nimoh-base provides JWT endpoints, frontend has login/register pages), but zero domain logic. The User model has no BookSwap-specific fields, no PostGIS location support, no age gate, and no onboarding flow. This epic serves all personas (visitors, new users, returning users) and must be completed before any book-related features can be built.

### Stories Covered

- **US-101**: Landing Page Value Proposition (P0)
- **US-102**: Email Registration — gaps + completion (P0)
- **US-103**: OAuth Login — Google & Apple (P0)
- **US-104**: Secure Login — gaps + completion (P0)
- **US-105**: Onboarding — Location Setup (P0)
- **US-106**: Password Reset — gap fix (P1)

---

### Phase 1 — Data Layer ✅ COMPLETE

> **Completed**: 2026-03-21 · **Branch**: `feat/epic-1-phase-1-data-layer` · **Commit**: `881c9c0`
> **Tests**: 48 passing (pytest + factory_boy) · **Lint**: ruff clean

**Goal**: Extend the User model with all BookSwap-specific fields, enable PostGIS, and run migrations. This must happen first since everything else depends on the schema.

**Critical pre-requisite**: ~~Fix `AUTH_USER_MODEL` in `backend/config/settings/base.py` from `'nimoh_auth.User'` to `'bookswap.User'` BEFORE running any migrations.~~ ✅ Done

**Files to create / modify**:
- `backend/config/settings/base.py` — fix AUTH_USER_MODEL, add `django.contrib.gis` to INSTALLED_APPS, switch database engine to `django.contrib.gis.db.backends.postgis`
- `backend/bookswap/models.py` — extend User model with domain fields

**What to build**:

- **`User` model extensions** (on existing `bookswap.User`):
  - `date_of_birth` — `DateField(null=True, blank=True)` — for 16+ age gate (PRD Q5)
  - `bio` — `CharField(max_length=300, blank=True)` — profile bio
  - `avatar` — `ImageField(upload_to='avatars/', null=True, blank=True)` — profile photo
  - `location` — `PointField(srid=4326, null=True, blank=True)` — PostGIS exact location (snapped on read)
  - `neighborhood` — `CharField(max_length=100, blank=True)` — derived neighborhood name
  - `preferred_genres` — `ArrayField(CharField(max_length=50), size=5, default=list, blank=True)` — genre preferences
  - `preferred_language` — `CharField(max_length=20, default='en')` — English/Dutch/Both
  - `preferred_radius` — `IntegerField(default=5000)` — search radius in meters
  - `avg_rating` — `DecimalField(max_digits=3, decimal_places=2, default=0)` — computed avg
  - `swap_count` — `PositiveIntegerField(default=0)` — completed swap count
  - `rating_count` — `PositiveIntegerField(default=0)` — total ratings received
  - `coc_accepted_at` — `DateTimeField(null=True, blank=True)` — Community Code of Conduct acceptance
  - `coc_version` — `CharField(max_length=10, blank=True)` — CoC version accepted
  - `auth_provider` — `CharField(max_length=20, blank=True)` — 'email', 'google', 'apple' for analytics
  - `onboarding_completed` — `BooleanField(default=False)` — tracks whether location setup is done

**Database changes**:
- Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
- GiST index on `location` field (Django auto-creates via `PointField`)

**Acceptance criteria addressed**: US-105 AC3 (location as PostGIS point), US-201 AC1 (profile fields), US-102 edge case (age gate via DOB)

---

### Phase 2 — Backend API

**Goal**: Expose registration enhancements, profile CRUD, location setup, and OAuth endpoints through authenticated REST APIs.

**Files to create / modify**:
- `backend/bookswap/serializers.py` — create from scratch (currently does not exist)
- `backend/bookswap/views.py` — replace ExampleView with real viewsets/views
- `backend/bookswap/urls.py` — register routes
- `backend/bookswap/validators.py` — create: Dutch postcode validation, age validation
- `backend/config/settings/base.py` — add python-social-auth configuration for Google/Apple OAuth

**Endpoints to build**:

| Method | Path | Auth | Description | Story |
|--------|------|------|-------------|-------|
| PATCH | `/api/v1/users/me/` | IsAuthenticated | Update own profile (bio, avatar, genres, language) | US-201 |
| GET | `/api/v1/users/me/` | IsAuthenticated | Get own full profile | US-201 |
| GET | `/api/v1/users/{id}/` | IsAuthenticated | View another user's public profile | US-202 |
| POST | `/api/v1/users/me/location/` | IsAuthenticated | Set/update location (postcode or lat/lng) | US-105 |
| POST | `/api/v1/users/me/onboarding/complete/` | IsAuthenticated | Mark onboarding as complete | US-105 |
| POST | `/api/v1/auth/social/google/` | AllowAny | Google OAuth token exchange | US-103 |
| POST | `/api/v1/auth/social/apple/` | AllowAny | Apple OAuth token exchange | US-103 |

**Registration endpoint enhancements** (nimoh-base's `/api/v1/auth/register/`):
- Override register serializer to include `date_of_birth` field
- Add server-side age validation: reject if under 16 at registration time
- Store `auth_provider = 'email'` on register

**Location setup logic** (`POST /api/v1/users/me/location/`):
- Accept either: `{ postcode: "1012 AB" }` or `{ latitude: 52.37, longitude: 4.89 }`
- If postcode: validate Dutch format (`/^\d{4}\s?[A-Za-z]{2}$/`), geocode via Nominatim API → lat/lng
- Store exact point in `location` field
- Derive neighborhood name via Nominatim reverse geocoding
- Apply 500m grid snap on **read** (serializer), not on write (PRD: "grid-snap-on-read")

**Nimoh-stack conventions to follow**:
- UUID PKs (already from AbstractNimohUser), created_at/updated_at on every model
- `get_queryset()` scoped to `request.user` where applicable
- `permission_classes` declared explicitly on every view
- Split serializers: `UserPublicSerializer` (id, display_name, avatar, neighborhood, avg_rating, swap_count, member_since) from `UserPrivateSerializer` (full fields including location, email, DOB)
- Grid-snap helper: `snap_to_grid(point, cell_size=500)` utility that rounds coordinates

**Acceptance criteria addressed**: US-102 AC1–AC7, US-103 AC1–AC6, US-104 AC1–AC6, US-105 AC1–AC6, US-201 AC1–AC6

---

### Phase 3 — Frontend Services & Hooks

**Goal**: Wire the new API endpoints into the frontend data layer with TypeScript types, service wrappers, and TanStack Query hooks.

**Files to create**:
- `frontend/src/features/auth/types/auth.types.ts` — extend existing types with DOB, OAuth fields
- `frontend/src/features/profile/types/profile.types.ts` — User profile interfaces
- `frontend/src/features/profile/services/profileService.ts` — axios wrappers for profile + location APIs
- `frontend/src/features/profile/hooks/profileKeys.ts` — TanStack Query key factory
- `frontend/src/features/profile/hooks/useProfile.ts` — query hook for own profile
- `frontend/src/features/profile/hooks/usePublicProfile.ts` — query hook for other user's profile
- `frontend/src/features/profile/hooks/useUpdateProfile.ts` — mutation hook
- `frontend/src/features/profile/hooks/useSetLocation.ts` — mutation hook for location setup
- `frontend/src/features/profile/schemas/profileSchema.ts` — Zod validation schemas (display name, bio, DOB)
- `frontend/src/features/onboarding/types/onboarding.types.ts` — location setup types
- `frontend/src/features/onboarding/services/onboardingService.ts` — service for location/onboarding endpoints
- `frontend/src/features/onboarding/hooks/useOnboarding.ts` — hook to manage onboarding state
- `frontend/src/features/onboarding/schemas/locationSchema.ts` — Zod schema for Dutch postcode + lat/lng

**API endpoint additions** to `frontend/src/configs/apiEndpoints.ts`:
```typescript
const USERS = `${V1}/users` as const;
// ...
users: {
  me: `${USERS}/me/`,
  meLocation: `${USERS}/me/location/`,
  meOnboardingComplete: `${USERS}/me/onboarding/complete/`,
  detail: (id: string) => `${USERS}/${id}/`,
},
```

**Nimoh-stack conventions to follow**:
- `credentials: 'include'` on the API client (already set in `http.ts`)
- Key factory pattern: `profileKeys.all()`, `.me()`, `.detail(id)`
- No access token in localStorage — Zustand memory store for auth (already in place)
- Zod schemas for all form validation (registration, profile edit, location setup)

**Acceptance criteria addressed**: US-102 (registration form validation), US-105 (location input), US-201 (profile CRUD)

---

### Phase 4 — Frontend UI

**Goal**: Build the landing page, enhance registration, create onboarding flow, and add profile pages.

**Files to create / modify**:

#### 4a. Landing Page (US-101)
- `frontend/src/pages/LandingPage/LandingPage.tsx` — hero section, "How It Works" 3-step, CTA, sample book count
- `frontend/src/pages/LandingPage/LandingPage.module.scss` — styling
- `frontend/src/pages/LandingPage/components/HeroSection.tsx` — above-the-fold with headline + CTA
- `frontend/src/pages/LandingPage/components/HowItWorks.tsx` — List → Match → Swap visual steps
- Modify `frontend/src/pages/HomePage/HomePage.tsx` — replace design-system demo with actual landing page, or swap route to use LandingPage

#### 4b. Registration Enhancements (US-102)
- Modify `frontend/src/features/auth/components/RegisterForm/` — add DOB field with under-16 rejection
- `frontend/src/features/auth/pages/EmailVerificationPage.tsx` — handles verification link clicks
- `frontend/src/features/auth/pages/EmailVerificationPendingPage.tsx` — "Check your email" screen with resend button

#### 4c. OAuth (US-103)
- Modify `frontend/src/features/auth/components/LoginForm/` — add "Continue with Google" and "Continue with Apple" buttons
- Modify `frontend/src/features/auth/components/RegisterForm/` — add OAuth buttons
- `frontend/src/features/auth/services/oauth.service.ts` — Google/Apple OAuth flow handlers

#### 4d. Onboarding (US-105)
- `frontend/src/features/onboarding/pages/OnboardingPage.tsx` — location setup screen
- `frontend/src/features/onboarding/components/LocationSetup.tsx` — postcode input, map pin, browser geolocation
- `frontend/src/features/onboarding/components/PostcodeInput.tsx` — Dutch postcode input with validation
- `frontend/src/features/onboarding/components/LocationMap.tsx` — Leaflet map with draggable pin
- `frontend/src/features/onboarding/i18n/en.json` — English strings
- `frontend/src/features/onboarding/i18n/fr.json` — French strings (or Dutch — `nl.json`)

#### 4e. Password Reset Confirm (US-106 gap fix)
- `frontend/src/features/auth/pages/PasswordResetConfirmPage.tsx` — new password form from reset link

**Routes to register** in `frontend/src/routes/config/routesConfig.tsx` and `paths.ts`:
- `/` → `LandingPage` (public, replaces current HomePage design demo)
- `/onboarding` → `OnboardingPage` (protected, shown after first login)
- `/email/verify` → `EmailVerificationPage` (public)
- `/email/verify/pending` → `EmailVerificationPendingPage` (public)
- `/password-reset/confirm` → `PasswordResetConfirmPage` (public)

**UX notes** (from user stories):
- US-101: Page must load < 2s on 4G. "How It Works" = List → Match → Swap. Show "X books available near you" if location available (IP geolocation or prompt)
- US-102: DOB field → "Sorry, you must be 16 or older to use BookSwap" for under-16. Email verification screen with "Resend" button (rate limited to 3/hr)
- US-103: OAuth buttons follow Google/Apple brand guidelines. On first OAuth login → redirect to onboarding
- US-105: Three location input modes: postcode, dropdown, map pin. "Use my current location" shortcut. Skip option with persistent prompt. Dutch postcode format: `1234 AB`
- US-106: Reset link is single-use. New password form has same validation as registration

**Acceptance criteria addressed**: US-101 AC1–AC6, US-102 AC1–AC7, US-103 AC1–AC6, US-104 AC1–AC6, US-105 AC1–AC6, US-106 AC1–AC6

---

### Phase 5 — Integration & Acceptance Criteria Check

**Goal**: Connect everything end-to-end and verify every AC is met.

**Tasks**:
- [ ] Fix AUTH_USER_MODEL in `config/settings/base.py` → `'bookswap.User'`
- [ ] Enable PostGIS: add `django.contrib.gis` to INSTALLED_APPS, switch DB engine to `django.contrib.gis.db.backends.postgis`
- [ ] Run `makemigrations` and `migrate` for User model extensions
- [ ] Register new URLs in `backend/bookswap/urls.py`
- [ ] Configure python-social-auth in settings for Google OAuth
- [ ] Add Celery task for email verification reminders
- [ ] Add MSW handlers in `frontend/src/test/` (or `mocks/handlers/`) for new endpoints: `/users/me/`, `/users/me/location/`, `/users/{id}/`
- [ ] Write pytest tests: registration with DOB validation, location setup with geocoding, profile CRUD
- [ ] Write Vitest tests: RegisterForm DOB field, OnboardingPage location flow, LandingPage render
- [ ] Verify all translations are in both `en.json` and `nl.json`
- [ ] Install frontend dependencies: `leaflet`, `react-leaflet`, `@types/leaflet` for map component

**Acceptance Criteria Checklist**:

| ID | Acceptance Criterion | Covered in Phase |
|----|---------------------|-----------------|
| US-101 AC1 | Landing page loads < 2s on 4G | Phase 4a (static content, code-split) |
| US-101 AC2 | Above-fold: headline, value prop, CTA | Phase 4a (HeroSection) |
| US-101 AC3 | "How It Works" 3-step | Phase 4a (HowItWorks) |
| US-101 AC4 | Live counter "X books near you" | Phase 4a (requires books — placeholder for now) |
| US-101 AC5 | Browse without signup (blurred) | Phase 4a (deferred until Epic 4 browse exists) |
| US-101 AC6 | Responsive 320px–1920px | Phase 4a (CSS) |
| US-102 AC1 | Form: email, password, display name | Phase 4b (already exists + DOB addition) |
| US-102 AC2 | Password: 8+ chars, 1 number, 1 letter | Phase 3 (Zod schema) + Phase 2 (backend) |
| US-102 AC3 | Email uniqueness (case-insensitive) | Phase 2 (backend validation) |
| US-102 AC4 | Account created as "unverified" | Phase 2 (nimoh-base default) |
| US-102 AC5 | Verification email within 60s | Phase 2 (nimoh-base + SendGrid) |
| US-102 AC6 | Verification link activates + redirects | Phase 4b (EmailVerificationPage) |
| US-102 AC7 | Unverified login shows "verify" prompt | Phase 4b (login flow check) |
| US-103 AC1 | Google + Apple buttons on login/register | Phase 4c |
| US-103 AC2 | OAuth flow opens consent screen | Phase 4c (redirect-based) |
| US-103 AC3 | Email match → link accounts | Phase 2 (python-social-auth pipeline) |
| US-103 AC4 | New OAuth user → onboarding | Phase 4c (redirect logic) |
| US-103 AC5 | Returning OAuth user → dashboard | Phase 4c (redirect logic) |
| US-103 AC6 | OAuth auto-verified | Phase 2 (backend pipeline) |
| US-104 AC1 | Login form: email + password | Phase 4b (already exists) |
| US-104 AC2 | JWT access (15min) + refresh (7d) | Phase 2 (already via nimoh-base) |
| US-104 AC3 | Generic error on failed auth | Phase 4b (already exists) |
| US-104 AC4 | 5 failed attempts → lockout | Phase 2 (django-axes or custom) |
| US-104 AC5 | "Forgot password?" link | Phase 4b (already exists) |
| US-104 AC6 | Session persists (httpOnly cookie) | Phase 3 (already working) |
| US-105 AC1 | Onboarding shown after first login | Phase 4d (OnboardingPage + redirect) |
| US-105 AC2 | Location via postcode/dropdown/map pin | Phase 4d (LocationSetup) |
| US-105 AC3 | PostGIS point snapped to 500m grid | Phase 1 (model) + Phase 2 (serializer snap) |
| US-105 AC4 | Neighborhood name derived | Phase 2 (Nominatim reverse geocoding) |
| US-105 AC5 | Skip with persistent prompt | Phase 4d (skip button + store flag) |
| US-105 AC6 | Browser geolocation shortcut | Phase 4d (LocationSetup) |
| US-106 AC1 | "Forgot password?" on login page | Phase 4e (already exists) |
| US-106 AC2 | Reset link sent within 60s | Phase 2 (nimoh-base) |
| US-106 AC3 | Same message for existing/non-existing | Phase 2 (nimoh-base default) |
| US-106 AC4 | Reset link → new password form | Phase 4e (PasswordResetConfirmPage) |
| US-106 AC5 | Sessions invalidated on reset | Phase 2 (backend) |
| US-106 AC6 | Single-use link | Phase 2 (nimoh-base) |

**Edge Cases to handle**:

| ID | Edge Case | Where to handle |
|----|-----------|----------------|
| EC1 | User under 16 registers | Backend: reject with 400. Frontend: inline error on DOB field |
| EC2 | OAuth email matches existing email/password account | Backend: python-social-auth pipeline links accounts |
| EC3 | Invalid Dutch postcode | Frontend: Zod regex validation. Backend: validator rejects |
| EC4 | Browser geolocation denied | Frontend: graceful fallback to postcode input |
| EC5 | Verification link expired (24h) | Frontend: error page with "Resend" button |
| EC6 | 5 failed login attempts | Backend: 429 response. Frontend: lockout message |
| EC7 | Area with no listed books | Frontend: "Be the first!" message on landing |
| EC8 | JS disabled | Landing page content renders via SSR-equivalent static HTML (Vite pre-render or graceful degradation) |

---

## 4. What's Not in This Plan

- **US-201 (Create & Edit Profile)** and **US-202 (View Public Profile)**: These are Epic 2 stories. However, the *data layer* for profiles (User model fields) is included in Phase 1 of this plan since it must exist before onboarding can store location. The profile *pages* and *API endpoints* are deferred to the Epic 2 action plan.
- **US-103 Apple OAuth**: Google OAuth is implemented in this plan. Apple Sign In requires an Apple Developer account ($99/year). Per the user story technical notes, consider deferring Apple to post-launch. This plan includes the backend infrastructure for both but recommends shipping Google-only first.
- **US-101 AC4 ("X books near you")**: Requires books to exist (Epic 3). Landing page will show a placeholder or static number initially.
- **US-101 AC5 (browse without signup)**: Requires the browse feed from Epic 4. Landing page will link to registration for now.

---

## 5. Suggested Commit Sequence

1. `fix(config): set AUTH_USER_MODEL to bookswap.User and enable PostGIS`
2. `feat(bookswap): extend User model with profile, location, and onboarding fields`
3. `feat(bookswap): add profile serializers, location setup endpoint, and age validation`
4. `feat(bookswap): configure Google OAuth via python-social-auth`
5. `feat(bookswap): add login rate limiting (5 attempts / 10min lockout)`
6. `feat(auth): add DOB field to registration form and under-16 rejection`
7. `feat(auth): add EmailVerificationPage and PasswordResetConfirmPage`
8. `feat(onboarding): build location setup page with postcode input and Leaflet map`
9. `feat(landing): replace design-system demo with BookSwap landing page`
10. `feat(profile): add TanStack Query hooks and Zod schemas for profile/location`
11. `test(bookswap): add registration, location, and profile acceptance-criteria tests`

---

*— End of Action Plan —*
