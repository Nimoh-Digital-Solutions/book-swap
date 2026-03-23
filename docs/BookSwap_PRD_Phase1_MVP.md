# BookSwap — Product Requirements Document

## Peer-to-Peer Book Exchange Platform | Phase 1 MVP

| Field | Detail |
|-------|--------|
| **Version** | 1.0 |
| **Date** | February 2026 |
| **Author** | thrilled (Solo Founder) |
| **Status** | Draft — Phase 1 MVP |
| **Launch Market** | Global (initial focus: Amsterdam, Netherlands) |

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Core Data Model](#8-core-data-model)
9. [Exchange Flow](#9-exchange-flow)
10. [Success Metrics](#10-success-metrics)
11. [Open Questions](#11-open-questions)
12. [Timeline & Phasing](#12-timeline--phasing)
13. [Appendix: Initial Launch Context (Amsterdam)](#13-appendix-initial-launch-context-amsterdam)

---

## 1. Problem Statement

People who love reading physical books face a limited set of options when they finish a book and want something new to read: buy another book (expensive over time), borrow from a library (limited selection, fixed return windows, registration overhead), or let finished books collect dust on shelves. Meanwhile, their neighbors may own the exact book they want — and vice versa — but there is no efficient way to discover this or arrange an exchange.

This problem is universal. In any city or town with a reading community, thousands of read-once books sit idle on shelves while nearby readers would happily swap for them. Dense urban areas amplify the opportunity — more books within walking or cycling distance — but the platform is designed to work wherever readers are, from major cities to smaller communities.

**Impact of not solving this:**

- Readers continue spending €150–300+/year on new books they read once.
- Thousands of read books sit idle on shelves across neighborhoods worldwide.
- No social infrastructure exists for book lovers to connect locally.
- Environmental cost of producing new books when perfectly good copies exist nearby.

---

## 2. Goals

Phase 1 MVP goals are focused on validating the core exchange loop before investing in scaling. Initial marketing will focus on Amsterdam, but the platform is open to users anywhere.

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Validate that readers will list books and request exchanges through the platform | 500+ books listed within 8 weeks of launch |
| G2 | Prove the book partner matching concept works for in-person exchanges | 50+ completed exchanges within 12 weeks of launch |
| G3 | Achieve sufficient book density in target neighborhoods that new users find relevant books on first visit | 80% of new users in target area see 10+ books within 5km on first session |
| G4 | Build a trust model that makes users comfortable meeting strangers to swap books | <5% of partner requests result in disputes or safety complaints |
| G5 | Demonstrate retention — users come back for a second exchange | 30%+ of users who complete one exchange complete a second within 60 days |

---

## 3. Non-Goals (Explicitly Out of Scope for Phase 1)

| Non-Goal | Rationale |
|----------|-----------|
| **Native mobile app (iOS/Android)** | MVP is web-only (responsive). Native apps add months of development and app store review time. Will reassess after validating product-market fit. |
| **Active marketing beyond Amsterdam** | Initial community-building efforts focus on Amsterdam. The platform is available globally, but targeted growth campaigns for other cities come after validating product-market fit. |
| **Monetization / payments** | Platform is completely free in Phase 1. Revenue model is premature before achieving user density and validated exchange volume. |
| **Book selling or cash transactions** | The core value proposition is exchange, not commerce. Adding payments introduces regulatory, tax, and payment processing complexity. |
| **AI book recommendations** | Nice to have but not core to validating the exchange loop. Simple genre/category filtering is sufficient for MVP. |
| **Social features (book clubs, reading challenges, reviews)** | Community features are a Phase 2 retention lever. Phase 1 must validate the basic exchange works first. |
| **Automated book value assessment** | Users self-assess condition. Automated pricing adds complexity without clear MVP value. |

---

## 4. User Stories

### 4.1 New User (Onboarding)

- As a **new visitor**, I want to understand what BookSwap is and how it works within 30 seconds of landing on the site so that I can decide if this is worth signing up for.
- As a **new user**, I want to sign up quickly with email or Google/Apple auth so that I don't abandon registration due to friction.
- As a **new user**, I want to set my approximate location (neighborhood) during onboarding so that the platform can show me relevant nearby books immediately.
- As a **new user**, I want to browse available books near me before listing my own so that I can see value before committing effort.

### 4.2 Book Owner (Listing)

- As a **book owner**, I want to add a book to my shelf by scanning the ISBN barcode or searching by title/author so that listing is fast and pre-fills book metadata (cover, title, author, description).
- As a **book owner**, I want to upload 1–3 photos of my actual book's condition so that potential swap partners can see exactly what they're getting.
- As a **book owner**, I want to set the condition (New / Like New / Good / Acceptable) and add optional notes so that expectations are clear before any exchange.
- As a **book owner**, I want to indicate what genres or specific books I'm hoping to receive in exchange so that the platform can suggest better matches.
- As a **book owner**, I want to edit or remove my listings at any time so that my shelf reflects only books I'm currently willing to swap.

### 4.3 Book Seeker (Discovery)

- As a **book seeker**, I want to search for books by title, author, genre, or ISBN so that I can find specific books I want to read.
- As a **book seeker**, I want to filter results by distance (1km, 3km, 5km, 10km, 25km) from my location so that I only see books I can realistically pick up.
- As a **book seeker**, I want to see the book's condition, photos, and the owner's profile (ratings, number of swaps) so that I can assess trustworthiness before requesting a swap.
- As a **book seeker**, I want to save books to a wishlist for later so that I can track books I'm interested in and get notified if a swap becomes available.

### 4.4 Exchange Flow (Book Partner)

- As a **book seeker**, I want to send a "Book Partner Request" to a book owner, proposing which of my books I'd offer in exchange so that the owner can evaluate whether the swap is fair.
- As a **book owner**, I want to review incoming partner requests, see the proposed book, and accept or decline so that I stay in control of who I swap with.
- As a **matched user**, I want both of us to see and accept the platform's exchange conditions (care for the book, return expectations, meeting safety guidelines) before personal details are shared so that both parties agree to the same standards before proceeding.
- As a **book partner**, I want to message my swap partner through in-app chat to arrange a meetup time and location so that I don't need to share my phone number or personal contact details.
- As a **book partner**, I want to mark the exchange as "completed" after we've met and swapped so that our swap histories update and books move to the correct shelves.
- As a **book partner**, I want to rate my swap partner after the exchange (1–5 stars + optional comment) so that future users can assess trustworthiness.

### 4.5 Trust & Safety

- As a **user**, I want to verify my email address and optionally connect a social account (Google, Apple) so that other users see I'm a verified real person.
- As a **user**, I want to report inappropriate behavior, no-shows, or damaged books so that the platform can act on bad actors.
- As a **user**, I want to block another user so they can't see my profile or send me requests so that I feel safe using the platform.
- As a **user**, I want to control my location precision (neighborhood only, not exact address) and choose what profile info is visible so that my privacy is protected by default.

---

## 5. Functional Requirements

### 5.1 Authentication & User Profile

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| A-1 | **P0** | Email + password registration with email verification | User receives verification email within 60s. Account is inactive until verified. |
| A-2 | **P0** | OAuth2 login via Google and Apple | One-tap sign-in works. Account links to OAuth provider. No duplicate accounts for same email. |
| A-3 | **P0** | User profile: display name, bio, neighborhood, profile photo, preferred genres | All fields editable. Display name is unique. Neighborhood auto-suggested via geocoding based on user's location. |
| A-4 | **P0** | Location setup during onboarding: user places pin on map or enters postcode | Location stored as PostGIS point. Snapped to neighborhood centroid for privacy. Changeable later. |
| A-5 | P1 | Password reset via email link | Reset link expires after 1 hour. Old sessions invalidated on password change. |
| A-6 | P1 | Account deletion (GDPR right to erasure) | **Soft delete + anonymize.** User clicks "Delete my account" → account set to `is_active=False`, listings hidden immediately, confirmation email sent. 30-day grace period (user can log back in to cancel). After 30 days a Celery Beat task anonymizes PII (name → "Deleted User", email → SHA-256 hash, DOB → null, location → null, profile photo → hard-deleted from disk). Exchange history rows preserved with anonymized foreign keys for audit trail. Books/listings hard-deleted. Process is irreversible after the 30-day window. |

### 5.2 Book Listing & Management

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| B-1 | **P0** | Add book via ISBN barcode scan (camera) or manual ISBN/title/author search | ISBN lookup returns cover image, title, author, description from Open Library API or Google Books API. Manual entry fallback if ISBN not found. |
| B-2 | **P0** | Upload 1–3 photos of the book's actual condition | Max 5MB per image upload. Accepted formats: JPEG, PNG, WebP. At least 1 photo required. **Dual-layer validation:** frontend rejects wrong file types/oversized files for fast UX; backend enforces via magic-byte (file header) validation, size limit, and Pillow-based re-save (strips EXIF, re-compresses to max 1MB for storage). Stored on local external storage (2TB) for MVP; migrate to Cloudflare R2 in Phase 2. |
| B-3 | **P0** | Set condition rating: New / Like New / Good / Acceptable | Each condition level has a tooltip description. Condition is displayed on listing cards and detail pages. |
| B-4 | **P0** | Set book genre/category from predefined list + language tag (English, Dutch, Other) | Genre list is multi-select (max 3). Language is required. Filterable in search. |
| B-5 | **P0** | "My Shelf" dashboard showing all listed books with status (Available / In Exchange / Returned) | User can edit or remove any listing. Status transitions are automatic based on exchange flow. |
| B-6 | P1 | "Looking For" wishlist: specify books/genres user wants to receive in exchange | Wishlist items visible on user's profile. Used for match suggestions in future phases. |

### 5.3 Discovery & Search

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| C-1 | **P0** | Browse nearby books: default view shows available books within user's selected radius, sorted by distance | PostGIS ST_DWithin query with GiST index. Default radius: 5km. Results paginated (20 per page). Distance displayed on each card. |
| C-2 | **P0** | Distance filter: 1km, 3km, 5km, 10km, 25km radius options | Changing radius updates results immediately without page reload. Selection persisted in user preferences. |
| C-3 | **P0** | Search by title, author, or ISBN with text search | Full-text search using PostgreSQL ts_vector. Results ranked by relevance, then distance. Partial matches supported. |
| C-4 | **P0** | Filter by: genre, language (English/Dutch/Other), condition | Filters are combinable. Active filters shown as chips with clear option. Counts update dynamically. |
| C-5 | P1 | Map view: see book locations plotted on an OpenStreetMap/Leaflet map | Map shows approximate locations (neighborhood level). Clickable pins show book card. Clusters at zoom-out levels. |
| C-6 | **P0** | Empty state: no nearby books | **Hybrid approach.** When zero books match the radius: (1) encouraging message + prominent "Add your first book" CTA to drive supply, (2) "Show books anywhere" toggle that removes the distance filter to prevent dead-platform feeling. Both behaviors serve different user intents (listing vs. browsing). |

### 5.4 Exchange Flow (Book Partner System)

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| D-1 | **P0** | Send a Book Partner Request: select a book you want + propose one of your books in exchange | Request includes: requested book ID, offered book ID, optional message. Owner receives notification. Requester can cancel before acceptance. |
| D-2 | **P0** | Owner can Accept, Decline, or Counter (suggest a different book from requester's shelf) | Accept triggers conditions step. Decline sends notification with optional reason. Counter shows owner browsing requester's shelf. |
| D-3 | **P0** | Exchange Conditions Agreement: both users must accept conditions before proceeding | Conditions displayed as a scrollable agreement. Both users must check "I agree" and confirm. Until both agree, no personal details or chat access is granted. |
| D-4 | **P0** | In-app messaging between accepted book partners | **Async messaging (not real-time for MVP).** Simple threaded messages via REST API (POST/GET). Messages persisted in DB. Image sharing via attachment upload. Thread locked after exchange is completed or cancelled. "New message" email notification sent via Celery. Upgrade to real-time WebSocket delivery in Phase 2. |
| D-5 | **P0** | Mark exchange as "Completed" — both users confirm the swap happened | Both users must confirm. After both confirm: books move to "In Exchange" status. Swap recorded in both users' history. Rating prompt triggered. |
| D-6 | **P0** | Rate your partner (1–5 stars + optional text) after exchange completion | Rating is optional but prompted. Average rating shown on profile. Minimum 3 ratings before average is displayed publicly. |
| D-7 | P1 | Book return flow: either partner can initiate a return request via messaging | Return is arranged informally via existing message thread. Both confirm return. Books return to "Available" on shelves. |

### 5.5 Trust, Safety & Privacy

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| E-1 | **P0** | Email verification required before listing books or sending requests | Unverified users can browse only. Verification prompt shown on gated actions. |
| E-2 | **P0** | Location privacy: store neighborhood centroid, never exact user address | PostGIS point snapped to nearest 500m grid. Distance shown as approximate ("~2.3km away"). Users never see each other's exact location. |
| E-3 | **P0** | Report user / report listing functionality | Report form with categories (inappropriate content, no-show, damaged book, harassment). Reports stored in DB and visible in Django admin. **Celery task sends email notification to founder on every new report** for immediate triage. Founder resolves via Django admin (dismiss / warn user / ban user / remove listing). No SLA for MVP — best-effort response. |
| E-4 | **P0** | Block user: prevents all interaction between two users | Blocked user cannot see blocker's profile, listings, or send requests. Existing chats hidden. Bidirectional block. |
| E-5 | **P0** | GDPR-compliant privacy policy and cookie consent | **Ship with well-structured DIY template; lawyer review within 3 months of launch.** Privacy policy + Terms of Service in Dutch and English, written from a GDPR-compliant markdown template covering: data collected, legal basis, retention periods, third-party processors (SendGrid, Google Books API), right to erasure (see A-6), location data handling, cookie usage. Cookie consent banner on first visit with accept/reject, consent logged with timestamp. Professional Dutch privacy lawyer review scheduled before any marketing push. Compliant with Dutch UAVG and EU GDPR. DPIA conducted for location data. |
| E-6 | **P0** | Exchange conditions document that both users accept before sharing details | Covers: care for books, meeting in public places, reporting problems, data sharing consent. Timestamped acceptance stored. |
| E-7 | ~~P1~~ **P2** | Safe meetup location suggestions (libraries, cafes, public spaces) | Suggested public locations near both users via geocoding/POI lookup. Shown in message thread as quick-pick options. **Deferred to P2** — users can coordinate meetup locations via messaging. |

### 5.6 Notifications

| ID | Priority | Requirement | Acceptance Criteria |
|----|----------|-------------|---------------------|
| F-1 | **P0** | Email notifications for: new partner request received, request accepted/declined, new chat message | Emails sent within 2 minutes of event. Unsubscribe link in every email. Notification preferences page. |
| F-2 | P1 | In-app notification bell with unread count | Polled badge count (REST endpoint, frontend polls every 30s). Click opens notification list. Mark as read / mark all as read. Upgrade to real-time push via WebSocket in Phase 2. |
| F-3 | P2 | Push notifications (browser / PWA) | Opt-in only. Respects notification preferences. Web Push API. |

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Page load time (initial) | < 2 seconds on 4G connection |
| Performance | Nearby books query response | < 200ms for PostGIS spatial query with 10K+ records |
| Scalability | Support concurrent users | 500 concurrent users at MVP launch |
| Security | Data encryption | HTTPS everywhere. Passwords hashed (bcrypt). JWTs with short expiry + refresh tokens. |
| Security | Image upload security | Dual-layer validation: frontend rejects by extension + size; backend validates magic bytes (not just extension), enforces 5MB upload limit, re-saves via Pillow to strip metadata/exploits. No virus scanning for MVP (Pi5 constraint). |
| Accessibility | WCAG 2.1 Level AA compliance | Screen reader compatible. Keyboard navigable. Sufficient color contrast. |
| Localization | Language support | English (primary) + Dutch. UI framework supports i18n for future languages. |
| Responsive | Mobile-first responsive design | Fully functional on screens 320px–1920px. Touch-friendly on mobile. |
| Availability | Uptime target | 99.5% monthly (~3.6hrs downtime/month for solo maintainer) |
| Compliance | GDPR + Dutch UAVG | Privacy by design. Data minimization. Right to erasure via soft-delete + 30-day anonymize pipeline (see A-6). DPIA conducted for location data. |

---

## 7. Technical Architecture

> **Note:** This section reflects the actual implementation stack, as documented in `BookSwap_Technical_Architecture.md` and already scaffolded in the codebase.

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Database | PostgreSQL 16 + PostGIS 3.4 | Spatial queries for nearby-book discovery. Full-text search built in. Mature, reliable. |
| Backend | Django 5.1+ / DRF / nimoh-be-django-base | Batteries-included ORM, admin, migrations, permissions. DRF for REST API. nimoh-base provides auth, monitoring, social login scaffolding. |
| Frontend | React 19 / Vite / TypeScript | SPA with TanStack Query v5, Zustand v5, React Hook Form + Zod. tast-* UI component library. PWA-ready. |
| Auth | Simple JWT (httpOnly cookies) + nimoh-base social auth | Access + refresh token rotation. Google/Apple OAuth via python-social-auth. CSRF double-submit pattern. |
| Image Storage | **MVP:** Local external storage (2TB drive on Pi5) mounted at `/mnt/bookswap-media`, served via Nginx. **Phase 2:** Cloudflare R2 (S3-compatible) with CDN + django-storages. | Local storage avoids external dependency for MVP. Nginx serves static media efficiently. No backup for MVP — acceptable risk; Phase 2 R2 migration is the mitigation. Migration path is straightforward via django-storages swap. |
| Real-time | ~~Django Channels (WebSocket)~~ **Deferred to Phase 2.** | MVP uses async REST messaging + Celery email notifications. Django Channels + Redis channel layer added in Phase 2 for real-time chat delivery and live notification badges. |
| Task Queue | Celery + Celery Beat + Redis | Email dispatch, image processing, periodic maintenance tasks. |
| Email | SendGrid | Transactional email via nimoh-base integration. |
| Book Data API | Open Library API + Google Books API (fallback) | Free, no API key needed for Open Library. ISBN lookup returns metadata + cover images. |
| Maps | Leaflet + OpenStreetMap tiles | Free, open-source. No API key required. Fully functional map for book locations. |
| Hosting | Docker Compose on Raspberry Pi 5 / Cloudflare Tunnel | Self-hosted. Zero monthly hosting cost. Staging + production environments. |
| CI/CD | GitHub Actions (self-hosted runner on Pi5) | **Quality gates:** lint + type-check + tests (backend + frontend) must all pass. Auto-deploy to staging on `main` merge. Manual promote to prod via GitHub environment approval. Playwright E2E smoke tests added post-MVP when real pages exist. |
| Backups | Daily `pg_dump` cron → `/mnt/bookswap-media/backups/` | Covers DB corruption, accidental deletes, botched migrations. Retains 7 daily dumps (rotate oldest). Does not protect against external drive failure — acceptable MVP risk; Phase 2 R2 migration + off-site sync. |

---

## 8. Core Data Model

Simplified schema for the MVP. All tables live in PostgreSQL with PostGIS extension enabled.

| Table | Key Columns | Notes |
|-------|-------------|-------|
| **users** | id, email, display_name, bio, avatar_url, location (GEOMETRY Point 4326), neighborhood, preferred_genres[], language, avg_rating, swap_count, coc_accepted_at, coc_version, created_at | Exact coords stored for accurate distance queries. API serializer snaps to 500m grid on read (other users never see exact location). CoC accepted once at registration (versioned). Users must re-accept if coc_version is bumped. |
| **books** | id, owner_id (FK users), isbn, title, author, description, cover_url, condition (enum), genre[], language, status (enum: available/in_exchange/swapped/returned), available_for_swap (bool), available_for_lend (bool), photos[] (urls), notes, created_at | At least one of available_for_swap / available_for_lend must be true (DB check constraint). Status managed by exchange flow triggers. Full-text search index on title + author. |
| **exchange_requests** | id, requester_id, owner_id, requested_book_id, offered_book_id (nullable), exchange_type (enum: swap/lend), lend_terms_accepted (bool, default false), status (enum: pending/accepted/declined/cancelled/completed), message, created_at, updated_at | exchange_type=swap requires offered_book_id (DB check constraint). exchange_type=lend: offered_book_id is null, lend_terms_accepted must be true (inline checkbox on request form: "I agree to return this book as agreed with the owner"). Status transitions enforced by database constraints. Only one active request per book pair. |
| ~~**conditions_acceptance**~~ | ~~id, exchange_id (FK), user_id (FK), accepted_at, conditions_version~~ | **REMOVED** — CoC accepted once at registration (stored on users table). Lend acknowledgment is an inline checkbox on the exchange request form (stored on exchange_requests as lend_terms_accepted). No per-exchange blocking step. |
| **messages** | id, exchange_id (FK), sender_id, content, image_url (optional), read_at, created_at | Async REST messaging (polled). Only exchange participants can read/write. Real-time push deferred to Phase 2. |
| **ratings** | id, exchange_id (FK), rater_id, rated_id, score (1–5), comment, created_at | One rating per user per exchange. Triggers avg_rating update on users table. |
| **reports** | id, reporter_id, reported_user_id, reported_book_id (nullable), category (enum), description, status (enum: open/reviewed/resolved), created_at | Admin-only access for resolution. |
| **blocks** | id, blocker_id, blocked_id, created_at | Enforced at query level: blocked users filtered from all search results and profile views. |
| **wishlists** | id, user_id, isbn (nullable), title (nullable), genre (nullable), created_at | P1 feature. Can match on ISBN or genre for future match suggestions. |

**Key spatial index:** `CREATE INDEX idx_users_location ON users USING GIST (location);` — enables sub-200ms proximity queries at scale.

---

## 9. Exchange Flow (State Machine)

The exchange lifecycle follows a strict state machine to ensure both users stay in sync:

| Step | State | Trigger | What Happens |
|------|-------|---------|--------------|
| 1 | **BROWSE** | User finds a book they want | User views book detail + owner profile |
| 2 | **REQUEST_SENT** | User sends Book Partner Request (selects their offered book) | Owner notified via email. Book remains visible to others. |
| 3a | **DECLINED** | Owner declines the request | Requester notified. Both books stay Available. No further action. |
| 3b | **ACCEPTED** | Owner accepts the request | Messaging unlocked immediately. Both books marked "In Exchange." Users arrange meetup via messages. |
| 4 | **ACTIVE** | Messaging ongoing | Users coordinate the handover details. |
| 6 | **SWAP_CONFIRMED** | Both users confirm the physical handover happened | Exchange recorded. Rating prompt shown. Swap count incremented for both users. |
| 7a | **COMPLETED** (swap) | Both users have rated (or skipped rating) | Exchange archived. Both books marked "swapped" and removed from original owner's shelf. New owner can re-list as a fresh listing. |
| 7b | **LENT** (lend) | Both users have rated (or skipped rating after handover) | Borrowed book marked "in_exchange". Owner retains the listing. Borrower sees it in "My Borrowed Books". |
| 8 | **RETURN_CONFIRMED** (lend only) | Both users confirm the book was returned | Book status reset to "available". Return rating prompt shown. |

---

## 10. Success Metrics

### 10.1 Leading Indicators (Week 1–4)

| Metric | Target (Week 4) | Red Flag If |
|--------|-----------------|-------------|
| Registered users | 200+ | < 50 |
| Books listed | 500+ (incl. seeded inventory) | < 150 after seeding |
| Partner requests sent | 50+ | < 10 |
| Request acceptance rate | > 50% | < 25% |
| Avg. books listed per active user | 3+ | < 1.5 |

### 10.2 Lagging Indicators (Week 4–12)

| Metric | Target (Week 12) | Red Flag If |
|--------|-------------------|-------------|
| Completed exchanges | 50+ | < 15 |
| Repeat exchange rate | 30%+ users do a 2nd swap within 60 days | < 15% |
| Average user rating | > 4.0 / 5.0 | < 3.5 |
| Dispute / report rate | < 5% of exchanges | > 10% |
| NPS (Net Promoter Score) | > 40 | < 20 |
| Organic signups (non-seeded) | 100+ from word-of-mouth / referral | < 30 |

---

## 11. Open Questions

| # | Question | Owner | Impact |
|---|----------|-------|--------|
| Q1 | ~~Should we require both books to be of similar retail value, or let users decide what's a fair swap?~~ **RESOLVED:** Trust-based — users decide. Show estimated retail value from Google Books API as informational only (no enforcement). | Product / Founder | High — affects core UX |
| Q2 | ~~What specific conditions should be in the Exchange Conditions agreement? Need legal review for Dutch law.~~ **RESOLVED:** Community code of conduct, not a legal contract. BookSwap is a marketplace with zero liability. Content: treat books with care, meet in public places, report problems, be honest about condition. Static versioned markdown, "I agree" checkbox, timestamped acceptance. No lawyer needed pre-launch. | Legal | High — blocks D-3 |
| Q3 | ~~ISBN barcode scanning via web browser camera: is the UX good enough on mobile browsers, or wait for native app?~~ **RESOLVED:** Manual ISBN entry is the primary flow. Barcode scanning added as progressive enhancement — "Scan barcode" button shown only when `getUserMedia` is available, graceful fallback to text input if not. No camera dependency for MVP. | Engineering | Medium — fallback exists |
| Q4 | ~~How do we handle books without ISBNs (vintage, self-published)? Manual entry only or different flow?~~ **RESOLVED:** Manual entry fallback — user types title, author, condition manually and uploads their own photos. `isbn` field is nullable. No special flow needed. | Product / Engineering | Low — manual entry works |
| Q5 | ~~Do we need age verification for Dutch privacy compliance (under-16s and GDPR parental consent)?~~ **RESOLVED:** Hard gate — 16+ only. Registration form includes a date-of-birth field. Under 16 = "Sorry, you must be 16 or older to use BookSwap." DOB stored but not displayed publicly. Zero legal risk, loses a negligible audience segment. | Legal | High — GDPR |
| Q6 | ~~Should we support multiple simultaneous exchanges per user, or limit to 1 active exchange for MVP?~~ **RESOLVED:** Multiple simultaneous exchanges allowed, capped at 5 active exchanges per user. Backend enforces the cap — attempting to create a 6th returns a 429 with a clear message. "My Exchanges" page shows a list view. | Product / Founder | Medium — UX complexity |
| Q7 | ~~Moderation strategy: manual review by founder, community moderation, or automated?~~ **RESOLVED:** Founder-only manual review via Django Admin. Reports (flagged listings, user complaints) land in a Django Admin queue. Founder reviews and acts (warn, remove listing, suspend user). No community moderation or automated tooling for MVP — add later when volume demands it. | Product / Founder | Medium — scales with users |
| Q8 | ~~Is "BookSwap" available as domain and trademark in NL? Check domain + KVK/trademark registry.~~ **RESOLVED:** Primary domain: **book-swap.com** (owned). Secondary/NL alias: **shelfswap.nl** (owned). Product name remains "BookSwap" in UI and docs — the hyphen is domain-only. Trademark registration deferred until traction warrants it; "BookSwap" is descriptive so trademark protection is weak regardless. No blocker for development. | Founder / Legal | High — brand identity |

---

## 12. Timeline & Phasing

### 12.1 Phase 1 MVP Timeline (Solo Founder)

| Week | Sprint Focus | Deliverables | Dependencies |
|------|-------------|--------------|--------------|
| 1–2 | Foundation | PostgreSQL + PostGIS setup, Django models, auth (email + Google), user profile, DB schema, CI/CD pipeline | Domain registered. Docker infrastructure ready. |
| 3–4 | Book Listing | Add book flow (ISBN lookup + manual). Photo upload. Condition rating. My Shelf dashboard. Book detail page. | Open Library API integration tested. |
| 5–6 | Discovery | Nearby books feed. Distance filter. Text search. Genre/language filters. Book cards with distance. | PostGIS spatial queries optimized. |
| 7–8 | Exchange Flow | Partner request. Accept/decline. Conditions agreement. In-app chat. Exchange confirmation. Rating system. | Exchange conditions document finalized (Q2). |
| 9–10 | Trust & Polish | Report/block. Email notifications. Privacy policy (NL+EN). GDPR compliance. Responsive polish. Error handling. | Legal review of privacy policy. |
| 11–12 | Closed Beta | **Closed beta with ~20 invite-only users** who each commit to listing ≥3 books. Founder seeds personal collection first (20–50 books). Gather feedback, fix critical bugs, performance tuning. Target: 100+ real books listed before public launch. | Beta testers recruited via personal network. Invite-code system or manual account creation via Django admin. |
| 13+ | Public Launch | Remove invite gate. Launch publicly with community outreach in Amsterdam (Meetup groups, expat forums, university boards). Open to users worldwide. Monitor metrics against G1/G2 goals. | Launch marketing materials ready. Pre-production checklist complete (see §12.3). |

### 12.2 Hard Deadlines & Dependencies

- GDPR compliance must be in place before any public launch (Dutch UAVG + EU GDPR). No user data collected without privacy policy and consent flow.
- Exchange conditions document must be reviewed for Dutch civil law before the partner request feature goes live (Q2).
- Open Library API rate limits need to be tested under load. If insufficient, Google Books API integration must be ready as fallback.
- Initial community partnerships (Amsterdam Meetup groups, expat forums) should be established during weeks 9–12, before public launch.

### 12.3 Pre-Production Launch Checklist

All items must be completed before the first public-facing deploy:

- [ ] **Seeding complete** — Founder's personal book collection listed (≥20 books). ≥15 closed-beta users have registered and listed ≥3 books each.
- [ ] **Privacy policy & ToS live** — Dutch + English, accessible from footer and registration flow.
- [ ] **Cookie consent banner** — Functional with accept/reject, consent logged.
- [ ] **Community Code of Conduct** — Published, versioned, acceptance flow tested.
- [ ] **GDPR right to erasure** — Account deletion flow functional (soft-delete + 30-day anonymize pipeline tested).
- [ ] **Age gate** — DOB field on registration, under-16 rejection working.
- [ ] **Image upload security** — Dual-layer validation (frontend + backend magic bytes + Pillow re-save) tested.
- [ ] **Email delivery** — SendGrid verified, transactional emails (verification, password reset, exchange notifications) tested.
- [ ] **Backups** — Daily `pg_dump` cron running, 7-day rotation confirmed.
- [ ] **CI/CD green** — All quality gates passing (lint, type-check, tests). Staging deploy working.
- [ ] **Monitoring** — Error tracking (Sentry) configured. Basic uptime check in place.
- [ ] **DNS & SSL** — book-swap.com and shelfswap.nl resolving through Cloudflare Tunnel. HTTPS enforced.
- [ ] **Beta feedback round** — At least one full exchange cycle (request → accept → meetup → confirm → rate) completed by beta testers.
- [ ] **Lawyer review scheduled** — Dutch privacy lawyer engagement confirmed for within 3 months of launch.

### 12.4 Phase 2 Preview (Post-MVP)

Not in scope for this PRD, but planned for after MVP validation:

- Native mobile apps (React Native) — only after web MVP achieves 50+ completed exchanges
- Push notifications and PWA support
- Wishlist matching (notify when a desired book becomes available nearby)
- Map view with clustered book pins
- Community features: reading challenges, book clubs, swap events
- Freemium monetization: premium listings, extended swap history, analytics
- Targeted growth campaigns for additional cities (Rotterdam, The Hague, Utrecht, and beyond)

---

## 13. Appendix: Initial Launch Context (Amsterdam)

> **Note:** The platform is available globally, but initial marketing and community-building will focus on Amsterdam. The data below supports why Amsterdam is an ideal seed market.

| Factor | Detail |
|--------|--------|
| Population | ~920,000 residents (1.4M urban area) |
| Density | 4,908 people/km² — excellent for proximity matching |
| Diversity | 176 nationalities. ~30% of some neighborhoods are expats. Massive multilingual book demand. |
| Literacy | 99% adult literacy rate. Netherlands ranks 4th globally in language proficiency. |
| English proficiency | Netherlands consistently #1 globally in English as second language (EF EPI). English UI accessible to nearly all. |
| Mobility | Bike-first city. Meeting someone 3–5km away is a 15-minute bike ride. Lower friction than car-dependent cities. |
| Book pricing | Dutch Fixed Book Price law means books cannot be discounted. New books are expensive → strong incentive to swap. |
| Target neighborhoods | De Pijp, Jordaan, Oud-West, Oost Watergraafsmeer (high expat density, young professionals, strong community culture) |
| Existing communities | Active Meetup.com groups, expat Facebook groups, university reading circles (UvA, VU), Little Free Libraries. |

---

*— End of Document —*
