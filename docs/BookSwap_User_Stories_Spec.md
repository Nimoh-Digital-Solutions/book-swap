# BookSwap — User Stories Specification

## Phase 1 MVP | Detailed Implementation Reference

| Field | Detail |
|-------|--------|
| **Version** | 1.0 |
| **Date** | February 2026 |
| **Parent Document** | BookSwap PRD Phase 1 MVP v1.0 |
| **Author** | thrilled (Solo Founder) |
| **Status** | Draft |

---

## How to Read This Document

Each user story follows this structure:

- **ID**: Unique identifier (e.g., `US-101`) — first digit maps to the epic
- **Story**: Standard format — *As a [persona], I want [capability] so that [benefit]*
- **Priority**: P0 (must-have for launch), P1 (important, soon after), P2 (future)
- **Acceptance Criteria**: Testable conditions that must all pass for the story to be "done"
- **Edge Cases**: Known scenarios that need explicit handling
- **Technical Notes**: Implementation guidance for the developer (you)
- **Dependencies**: Other stories or external factors this depends on
- **Linked Requirements**: Maps back to the PRD requirement IDs (A-1, B-2, etc.)

---

## Table of Contents

1. [Epic 1: Onboarding & Authentication](#epic-1-onboarding--authentication)
2. [Epic 2: User Profile](#epic-2-user-profile)
3. [Epic 3: Book Listing & Management](#epic-3-book-listing--management)
4. [Epic 4: Discovery & Search](#epic-4-discovery--search)
5. [Epic 5: Exchange Flow (Book Partner System)](#epic-5-exchange-flow-book-partner-system)
6. [Epic 6: Messaging](#epic-6-messaging)
7. [Epic 7: Ratings & Reviews](#epic-7-ratings--reviews)
8. [Epic 8: Trust & Safety](#epic-8-trust--safety)
9. [Epic 9: Notifications](#epic-9-notifications)
10. [Story Dependency Map](#story-dependency-map)

---

## Epic 1: Onboarding & Authentication

### US-101: Landing Page Value Proposition

**Story:** As a **new visitor**, I want to understand what BookSwap is and how it works within 30 seconds of landing on the site so that I can decide whether to sign up.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Landing page loads in < 2 seconds on 4G
- [ ] Above-the-fold section contains: headline, one-line value prop, and a clear CTA ("Get Started" or "Browse Books Near You")
- [ ] A "How It Works" section explains the 3-step process (List → Match → Swap) with simple visuals
- [ ] A live counter or sample shows "X books available near you" (using IP geolocation or user's set location) to demonstrate activity
- [ ] Visitor can browse nearby books without signing up (read-only, blurred owner details)
- [ ] Responsive: works on mobile (320px) through desktop (1920px)

**Edge Cases:**
- Visitor is in an area with no listed books → show message: "No books near you yet. Be the first to list! Sign up and invite your neighbors."
- Visitor has JavaScript disabled → page should still render core content (SSR via Next.js)

**Technical Notes:**
- Next.js App Router with SSR for SEO (meta tags, Open Graph, structured data)
- Consider a PostGIS query to show dynamic book count for the visitor's approximate area (via IP geolocation)

**Dependencies:** None — this is the entry point.

**Linked Requirements:** —

---

### US-102: Email Registration

**Story:** As a **new user**, I want to register with my email and a password so that I can create an account and start using the platform.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Registration form collects: email, password, display name
- [ ] Password must be minimum 8 characters with at least one number and one letter
- [ ] Email must be unique (case-insensitive) — show inline error if already registered
- [ ] On submit: account created in "unverified" state
- [ ] Verification email sent within 60 seconds containing a single-use link (expires in 24 hours)
- [ ] Clicking the verification link activates the account and redirects to onboarding (US-105)
- [ ] If the user tries to log in before verifying, show: "Please check your email to verify your account" with a "Resend" button

**Edge Cases:**
- User registers with an email that has an existing OAuth account (Google/Apple) → prompt: "An account with this email already exists. Try signing in with Google."
- Verification link clicked after expiry → show error with a "Resend verification email" button
- Verification link clicked twice → second click shows "Already verified, redirecting to login"
- Email delivery failure → log for monitoring; provide "Resend" button with rate limit (max 3 per hour)

**Technical Notes:**
- Supabase Auth handles email/password signup, verification emails, and JWT issuance
- Store `email_verified` boolean on user profile
- Rate-limit resend endpoint: 3 requests per email per hour

**Dependencies:** None

**Linked Requirements:** A-1

---

### US-103: OAuth Login (Google & Apple)

**Story:** As a **new user**, I want to sign up or log in with my Google or Apple account so that I can get started in one tap without creating another password.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Continue with Google" and "Continue with Apple" buttons displayed on login/register screens
- [ ] OAuth flow opens provider's consent screen, then redirects back to BookSwap
- [ ] If the OAuth email matches an existing email/password account, the accounts are linked (not duplicated)
- [ ] If this is a new user (first OAuth login), redirect to onboarding (US-105)
- [ ] If this is a returning user, redirect to dashboard / home feed
- [ ] OAuth accounts are automatically marked as email-verified

**Edge Cases:**
- User revokes OAuth permission on Google/Apple side → next login attempt shows error with fallback to email/password
- User has both Google and Apple connected → either can be used to log in
- OAuth provider returns no email (rare, Apple privacy relay) → generate a proxy email; prompt user to add a real email later

**Technical Notes:**
- Supabase Auth supports Google and Apple OAuth out of the box
- Apple Sign In requires an Apple Developer account ($99/year) — consider deferring Apple to post-launch if budget is tight, since Google alone covers most users in NL
- Store `auth_provider` on user record for analytics

**Dependencies:** None

**Linked Requirements:** A-2

---

### US-104: Secure Login

**Story:** As a **returning user**, I want to log in with my email/password or OAuth so that I can access my account securely.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Login form accepts email + password
- [ ] On successful auth: JWT access token (15 min expiry) + refresh token (7 days) issued
- [ ] On failed auth: generic error "Invalid email or password" (don't reveal which is wrong)
- [ ] After 5 failed attempts from the same IP within 10 minutes: temporary lockout (15 min) with message
- [ ] "Forgot password?" link visible → triggers US-106
- [ ] Session persists across browser tabs and survives page refresh (token stored in httpOnly cookie)

**Edge Cases:**
- User tries to log in with email that only has OAuth → show: "This account uses Google Sign-In. Please use 'Continue with Google'."
- User's refresh token expires → redirect to login page with message "Your session has expired. Please log in again."

**Technical Notes:**
- Supabase Auth handles JWT lifecycle. Use `supabase.auth.onAuthStateChange()` for session management
- Implement rate limiting at the API/edge function level

**Dependencies:** US-102 or US-103

**Linked Requirements:** A-1, A-2

---

### US-105: Onboarding — Location Setup

**Story:** As a **new user** (just registered), I want to set my neighborhood during onboarding so that the platform shows me books nearby from the start.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Onboarding screen shown after first login (registration or OAuth)
- [ ] User can set location via one of: (a) entering a postcode, (b) selecting a neighborhood from a dropdown, or (c) placing a pin on a Leaflet/OSM map
- [ ] Location is stored as a PostGIS `GEOMETRY(Point, 4326)` snapped to the nearest 500m grid centroid (never exact address)
- [ ] Neighborhood name derived from the point and displayed on profile (e.g., "De Pijp", "Jordaan")
- [ ] User can skip and set location later (but they see a persistent prompt until they do)
- [ ] If browser geolocation API is available, offer "Use my current location" as a shortcut

**Edge Cases:**
- User enters a postcode in a low-density area → accept it and show: "There are fewer books in your area right now. Invite friends to get swapping!"
- User denies browser geolocation permission → fall back to manual postcode/neighborhood entry; no error
- User enters an invalid postcode → inline validation: "We couldn't find that postcode. Please check and try again."

**Technical Notes:**
- Dutch postcodes follow the format `1234 AB`. Validate with regex: `/^\d{4}\s?[A-Za-z]{2}$/`
- Use a public geocoding API (Nominatim/OpenStreetMap) to convert postcode → lat/lng
- Snap to 500m grid: `ROUND(lat * 2) / 2, ROUND(lng * 2) / 2` (approximate — adjust precision for local density)
- Neighborhood name derived via reverse geocoding (Nominatim/OpenStreetMap) based on the snapped point. No hard-coded neighborhood list.

**Dependencies:** US-102 or US-103

**Linked Requirements:** A-4

---

### US-106: Password Reset

**Story:** As a **user**, I want to reset my password via email if I forget it so that I can regain access to my account.

**Priority:** P1

**Acceptance Criteria:**
- [ ] "Forgot password?" link on login page opens a form asking for email
- [ ] If email exists: reset link sent within 60 seconds (link expires after 1 hour)
- [ ] If email doesn't exist: show the same success message (don't reveal whether the email is registered)
- [ ] Reset link opens a form to enter a new password (same validation rules as registration)
- [ ] On successful reset: all existing sessions invalidated; user redirected to login
- [ ] Reset link is single-use — second click shows "This link has already been used"

**Edge Cases:**
- User requests multiple reset emails → only the most recent link works; older ones are invalidated
- User resets password on an OAuth-only account → allow it; account now supports both OAuth and email/password login

**Technical Notes:**
- Supabase Auth has built-in password reset flow with customizable email templates

**Dependencies:** US-102

**Linked Requirements:** A-5

---

## Epic 2: User Profile

### US-201: Create & Edit Profile

**Story:** As a **user**, I want to set up and edit my profile (display name, bio, photo, preferred genres) so that other users can learn about me and my reading interests.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Profile fields: display name (required, unique, 3–30 chars), bio (optional, max 300 chars), profile photo (optional), preferred genres (multi-select, max 5), preferred language (English/Dutch/Both)
- [ ] Display name uniqueness checked in real-time (debounced 300ms) as user types
- [ ] Profile photo: upload JPEG/PNG, max 2MB, auto-cropped to square, resized to 200x200px for storage
- [ ] All fields editable at any time from a "Settings" or "Edit Profile" page
- [ ] Changes saved on submit with success confirmation
- [ ] Profile is visible to other users (display name, bio, photo, genres, neighborhood, member since, swap count, avg rating)

**Edge Cases:**
- User tries a display name that's taken → inline error with suggestions (e.g., "bookworm" → "bookworm42", "bookworm_reads")
- User uploads a non-image file → reject with error: "Please upload a JPEG or PNG image"
- User uploads an extremely large image → client-side resize before upload if > 2MB

**Technical Notes:**
- Profile photo stored in Supabase Storage with RLS (user can only write to their own folder)
- Use `sharp` or client-side canvas for image resizing before upload
- Genre list: Fiction, Non-Fiction, Sci-Fi, Fantasy, Mystery/Thriller, Romance, Biography, History, Science, Philosophy, Self-Help, Business, Poetry, Graphic Novel, Children's, Young Adult, Horror, Travel, Cooking, Art, Other

**Dependencies:** US-105

**Linked Requirements:** A-3

---

### US-202: View Another User's Profile

**Story:** As a **user**, I want to view another user's public profile so that I can assess their trustworthiness before requesting a swap.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Public profile shows: display name, bio, profile photo, neighborhood (not exact location), preferred genres, member since date, swap count, average rating (if 3+ ratings), listed books (available only)
- [ ] "Send Partner Request" button visible on each of their available book listings
- [ ] "Report User" and "Block User" options available in a menu
- [ ] If the viewer has blocked this user (or vice versa), the profile shows a 404 / "User not found"

**Edge Cases:**
- Profile of a deleted/deactivated user → show "This user is no longer active"
- User with 0 swaps and no ratings → show "New member" badge instead of rating

**Technical Notes:**
- RLS policy: all authenticated users can SELECT from `users` table (minus blocked pairs)
- avg_rating only displayed when `rating_count >= 3` (to avoid misleading single-rating scores)

**Dependencies:** US-201, US-801 (block)

**Linked Requirements:** A-3

---

### US-203: Account Deletion (GDPR)

**Story:** As a **user**, I want to delete my account and all associated data so that I can exercise my right to erasure under GDPR.

**Priority:** P1

**Acceptance Criteria:**
- [ ] "Delete Account" option in Settings, behind a confirmation dialog: "This will permanently delete your account, all your book listings, exchange history, and messages. This cannot be undone."
- [ ] User must re-enter their password (or re-authenticate via OAuth) to confirm
- [ ] On confirmation: all book listings removed immediately (no longer visible to others)
- [ ] Personal data (email, display name, bio, photo, location) anonymized or deleted within 30 days
- [ ] Exchange history retained in anonymized form for the other party's records (e.g., "Swapped with [Deleted User]")
- [ ] Ratings given by this user remain (anonymized as "Former member") — ratings received are removed
- [ ] Confirmation email sent: "Your account has been scheduled for deletion"

**Edge Cases:**
- User has an active exchange in progress → block deletion: "Please complete or cancel your active exchange before deleting your account."
- User requests deletion then changes mind within 30 days → provide a "Cancel deletion" link in the confirmation email (grace period)

**Technical Notes:**
- Implement a soft-delete with a 30-day grace period, then a scheduled job (Supabase cron or edge function) for hard deletion
- Anonymize: replace display_name with "Deleted User", set email to null, delete avatar from storage, set location to null

**Dependencies:** US-102

**Linked Requirements:** A-6

---

## Epic 3: Book Listing & Management

### US-301: Add Book via ISBN Scan

**Story:** As a **book owner**, I want to scan my book's ISBN barcode with my phone camera so that the book details auto-fill and I can list it in seconds.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Add Book" button opens a screen with two options: "Scan Barcode" and "Search Manually"
- [ ] "Scan Barcode" activates the device camera via the browser (MediaDevices API)
- [ ] On successful scan: ISBN extracted and sent to Open Library API (fallback: Google Books API)
- [ ] API returns: title, author, cover image, description, page count, publish year
- [ ] Auto-filled data displayed for user review — all fields are editable before saving
- [ ] If ISBN not found in API: show message "Book not found. Please enter details manually." and switch to manual flow (US-302)
- [ ] Camera permission prompt handled gracefully with explanation text

**Edge Cases:**
- Book has no barcode (very old, self-published) → user uses manual search (US-302)
- Camera permission denied → show: "Camera access is needed to scan barcodes. You can also search manually." with link to manual flow
- ISBN scan returns wrong book (different edition) → user can edit all fields before saving
- Multiple ISBNs on book (ISBN-10 and ISBN-13) → try ISBN-13 first, fall back to ISBN-10

**Technical Notes:**
- Use `quagga2` or `zxing-js/browser` for client-side barcode scanning — no server round-trip for the scan itself
- Open Library API endpoint: `https://openlibrary.org/isbn/{isbn}.json` — free, no API key
- Google Books API endpoint: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}` — free with key, 1000 req/day
- Cache ISBN lookups in the database to avoid repeated API calls for popular books

**Dependencies:** US-105 (user must have location set), US-102/103 (must be logged in)

**Linked Requirements:** B-1

---

### US-302: Add Book via Manual Search

**Story:** As a **book owner**, I want to search for my book by title or author so that I can list it even if I can't scan the barcode.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Search input accepts title, author, or combination
- [ ] Results shown as a list of book cards (cover thumbnail, title, author, year) from Open Library / Google Books API
- [ ] User selects the correct match → details auto-fill (same as ISBN flow)
- [ ] If no results match: "Can't find your book?" link opens a fully manual entry form
- [ ] Manual entry form: title (required), author (required), description (optional), cover image (optional upload), genre, language
- [ ] Search is debounced (300ms) and shows loading state

**Edge Cases:**
- Very common title (e.g., "Love") → results paginated, user scrolls to find correct edition
- Book in a non-Latin script → search should still work (Open Library supports multilingual)
- User enters only partial title → fuzzy matching via API returns best guesses

**Technical Notes:**
- Open Library search: `https://openlibrary.org/search.json?q={query}&limit=10`
- Show "Powered by Open Library" attribution as required by their terms

**Dependencies:** US-105

**Linked Requirements:** B-1

---

### US-303: Upload Book Photos

**Story:** As a **book owner**, I want to upload 1–3 photos of my book's actual condition so that potential swap partners can see exactly what they're getting.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Photo upload section in the "Add Book" and "Edit Book" flows
- [ ] Minimum 1 photo required before a book can be listed
- [ ] Maximum 3 photos allowed
- [ ] Accepted formats: JPEG, PNG
- [ ] Client-side compression: images resized to max 1200px on longest edge, quality reduced to ~80%, max 1MB per image
- [ ] Upload progress indicator shown for each image
- [ ] Photos can be reordered (drag-and-drop or arrow buttons) — first photo is the primary/thumbnail
- [ ] Photos can be removed individually
- [ ] Photos served via CDN with responsive sizing (thumbnail for cards, full-size for detail page)

**Edge Cases:**
- User uploads a non-image file → reject: "Please upload a JPEG or PNG image"
- Upload fails mid-way (network error) → show retry button per image
- User tries to upload more than 3 → disable upload button after 3 with message "Maximum 3 photos"
- Very dark or blurry photo → accept it (no quality gate in MVP — trust users)

**Technical Notes:**
- Use Supabase Storage with a dedicated `book-photos` bucket
- RLS: users can upload to `book-photos/{user_id}/{book_id}/` path only
- Client-side compression: use `browser-image-compression` library
- Store photo URLs as a `text[]` array on the `books` table
- Supabase image transformations for thumbnail generation: `?width=300&height=400&resize=cover`

**Dependencies:** US-301 or US-302

**Linked Requirements:** B-2

---

### US-304: Set Book Condition & Details

**Story:** As a **book owner**, I want to set the condition, genre, and language of my book so that seekers can filter and set expectations accurately.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Condition selector with 4 options, each with a tooltip explanation:
  - **New**: Unread, no wear, spine intact
  - **Like New**: Read once, minimal wear, no marks
  - **Good**: Some wear, may have minor marks, all pages intact
  - **Acceptable**: Noticeable wear, may have highlighting or notes, still fully readable
- [ ] Genre multi-select: user picks up to 3 genres from the predefined list
- [ ] Language selector: English, Dutch, German, French, Spanish, Other (required)
- [ ] Optional notes field (max 200 chars) for additional details (e.g., "First edition", "Has coffee stain on page 42")
- [ ] All selections visible on the book's listing card and detail page

**Edge Cases:**
- User doesn't select a condition → block listing: "Please select a condition rating"
- User selects "New" but photo clearly shows wear → no automated check in MVP; rely on partner ratings to self-regulate

**Technical Notes:**
- Condition stored as enum in PostgreSQL: `CREATE TYPE book_condition AS ENUM ('new', 'like_new', 'good', 'acceptable');`
- Genre stored as `text[]` with CHECK constraint on length

**Dependencies:** US-301 or US-302

**Linked Requirements:** B-3, B-4

---

### US-305: My Shelf Dashboard

**Story:** As a **book owner**, I want to see all my listed books in one place with their current status so that I can manage my inventory.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "My Shelf" page accessible from main navigation
- [ ] Shows all user's books as cards with: cover thumbnail, title, author, condition badge, status badge, date listed
- [ ] Status badges with colors: Available (green), In Exchange (orange), Returned (blue)
- [ ] Each card has actions: Edit, Remove (with confirmation dialog)
- [ ] "Add Book" CTA prominently displayed (especially when shelf is empty)
- [ ] Sort options: Date added (newest first), Title A–Z, Status
- [ ] Empty state: friendly illustration + "Your shelf is empty! List your first book to start swapping."
- [ ] Count displayed: "You have X books listed (Y available)"

**Edge Cases:**
- User removes a book that has a pending partner request → auto-decline the request with notification: "This book is no longer available."
- User removes a book that is currently in an active exchange → block removal: "This book is currently being exchanged. Please complete or cancel the exchange first."

**Technical Notes:**
- RLS: user can SELECT/UPDATE/DELETE only their own books
- Status transitions handled by database triggers when exchange_requests status changes
- Consider lazy loading / infinite scroll if a user has 50+ books

**Dependencies:** US-301 or US-302

**Linked Requirements:** B-5

---

### US-306: Wishlist — "Looking For"

**Story:** As a **book seeker**, I want to add books or genres to my wishlist so that I can be notified when a match appears nearby.

**Priority:** P1

**Acceptance Criteria:**
- [ ] "Looking For" section on user's profile page and as a separate tab on My Shelf
- [ ] Add wishlist item by: ISBN search, title/author search, or just a genre
- [ ] Wishlist items visible on the user's public profile (helps potential partners propose better matches)
- [ ] Maximum 20 wishlist items
- [ ] Remove items individually

**Edge Cases:**
- User wishlists a book that's already available nearby → show a "Available now!" badge with link to the listing (P2 feature, not in MVP)

**Technical Notes:**
- `wishlists` table with optional `isbn`, `title`, `genre` columns
- Future: a matching job that compares new book listings against all wishlists and sends notifications

**Dependencies:** US-201

**Linked Requirements:** B-6

---

## Epic 4: Discovery & Search

### US-401: Browse Nearby Books

**Story:** As a **book seeker**, I want to see available books near me, sorted by distance, so that I can find books I can pick up easily.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Default home feed (after onboarding) shows available books within the user's selected radius
- [ ] Default radius: 5km (changeable via filter)
- [ ] Books displayed as cards: cover image, title, author, condition badge, distance ("~2.3 km"), owner's display name + avatar + rating
- [ ] Sorted by distance (nearest first) by default
- [ ] Paginated: 20 books per page, infinite scroll or "Load More" button
- [ ] If no books found within radius: "No books found within [X] km. Try expanding your search radius." with a button to increase it
- [ ] Books owned by the current user are excluded from results
- [ ] Books owned by blocked users are excluded from results

**Edge Cases:**
- User hasn't set location yet → show prompt to set location (link to US-105) instead of empty results
- All nearby books belong to one user → still show them (don't hide — the goal is to display availability)
- Two users at the same snapped grid point → distance shows as "< 1 km"

**Technical Notes:**
- PostGIS query: `SELECT *, ST_Distance(u.location, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography) AS distance FROM books b JOIN users u ON b.owner_id = u.id WHERE b.status = 'available' AND ST_DWithin(u.location::geography, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography, $radius_meters) AND b.owner_id != $current_user_id AND b.owner_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $current_user_id) ORDER BY distance LIMIT 20 OFFSET $offset;`
- GiST index on `users.location` is critical for performance
- Cache the query for 60 seconds per user/radius combination to reduce DB load

**Dependencies:** US-105, US-301 (books must exist)

**Linked Requirements:** C-1

---

### US-402: Distance Filter

**Story:** As a **book seeker**, I want to adjust my search radius so that I can widen or narrow my results based on how far I'm willing to travel.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Filter options: 1 km, 3 km, 5 km (default), 10 km, 25 km
- [ ] Displayed as a segmented control or dropdown near the top of the feed
- [ ] Changing the filter updates results immediately (no page reload — client-side re-fetch)
- [ ] Selected radius persisted in user preferences (survives page refresh and future sessions)
- [ ] Book count for each radius option shown (e.g., "5 km (23 books)") — if feasible without performance hit

**Edge Cases:**
- User selects 1 km and there are 0 results → suggest expanding: "No books within 1 km. Try 3 km (8 books available)."
- User at an area boundary selects 25 km → results may include books in neighboring towns — this is fine

**Technical Notes:**
- Store preference in `users.preferred_radius` column (integer, meters)
- Pre-compute counts per radius option using a single query with CASE statements to avoid 5 separate queries

**Dependencies:** US-401

**Linked Requirements:** C-2

---

### US-403: Search by Title, Author, or ISBN

**Story:** As a **book seeker**, I want to search for a specific book by title, author, or ISBN so that I can find exactly what I'm looking for.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Search bar prominently placed at the top of the browse/discover page
- [ ] Accepts free-text input — searches across title, author, and ISBN fields
- [ ] Results combine: text relevance ranking AND distance proximity (nearby matches ranked higher)
- [ ] Partial matches supported (e.g., "Alch" matches "The Alchemist")
- [ ] Search is debounced (300ms) and shows loading state
- [ ] Results displayed in the same card format as the browse feed
- [ ] "No results" state: "No books matching '[query]' found nearby. Try a different search or expand your radius."
- [ ] Search query preserved in URL (shareable links, browser back button works)

**Edge Cases:**
- ISBN search (13 digits) → exact match only, very fast
- Very short query (1–2 chars) → don't trigger search; show hint "Type at least 3 characters"
- Special characters in search → sanitize input to prevent SQL injection (handled by Supabase client)

**Technical Notes:**
- PostgreSQL full-text search: add `tsvector` column on `books` table, generated from `title || ' ' || author`
- `CREATE INDEX idx_books_fts ON books USING GIN (fts_vector);`
- Combine FTS ranking with ST_Distance for a composite score: `ts_rank(fts_vector, query) * 0.7 + (1 / (1 + distance_km)) * 0.3`

**Dependencies:** US-401

**Linked Requirements:** C-3

---

### US-404: Filter by Genre, Language, Condition

**Story:** As a **book seeker**, I want to filter search results by genre, language, and condition so that I can narrow down to books that match my preferences.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Filter panel (sidebar on desktop, bottom sheet on mobile) with three filter groups:
  - **Genre**: multi-select checkboxes (same genre list as listing)
  - **Language**: English, Dutch, Other (multi-select)
  - **Condition**: New, Like New, Good, Acceptable (multi-select)
- [ ] Filters are combinable (AND logic between groups, OR logic within a group)
- [ ] Active filters shown as removable chips above results
- [ ] "Clear all filters" button when any filter is active
- [ ] Result count updates dynamically as filters are applied
- [ ] Filters persist during the session but reset on logout

**Edge Cases:**
- All filters applied result in 0 books → show message with suggestion to relax filters
- User applies genre filter that has no books in their radius → same 0-result message

**Technical Notes:**
- All filtering done in the PostgreSQL query (WHERE clauses added dynamically)
- Genre filter: `books.genre && ARRAY['fiction', 'sci-fi']` (PostgreSQL array overlap operator)
- Consider URL query params for filter state: `?genre=fiction,sci-fi&lang=en&condition=good,like_new&radius=5`

**Dependencies:** US-401

**Linked Requirements:** C-4

---

### US-405: Map View

**Story:** As a **book seeker**, I want to see available books plotted on a map so that I can visually find books in my area.

**Priority:** P1

**Acceptance Criteria:**
- [ ] Toggle between "List View" (default) and "Map View" on the browse page
- [ ] Map uses Leaflet + OpenStreetMap tiles centered on user's location
- [ ] Available books shown as pins at their owner's approximate location (neighborhood centroid)
- [ ] Clicking a pin shows a popup with: book cover, title, author, condition, distance
- [ ] Clicking the popup navigates to the book detail page
- [ ] Pins cluster when zoomed out (using Leaflet.markercluster)
- [ ] User's own location shown as a distinct pin (blue dot)
- [ ] Map respects the active distance filter (only shows books within selected radius)

**Edge Cases:**
- Multiple books from the same owner → single pin at that location, popup shows a list of their books
- Zoom out shows a wider area → clusters prevent pin overload

**Technical Notes:**
- Leaflet is client-side only — no server-side map rendering needed
- OSM tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` — free, attribution required
- Leaflet.markercluster plugin for clustering

**Dependencies:** US-401

**Linked Requirements:** C-5

---

## Epic 5: Exchange Flow (Book Partner System)

### US-501: Send Book Partner Request

**Story:** As a **book seeker**, I want to send a swap request to a book owner, proposing one of my books in exchange, so that I can initiate a trade.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Request Swap" button on every available book's detail page and card
- [ ] Clicking opens a modal/page showing: the requested book (their book) and a selector for "Your offer" (pick from your Available books)
- [ ] User must have at least 1 available book to send a request (if shelf is empty: "List a book first to start swapping!")
- [ ] Optional message field (max 200 chars) for a personal note
- [ ] On submit: request created with status `pending`, owner notified via email (US-901)
- [ ] Requester sees "Request Sent" status on the book; can cancel before the owner responds
- [ ] User cannot send a request for their own book
- [ ] User cannot send duplicate requests for the same book (only 1 active request per book per requester)

**Edge Cases:**
- Book becomes unavailable (owner removes it) after request page loads but before submit → show error: "This book is no longer available."
- Requester's offered book becomes unavailable (accepted in another swap) before owner reviews → auto-cancel request with notification to both parties
- User has been blocked by the book owner → "Request Swap" button not visible (book shouldn't appear in their feed at all)

**Technical Notes:**
- Database constraint: `UNIQUE(requester_id, requested_book_id) WHERE status = 'pending'`
- Trigger to check both books are still `available` on INSERT

**Dependencies:** US-305 (must have books listed), US-401 (must find a book)

**Linked Requirements:** D-1

---

### US-502: Review & Respond to Partner Request

**Story:** As a **book owner**, I want to review incoming swap requests and accept, decline, or counter-propose so that I stay in control of my exchanges.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Requests" section/tab in the navigation showing incoming requests with unread count
- [ ] Each request card shows: requester's profile (name, photo, rating, swap count), the book they want (yours), and the book they're offering
- [ ] Three action buttons: **Accept**, **Decline**, **Counter**
- [ ] **Accept**: triggers the Exchange Conditions step (US-503)
- [ ] **Decline**: request status → `declined`. Requester notified. Optional decline reason (dropdown: "Not interested in offered book", "Book is reserved for someone else", "Other")
- [ ] **Counter**: opens the requester's shelf so the owner can pick a different book they'd prefer → sends a modified request back to the requester for their approval
- [ ] Pending requests display on the book's detail page: "1 pending request" (only visible to the owner)

**Edge Cases:**
- Owner receives multiple requests for the same book → can accept only one; others auto-declined when one is accepted with message "This book has been matched with another reader"
- Counter-propose: requester's proposed alternative is also in a pending request → warn the owner
- Request sits unanswered for 14 days → auto-expire with notification to both: "This request has expired"

**Technical Notes:**
- Counter-propose creates a new `exchange_requests` row with `counter_to` foreign key referencing the original
- Auto-expire: Supabase scheduled function running daily, checking `created_at > 14 days AND status = 'pending'`

**Dependencies:** US-501

**Linked Requirements:** D-2

---

### US-503: Accept Exchange Conditions

**Story:** As a **matched user** (after a request is accepted), I want both of us to review and accept the platform's exchange conditions before any personal details are shared so that we both agree to the same standards.

**Priority:** P0

**Acceptance Criteria:**
- [ ] After a request is accepted, both users see a "Review Conditions" screen before proceeding
- [ ] Conditions document covers:
  - Take care of the borrowed book as if it were your own
  - Meet in a public place for the exchange (suggested locations provided)
  - Return the book in the same condition you received it
  - Report any issues through the platform
  - Your approximate neighborhood location will be shared with your partner
  - Either party can cancel the exchange at any time before the swap
- [ ] Each user must scroll through (or at least view) the full conditions
- [ ] Each user must check "I have read and agree to the exchange conditions" and click "Confirm"
- [ ] Both users' acceptances are timestamped and stored with a conditions version number
- [ ] Until BOTH users have accepted: no chat access, no profile details beyond public info
- [ ] After BOTH accept: exchange moves to ACTIVE state, chat unlocks (US-601)

**Edge Cases:**
- One user accepts, the other doesn't for 7 days → send a reminder. After 14 days → auto-cancel
- Conditions are updated by the platform → new version number; existing accepted exchanges are grandfathered on the old version
- User tries to access chat before both have accepted → show: "Waiting for [partner] to accept the exchange conditions"

**Technical Notes:**
- `conditions_acceptance` table: `exchange_id, user_id, accepted_at, conditions_version`
- Database trigger: when both rows exist for an exchange → update `exchange_requests.status` to `active`
- Store conditions text as a versioned markdown/HTML document

**Dependencies:** US-502

**Linked Requirements:** D-3, E-6

---

### US-504: Confirm Exchange Completion

**Story:** As a **book partner**, I want both of us to confirm the swap happened so that our histories update and we can rate each other.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Confirm Swap" button visible in the active exchange chat for both users
- [ ] Each user clicks independently — don't require simultaneous confirmation
- [ ] After one user confirms: show "Waiting for [partner] to confirm the swap"
- [ ] After BOTH confirm: exchange status → `swap_confirmed`, both books status → `in_exchange`
- [ ] Rating prompt appears for both users (US-701)
- [ ] Swap count incremented for both users
- [ ] Chat remains accessible (read-only) for reference but no new messages

**Edge Cases:**
- One user confirms, the other never does → after 30 days, send reminder. After 60 days, auto-confirm (assume exchange happened and party forgot to confirm)
- User wants to cancel an exchange after conditions accepted but before meeting → "Cancel Exchange" button available; both books return to Available; cancellation count tracked

**Technical Notes:**
- Two-phase confirmation: add `requester_confirmed_at` and `owner_confirmed_at` to `exchange_requests`
- Trigger: when both timestamps are non-null → status → `swap_confirmed`

**Dependencies:** US-503

**Linked Requirements:** D-5

---

### US-505: Book Return Flow

**Story:** As a **book partner**, I want to initiate a return of the swapped books when we're both ready so that the books go back to our shelves.

**Priority:** P1

**Acceptance Criteria:**
- [ ] Either partner can initiate a "Return Request" from their exchange history
- [ ] Return is arranged via the existing chat (which re-opens for messaging)
- [ ] Both users confirm the return happened (same two-phase confirmation as US-504)
- [ ] After both confirm: both books status → `available` again on their original owner's shelves
- [ ] Exchange marked as fully completed

**Edge Cases:**
- One party wants to return, the other doesn't → no enforcement mechanism in MVP; this is a social contract
- Books were damaged during the exchange → handled via report/dispute flow (US-803), not the return flow

**Technical Notes:**
- Add `return_requested_at`, `return_confirmed_by_requester`, `return_confirmed_by_owner` to `exchange_requests`

**Dependencies:** US-504

**Linked Requirements:** D-7

---

## Epic 6: Messaging

### US-601: In-App Chat

**Story:** As a **book partner** (exchange is active), I want to message my swap partner to arrange a meetup time and location so that we can coordinate without sharing personal contact info.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Chat available only after both users accept exchange conditions (US-503)
- [ ] Real-time messaging: messages appear within 1 second of sending
- [ ] Chat shows: message text, sender avatar, timestamp, read status (sent/delivered/read)
- [ ] Text messages: max 1000 characters per message
- [ ] Image sharing: user can send a photo (e.g., screenshot of a map location) — max 1 image per message, same upload rules as book photos
- [ ] Chat history persisted and accessible from "My Exchanges" page
- [ ] Typing indicator shown when partner is typing
- [ ] Chat is locked (read-only) after exchange is completed AND both have rated (or 7 days after completion)

**Edge Cases:**
- User sends a message while partner is offline → message stored, partner sees it next time they open the app
- Network disconnection → show "Connecting..." status; queue messages locally and send when reconnected
- User sends rapid messages (spam) → client-side rate limit: max 5 messages per 10 seconds
- User tries to share a phone number / email in chat → no blocking in MVP (freedom of choice), but conditions warn against it

**Technical Notes:**
- Supabase Realtime: subscribe to `messages` table filtered by `exchange_id`
- INSERT message → Realtime broadcasts to both participants
- Read status: UPDATE `read_at` when the recipient's chat is open and message is in viewport
- Messages table RLS: participants of the exchange only

**Dependencies:** US-503

**Linked Requirements:** D-4

---

### US-602: Safe Meetup Location Suggestions

**Story:** As a **book partner**, I want the chat to suggest safe public meetup locations so that I feel comfortable meeting a stranger.

**Priority:** P1

**Acceptance Criteria:**
- [ ] "Suggest a meetup spot" button in the chat toolbar
- [ ] Opens a list of suggested public locations near both users, sourced via a POI/geocoding API
- [ ] Categories: Libraries, Cafes, Parks, Train Stations
- [ ] Each suggestion shows: name, address, distance from each user
- [ ] Selecting a suggestion inserts a formatted message into the chat: "How about meeting at [Location Name]? It's [X km] from you and [Y km] from me."

**Edge Cases:**
- Both users are in the same neighborhood → prioritize the nearest 3–5 locations
- Location data for one user is missing → show all curated locations without distance calculation

**Technical Notes:**
- Store curated locations in a `meetup_locations` table with PostGIS points, or query a POI API (e.g., Overpass/OpenStreetMap) for nearby public places
- Seed initial data for Amsterdam; other locations can be discovered dynamically via geocoding
- Query: nearest to the midpoint between both users' locations

**Dependencies:** US-601

**Linked Requirements:** E-7

---

## Epic 7: Ratings & Reviews

### US-701: Rate Your Swap Partner

**Story:** As a **book partner** (after confirming a swap), I want to rate my experience with my partner so that future users can assess trustworthiness.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Rating prompt shown after exchange completion (US-504) — non-blocking modal or dedicated page
- [ ] Star rating: 1–5 stars (required to submit)
- [ ] Optional text review: max 300 characters
- [ ] User can rate within 30 days of exchange completion
- [ ] After submitting: rating is final and cannot be edited (to prevent pressure/manipulation)
- [ ] If user doesn't rate within 30 days: opportunity expires silently
- [ ] "Skip" option available — user is not forced to rate

**Edge Cases:**
- User submits a 1-star rating with abusive text → text goes through a basic profanity filter; if flagged, reviewed by admin before publishing
- User tries to rate the same exchange twice → blocked at database level

**Technical Notes:**
- `ratings` table with unique constraint on `(exchange_id, rater_id)`
- Trigger on INSERT: recalculate `avg_rating` on the `rated_id` user using `AVG(score) FROM ratings WHERE rated_id = X`
- Display avg_rating only when `rating_count >= 3`

**Dependencies:** US-504

**Linked Requirements:** D-6

---

## Epic 8: Trust & Safety

### US-801: Block User

**Story:** As a **user**, I want to block another user so that they can't see my profile, books, or contact me.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Block User" option available on any user's profile page and in the chat
- [ ] Confirmation dialog: "Block [display name]? They won't be able to see your profile, books, or send you requests. They won't be notified."
- [ ] After blocking: blocker no longer sees blocked user's profile or books in any search/feed; blocked user no longer sees blocker's profile or books
- [ ] Existing active exchange between them: auto-cancelled with notification "This exchange has been cancelled"
- [ ] Existing chat: hidden from both users
- [ ] Block is silent — blocked user is not notified
- [ ] "Blocked Users" list in Settings with option to unblock

**Edge Cases:**
- User blocks someone who already sent them a partner request → auto-decline the request silently
- Mutual block (A blocks B, then B also blocks A) → both blocks stored; unblocking is one-directional

**Technical Notes:**
- `blocks` table: `(blocker_id, blocked_id)`
- Add WHERE clause to ALL user-facing queries: `AND owner_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $current_user) AND owner_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $current_user)`
- Create a Supabase RLS helper function for block filtering

**Dependencies:** US-201

**Linked Requirements:** E-4

---

### US-802: Report User or Listing

**Story:** As a **user**, I want to report inappropriate behavior or a problematic listing so that the platform stays safe and trustworthy.

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Report" option on: user profiles, book listings, and in chat
- [ ] Report form with category dropdown:
  - Inappropriate or offensive content
  - Suspicious or fake listing
  - No-show at meetup
  - Book condition misrepresented
  - Harassment or threatening behavior
  - Spam
  - Other (free text required)
- [ ] Description field: max 500 characters (required for "Other")
- [ ] On submit: report saved with `status: 'open'`; confirmation shown: "Thanks for reporting. We'll review this within 48 hours."
- [ ] Reported user is not notified of the report
- [ ] Admin dashboard (simple page, founder-only access) lists all open reports for review

**Edge Cases:**
- User reports the same person twice for the same reason → allow it; deduplication is manual during review
- Report about an exchange that already completed → still valid (e.g., book was damaged)

**Technical Notes:**
- `reports` table with RLS: users can INSERT only, admin can SELECT/UPDATE
- Admin route protected by checking `user.id` against a hardcoded admin list (simple for MVP)
- Email notification to founder on new report (via Resend)

**Dependencies:** US-201

**Linked Requirements:** E-3

---

### US-803: Email Verification Gate

**Story:** As the **platform**, I want to require email verification before users can list books or send requests so that we maintain a minimum level of identity trust.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Unverified users can: browse books, view profiles, search
- [ ] Unverified users CANNOT: list books, send partner requests, send messages
- [ ] When an unverified user attempts a gated action: show inline prompt "Please verify your email to [list books / send requests]. Check your inbox or resend verification email."
- [ ] "Resend" button rate-limited to 3 per hour
- [ ] OAuth users are auto-verified (no email step needed)

**Edge Cases:**
- User registers, doesn't verify, comes back 30 days later → verification link expired; "Resend" still works

**Technical Notes:**
- Check `email_verified` flag from Supabase Auth session before gated mutations
- Middleware or RLS policy enforcement

**Dependencies:** US-102

**Linked Requirements:** E-1

---

### US-804: GDPR Privacy Compliance

**Story:** As a **user in the Netherlands**, I want the platform to comply with GDPR and Dutch UAVG so that my personal data is handled lawfully.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Privacy policy page: available in English and Dutch, accessible from footer on every page
- [ ] Covers: what data is collected, why, how it's stored, who it's shared with, how long it's retained, user rights (access, rectification, erasure, portability, objection)
- [ ] Cookie consent banner on first visit: "We use essential cookies to run BookSwap. [Accept / Manage Preferences]"
- [ ] Only essential cookies used in MVP (auth session) — no analytics or tracking cookies
- [ ] Data Processing Impact Assessment (DPIA) documented for location data processing
- [ ] Data export: user can download their data as JSON from Settings (name, email, books, exchange history)
- [ ] All personal data encrypted at rest (Supabase default) and in transit (HTTPS)

**Edge Cases:**
- User under 16 → Dutch UAVG requires parental consent for children under 16. In MVP: add a minimum age checkbox during registration ("I confirm I am at least 16 years old"). Full age verification is a future consideration (Q5).

**Technical Notes:**
- Use Supabase's built-in encryption at rest
- Data export: edge function that queries all user-related tables and returns JSON
- Cookie banner: lightweight implementation, no third-party consent management platform needed for MVP

**Dependencies:** None (must be ready before launch)

**Linked Requirements:** E-5

---

## Epic 9: Notifications

### US-901: Email Notifications

**Story:** As a **user**, I want to receive email notifications for important events so that I don't miss partner requests, acceptances, or messages.

**Priority:** P0

**Acceptance Criteria:**
- [ ] Email sent for: new partner request received, request accepted, request declined, new chat message (batched: max 1 email per chat per 15 minutes), exchange completed, rating received
- [ ] Emails delivered within 2 minutes of the triggering event
- [ ] Each email has: BookSwap branding, clear subject line, action button (deep link to relevant page), unsubscribe link
- [ ] Notification preferences page in Settings: per-category toggle (partner requests, messages, exchange updates)
- [ ] Unsubscribe link in emails works with one click (no login required)

**Edge Cases:**
- User has notifications disabled for messages → no email for chat messages, but still receives for partner requests and exchange updates (unless those are also disabled)
- Email delivery fails → log for monitoring; retry once after 5 minutes

**Technical Notes:**
- Resend for transactional email (3,000/month free)
- React Email for template rendering (consistent with Next.js stack)
- Database trigger on relevant table INSERTs → call Supabase Edge Function → send email via Resend
- Chat message batching: don't send an email if the recipient has the chat open (check last activity timestamp)

**Dependencies:** US-102

**Linked Requirements:** F-1

---

### US-902: In-App Notification Bell

**Story:** As a **user**, I want to see a notification bell with an unread count so that I can quickly check what needs my attention.

**Priority:** P1

**Acceptance Criteria:**
- [ ] Bell icon in the navigation header with a red badge showing unread count
- [ ] Clicking opens a dropdown/panel listing recent notifications (last 50)
- [ ] Each notification: icon, text summary, timestamp, read/unread indicator
- [ ] Clicking a notification navigates to the relevant page and marks it as read
- [ ] "Mark all as read" button
- [ ] Real-time: new notifications appear without page refresh

**Edge Cases:**
- 99+ unread → display "99+"
- Notification for a deleted/cancelled exchange → notification text still readable but link shows "This exchange is no longer active"

**Technical Notes:**
- `notifications` table: `id, user_id, type, title, body, link, read_at, created_at`
- Supabase Realtime subscription on `notifications` table filtered by `user_id`

**Dependencies:** US-901

**Linked Requirements:** F-2

---

## Story Dependency Map

A visual overview of how stories depend on each other. Read left-to-right as "must be built first → then this."

```
US-101 (Landing)
  └─> US-102 (Email Register) ─> US-104 (Login) ─> US-105 (Onboarding/Location)
  └─> US-103 (OAuth) ──────────> US-104 (Login) ─> US-105 (Onboarding/Location)

US-105 (Location Set)
  └─> US-201 (Profile) ─> US-202 (View Profile)
  └─> US-301 (ISBN Scan) ──┐
  └─> US-302 (Manual Add) ─┤
                            ├─> US-303 (Photos) ─> US-304 (Condition) ─> US-305 (My Shelf)
                            │
                            └─> US-401 (Browse Nearby) ─> US-402 (Distance Filter)
                                                       ─> US-403 (Search)
                                                       ─> US-404 (Filters)
                                                       ─> US-405 (Map View) [P1]

US-305 + US-401
  └─> US-501 (Send Request) ─> US-502 (Review Request) ─> US-503 (Conditions)
                                                            └─> US-601 (Chat) ─> US-602 (Meetup Suggestions) [P1]
                                                            └─> US-504 (Confirm Swap) ─> US-701 (Rate)
                                                                                       ─> US-505 (Return) [P1]

Independent (can be built in parallel):
  US-106 (Password Reset) [P1]
  US-203 (Account Deletion) [P1]
  US-306 (Wishlist) [P1]
  US-801 (Block)
  US-802 (Report)
  US-803 (Email Verification Gate)
  US-804 (GDPR Compliance)
  US-901 (Email Notifications)
  US-902 (Notification Bell) [P1]
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total User Stories | 30 |
| P0 (Must-Have) | 22 |
| P1 (Nice-to-Have) | 8 |
| Epics | 9 |
| Estimated Sprint Weeks (Solo) | 12 |

---

*— End of Document —*


Run a gap analysis — check if the actual code covers everything the PRD + spec describes (e.g. edge cases, missing validations, UX flows). Trigger with: "run a gap analysis"

Run a security audit — full OWASP-aligned review of the codebase. Trigger with: "run a security audit"

Set up hosting/deployment — scaffold the Pi 5 + Cloudflare Tunnel + GitHub Actions CI/CD infrastructure. Trigger with: "scaffold hosting"

Architecture review — check for deviations from nimoh-stack conventions across all 9 epics. Trigger with: "review the architecture"