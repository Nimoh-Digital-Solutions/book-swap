# BookSwap — Technical Architecture Document

## Phase 1 MVP | Django + React PWA

| Field | Detail |
|-------|--------|
| **Version** | 1.0 |
| **Date** | February 2026 |
| **Author** | thrilled (Solo Founder) |
| **Parent Documents** | BookSwap PRD v1.0, User Stories Spec v1.0 |
| **Status** | Draft |

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [AI/LLM Integration](#7-aillm-integration)
8. [API Contract](#8-api-contract)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Security & Compliance](#10-security--compliance)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Development Workflow](#12-development-workflow)

---

## 1. System Overview

### 1.1 High-Level Architecture

BookSwap follows a **decoupled client-server architecture** with a React PWA frontend communicating with a Django REST API backend over HTTPS. The system is designed for a solo founder building iteratively, prioritizing simplicity, maintainability, and low operational overhead.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │  React PWA   │    │  React PWA   │    │  React PWA   │          │
│   │  (Desktop)   │    │  (Mobile)    │    │  (Tablet)    │          │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│          │                   │                   │                    │
│          └───────────────────┼───────────────────┘                   │
│                              │                                       │
│                         HTTPS/WSS                                    │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                         EDGE LAYER                                    │
│                              │                                       │
│                    ┌─────────▼─────────┐                             │
│                    │   Cloudflare CDN  │                              │
│                    │   (Static + SSL)  │                              │
│                    └─────────┬─────────┘                             │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                       APPLICATION LAYER                               │
│                              │                                       │
│              ┌───────────────┼───────────────┐                       │
│              │               │               │                       │
│    ┌─────────▼────┐  ┌──────▼──────┐  ┌─────▼──────────┐           │
│    │  Django API   │  │  Django     │  │  Celery        │           │
│    │  (DRF)        │  │  Channels   │  │  Workers       │           │
│    │  REST API     │  │  (WebSocket)│  │  (Background)  │           │
│    └─────────┬─────┘  └──────┬──────┘  └─────┬──────────┘          │
│              │               │               │                       │
│              └───────────────┼───────────────┘                       │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                         DATA LAYER                                    │
│              ┌───────────────┼───────────────┐                       │
│              │               │               │                       │
│    ┌─────────▼────┐  ┌──────▼──────┐  ┌─────▼──────────┐           │
│    │  PostgreSQL   │  │    Redis    │  │  Object Storage│           │
│    │  + PostGIS    │  │  (Cache +   │  │  (Cloudflare   │           │
│    │               │  │   Broker)   │  │   R2 / S3)     │           │
│    └──────────────┘  └─────────────┘  └────────────────┘            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                       EXTERNAL SERVICES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Google   │  │ Apple    │  │ Open     │  │ Google Books │         │
│  │ OAuth    │  │ Sign-In  │  │ Library  │  │ API          │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Resend   │  │ Sentry   │  │ Uptime   │  │ OpenAI       │         │
│  │ (Email)  │  │ (Errors) │  │ Robot    │  │ (Phase 2 AI) │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Request Flow (Book Exchange — Core Loop)

1. User taps a book card in the nearby feed (React PWA)
2. React navigates to `/book/:id` — BookDetail page loads via TanStack Query (`GET /api/books/{id}/`)
3. User clicks "Request Swap" — React sends `POST /api/exchanges/` with `{ requested_book_id, offered_book_id, message }` and JWT in Authorization header
4. Django validates JWT (simplejwt), checks permissions (`IsVerifiedUser`), validates input via DRF serializer
5. Django creates `ExchangeRequest` (status: `PENDING`) and dispatches Celery task `send_notification_email`
6. Celery worker renders email template and sends via Resend API; in-app notification saved to DB
7. Book owner receives push via WebSocket (`ws/user/` channel) — notification bell updates in real-time
8. Owner reviews request: `POST /api/exchanges/{id}/accept/` — state machine transitions to `ACCEPTED`
9. Both users accept conditions: `POST /api/exchanges/{id}/accept-conditions/` — when both rows exist, status → `ACTIVE`
10. Chat room unlocked — WebSocket connection established (`ws/chat/{exchange_id}/`), messages delivered via Django Channels
11. After physical meetup: both users confirm swap → status → `SWAP_CONFIRMED` → books marked "In Exchange" → rating prompt shown
12. Both rate partner → status → `COMPLETED` → chat becomes read-only, swap counts incremented

### 1.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend/Backend coupling | Fully decoupled (SPA + REST API) | Independent deployment, clear contract, PWA support |
| Backend framework | Django + DRF | Battle-tested, excellent ORM, PostGIS integration via GeoDjango, large ecosystem |
| Frontend framework | React (Vite) + React Router | Component model, large talent pool, PWA tooling, fast HMR dev experience |
| Real-time | Django Channels (WebSocket) | Integrated with Django auth, same deployment, handles chat + notifications |
| Background tasks | Celery + Redis | Email sending, image processing, scheduled jobs (auto-expire requests, cleanup) |
| Database | PostgreSQL 16 + PostGIS 3.4 | Industry standard for geospatial; GeoDjango provides native ORM integration |
| Caching | Redis | Session cache, query cache, Celery broker, Channels layer — single service for multiple needs |
| Image storage | Cloudflare R2 (S3-compatible) | Zero egress fees, global CDN built-in, S3-compatible API so Django Storages works out of the box |
| PWA strategy | Workbox (via vite-plugin-pwa) | Offline shell, push notifications, installable on mobile — bypasses app stores |

### 1.4 Communication Patterns

| Pattern | Protocol | Use Case |
|---------|----------|----------|
| REST API | HTTPS (JSON) | All CRUD operations, search, auth, file upload |
| WebSocket | WSS | Real-time chat messages, typing indicators, live notifications |
| Background job | Celery task | Email dispatch, image compression, scheduled cleanup, notification batching |
| CDN delivery | HTTPS | Static assets (JS/CSS), book photos, user avatars |

---

## 2. Tech Stack

### 2.1 Complete Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | | | |
| UI Framework | React | 18.x | Component-based UI |
| Build Tool | Vite | 5.x | Fast HMR, optimized builds |
| Routing | React Router | 6.x | Client-side routing, nested layouts |
| State Management | TanStack Query (React Query) | 5.x | Server state, caching, real-time sync |
| Styling | Tailwind CSS | 3.x | Utility-first, responsive, themeable |
| Forms | React Hook Form + Zod | — | Performant forms, schema validation |
| PWA | vite-plugin-pwa (Workbox) | — | Service worker, offline, installable |
| WebSocket client | Native WebSocket API | — | Chat, notifications (lightweight, no library needed) |
| Maps | Leaflet + React Leaflet | — | Book location map view |
| Barcode scanning | @zxing/browser | — | ISBN barcode scan via camera |
| HTTP client | Axios | — | API calls, interceptors for JWT refresh |
| **Backend** | | | |
| Language | Python | 3.12+ | |
| Framework | Django | 5.1+ | ORM, admin, migrations, security |
| REST API | Django REST Framework (DRF) | 3.15+ | Serializers, viewsets, permissions, throttling |
| Geospatial | GeoDjango + PostGIS | — | Spatial queries, distance calculations |
| WebSocket | Django Channels | 4.x | Real-time chat, notifications |
| Background tasks | Celery | 5.x | Async email, image processing, scheduled jobs |
| Auth (JWT) | djangorestframework-simplejwt | — | Access + refresh token management |
| Auth (OAuth) | django-allauth | — | Google, Apple social auth |
| Image handling | Pillow | — | Server-side resize, thumbnail generation |
| File storage | django-storages + boto3 | — | S3-compatible object storage integration |
| CORS | django-cors-headers | — | Frontend-backend cross-origin requests |
| Email | django-anymail (Resend) | — | Transactional email via Resend API |
| API docs | drf-spectacular | — | Auto-generated OpenAPI 3.0 schema + Swagger UI |
| Filtering | django-filter | — | QuerySet filtering on API endpoints |
| **Database** | | | |
| Primary DB | PostgreSQL | 16.x | Relational data, full-text search |
| Geospatial | PostGIS | 3.4+ | Spatial indexes, distance queries |
| Cache / Broker | Redis | 7.x | Query cache, session store, Celery broker, Channels layer |
| **Infrastructure** | | | |
| Hosting (API) | Railway or Render | — | Managed Django hosting, auto-deploy from Git |
| Hosting (Frontend) | Vercel or Cloudflare Pages | — | Static PWA hosting, global CDN |
| Object Storage | Cloudflare R2 | — | Book photos, avatars (zero egress) |
| DNS + CDN | Cloudflare | — | DNS, SSL, DDoS protection, caching |
| Email service | Resend | — | Transactional email (3,000/month free) |
| **Dev Tools** | | | |
| Package manager (Python) | uv | — | Fast dependency resolution (replaces pip) |
| Package manager (JS) | pnpm | — | Fast, disk-efficient |
| Linting (Python) | Ruff | — | Fast linter + formatter (replaces flake8, black, isort) |
| Linting (JS) | ESLint + Prettier | — | Code quality + formatting |
| Testing (Python) | pytest + pytest-django | — | Unit + integration tests |
| Testing (JS) | Vitest + Testing Library | — | Component + integration tests |
| API testing | pytest + DRF test client | — | Endpoint testing |
| CI/CD | GitHub Actions | — | Lint, test, deploy on push |

### 2.2 Why These Choices (Decision Log)

**Django over FastAPI**: Django provides GeoDjango (native PostGIS ORM), the admin panel (instant moderation dashboard), battle-tested auth system, and mature ecosystem. FastAPI is faster at raw throughput but Django's "batteries included" approach saves weeks of development for a solo founder.

**React over Next.js**: Since the backend is Django (not Node.js), there's no benefit to Next.js's SSR/server components — you'd be running two server runtimes. A Vite-built React SPA deployed as a static PWA is simpler, cheaper (static hosting is free), and separates concerns cleanly.

**TanStack Query over Redux**: Redux is overkill for this app. TanStack Query handles server state (API data fetching, caching, invalidation, optimistic updates) which is 90% of the state in this app. The remaining local UI state is handled by React's built-in useState/useContext.

**Django Channels over a separate WebSocket service**: Channels integrates with Django's auth system, so chat messages automatically know which user is connected. Running a separate WebSocket service (Socket.io, etc.) would require duplicating auth logic.

**Celery over Django Q or Huey**: Celery is the industry standard for Django background tasks. It's more complex than alternatives but has better monitoring (Flower), scheduling (Celery Beat), and documentation.

**Cloudflare R2 over AWS S3**: R2 has zero egress fees (S3 charges per GB downloaded). Since book photos are read-heavy (displayed on every card), this saves significant cost at scale. The API is S3-compatible so django-storages works unchanged.

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
bookswap-web/
├── public/
│   ├── favicon.ico
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt
│   └── icons/                     # PWA icons (192x192, 512x512)
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component + router setup
│   ├── sw.ts                      # Service worker (Workbox)
│   │
│   ├── api/                       # API layer
│   │   ├── client.ts              # Axios instance + interceptors
│   │   ├── auth.ts                # Auth endpoints
│   │   ├── books.ts               # Book CRUD endpoints
│   │   ├── exchanges.ts           # Exchange flow endpoints
│   │   ├── messages.ts            # Chat endpoints
│   │   ├── users.ts               # User/profile endpoints
│   │   └── types.ts               # API response types (shared)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Auth state + actions
│   │   ├── useWebSocket.ts        # WebSocket connection manager
│   │   ├── useGeolocation.ts      # Browser geolocation API
│   │   ├── useNearbyBooks.ts      # TanStack Query hook for nearby books
│   │   ├── useExchange.ts         # Exchange flow state
│   │   └── useDebounce.ts         # Input debouncing
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Primitive UI (Button, Input, Modal, Badge, etc.)
│   │   ├── layout/                # Shell, Nav, Footer, Sidebar
│   │   ├── books/                 # BookCard, BookDetail, BookForm, PhotoUpload
│   │   ├── exchange/              # RequestCard, ConditionsModal, SwapConfirm
│   │   ├── chat/                  # ChatWindow, MessageBubble, TypingIndicator
│   │   ├── map/                   # MapView, BookPin, LocationPicker
│   │   └── profile/               # ProfileCard, RatingStars, EditProfile
│   │
│   ├── pages/                     # Route-level page components
│   │   ├── Home.tsx               # Landing page (unauthenticated)
│   │   ├── Browse.tsx             # Nearby books feed + search + filters
│   │   ├── BookDetail.tsx         # Single book detail page
│   │   ├── MyShelf.tsx            # User's listed books
│   │   ├── AddBook.tsx            # Add book (scan or search)
│   │   ├── Requests.tsx           # Incoming/outgoing partner requests
│   │   ├── Exchange.tsx           # Active exchange view (conditions, chat, confirm)
│   │   ├── Profile.tsx            # Public user profile
│   │   ├── Settings.tsx           # Account settings, notifications, privacy
│   │   ├── Login.tsx              # Login page
│   │   ├── Register.tsx           # Registration page
│   │   ├── Onboarding.tsx         # Post-registration location setup
│   │   └── NotFound.tsx           # 404
│   │
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.tsx         # Auth state provider
│   │   ├── NotificationContext.tsx # Live notification state
│   │   └── WebSocketContext.tsx    # WebSocket connection provider
│   │
│   ├── lib/                       # Utility functions
│   │   ├── storage.ts             # localStorage helpers (token, preferences)
│   │   ├── format.ts              # Date, distance, text formatting
│   │   ├── validation.ts          # Zod schemas for forms
│   │   └── constants.ts           # Genres, conditions, radius options
│   │
│   └── styles/
│       └── globals.css            # Tailwind base + custom utilities
│
├── index.html
├── vite.config.ts                 # Vite + PWA plugin config
├── tailwind.config.ts
├── tsconfig.json
├── .env                           # VITE_API_URL, VITE_WS_URL
└── package.json
```

### 3.2 Routing (React Router v6)

```
/                           → Home (landing, public)
/browse                     → Browse nearby books (auth required)
/browse?q=sapiens&genre=nonfiction&radius=5  → Search with filters
/book/:id                   → Book detail page
/book/add                   → Add book (scan or search)
/shelf                      → My Shelf dashboard
/requests                   → Incoming/outgoing partner requests
/exchange/:id               → Exchange flow (conditions → chat → confirm)
/exchange/:id/chat          → Chat within exchange
/profile/:id                → Public user profile
/settings                   → Account settings
/settings/notifications     → Notification preferences
/settings/privacy           → Privacy & data
/login                      → Login
/register                   → Register
/onboarding                 → Post-registration setup
/verify-email/:token        → Email verification handler
/reset-password/:token      → Password reset handler
```

**Route protection**: A `<ProtectedRoute>` wrapper component checks auth state via `useAuth()`. If not authenticated, redirects to `/login?next=/intended/path`. After login, redirects back to the intended path.

### 3.3 State Management Strategy

| State Type | Tool | Example |
|------------|------|---------|
| Server state (API data) | TanStack Query | Book listings, user profiles, exchange data |
| Auth state | React Context + localStorage | JWT tokens, current user info |
| Form state | React Hook Form | Add book form, registration, profile edit |
| WebSocket state | React Context | Chat messages, typing indicators, notifications |
| UI state | React useState | Modal open/close, filter panel, sidebar toggle |
| URL state | React Router (searchParams) | Search query, active filters, current radius |

**TanStack Query cache strategy:**

```typescript
// Nearby books: cache for 60s, refetch on window focus
useQuery({
  queryKey: ['books', 'nearby', { lat, lng, radius, genre, language }],
  queryFn: () => api.books.nearby(params),
  staleTime: 60_000,
  refetchOnWindowFocus: true,
})

// Single book detail: cache for 5 min
useQuery({
  queryKey: ['book', bookId],
  queryFn: () => api.books.get(bookId),
  staleTime: 300_000,
})

// My shelf: cache indefinitely, invalidate on mutation
useQuery({
  queryKey: ['books', 'mine'],
  queryFn: () => api.books.mine(),
  staleTime: Infinity,  // only update via invalidation
})
```

### 3.4 PWA Configuration

```json
// manifest.json
{
  "name": "BookSwap — Swap Books Nearby",
  "short_name": "BookSwap",
  "description": "Exchange books with readers in your neighborhood",
  "start_url": "/browse",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1B4F72",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Service Worker strategy (Workbox):**

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| App shell (HTML/JS/CSS) | StaleWhileRevalidate | Instant load from cache, update in background |
| API responses | NetworkFirst | Fresh data preferred; cache as fallback when offline |
| Book photos | CacheFirst (max 200 items) | Images don't change; large cache for offline browsing |
| Fonts / static assets | CacheFirst (long TTL) | Rarely change; cache aggressively |

**PWA capabilities:**

- Installable: "Add to Home Screen" prompt on supported browsers
- Offline: App shell loads offline; browse shows cached books with "You're offline" banner
- Push notifications (P2/future): Web Push API via service worker for chat messages and partner requests
- Camera access: ISBN barcode scanning via MediaDevices API (requires HTTPS)

### 3.5 WebSocket Integration

```typescript
// WebSocket connection manager (simplified)
// Connects after auth, subscribes to user-specific channels

const WS_URL = import.meta.env.VITE_WS_URL;

function useWebSocket() {
  const { accessToken } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_URL}/ws/user/?token=${accessToken}`);

    ws.onopen = () => console.log('WS connected');
    ws.onclose = (e) => {
      // Auto-reconnect with exponential backoff
      setTimeout(() => reconnect(), Math.min(1000 * 2 ** retryCount, 30000));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Route to appropriate handler based on message type
      switch (data.type) {
        case 'chat.message': handleChatMessage(data); break;
        case 'chat.typing': handleTypingIndicator(data); break;
        case 'notification': handleNotification(data); break;
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [accessToken]);

  return { socket, sendMessage: (data) => socket?.send(JSON.stringify(data)) };
}
```

### 3.6 Image Handling Pipeline

```
User selects photo
  → Client-side validation (type: JPEG/PNG, max 5MB raw)
  → Client-side compression (browser-image-compression)
    → Max dimension: 1200px
    → Quality: 0.8
    → Max file size: 1MB
  → Generate preview (URL.createObjectURL)
  → On form submit: upload to presigned R2 URL
  → Backend stores URL in database
  → CDN serves with on-the-fly transforms:
    → Thumbnail: ?width=300&height=400&fit=cover
    → Detail: ?width=800&quality=85
```

---

## 4. Backend Architecture

### 4.1 Project Structure

```
bookswap-api/
├── config/                        # Project configuration
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py                # Shared settings
│   │   ├── development.py         # Dev overrides (DEBUG=True, local DB)
│   │   ├── production.py          # Prod (env vars, security hardening)
│   │   └── test.py                # Test settings (in-memory, fast)
│   ├── urls.py                    # Root URL configuration
│   ├── asgi.py                    # ASGI entry (Channels + HTTP)
│   ├── wsgi.py                    # WSGI entry (HTTP only, fallback)
│   └── celery.py                  # Celery app configuration
│
├── apps/
│   ├── users/                     # User management
│   │   ├── models.py              # Custom User model + profile fields
│   │   ├── serializers.py         # UserSerializer, ProfileSerializer
│   │   ├── views.py               # Registration, profile CRUD, delete account
│   │   ├── urls.py                # /api/users/...
│   │   ├── permissions.py         # IsVerified, IsOwnerOrReadOnly
│   │   ├── signals.py             # Post-registration hooks
│   │   ├── admin.py               # Admin panel configuration
│   │   └── tests/
│   │
│   ├── books/                     # Book listing & search
│   │   ├── models.py              # Book model (with PostGIS location via owner)
│   │   ├── serializers.py         # BookSerializer, BookListSerializer
│   │   ├── views.py               # CRUD, nearby search, full-text search
│   │   ├── urls.py                # /api/books/...
│   │   ├── filters.py             # Genre, language, condition, distance filters
│   │   ├── services.py            # ISBN lookup (Open Library, Google Books)
│   │   └── tests/
│   │
│   ├── exchanges/                 # Exchange flow (partner system)
│   │   ├── models.py              # ExchangeRequest, ConditionsAcceptance
│   │   ├── serializers.py         # RequestSerializer, ExchangeDetailSerializer
│   │   ├── views.py               # Send/accept/decline/counter/confirm
│   │   ├── urls.py                # /api/exchanges/...
│   │   ├── permissions.py         # IsExchangeParticipant
│   │   ├── state_machine.py       # Exchange state transitions + validation
│   │   ├── signals.py             # On status change: notify, update book status
│   │   └── tests/
│   │
│   ├── messaging/                 # Real-time chat
│   │   ├── models.py              # Message model
│   │   ├── serializers.py         # MessageSerializer
│   │   ├── views.py               # Chat history REST endpoint
│   │   ├── urls.py                # /api/messages/...
│   │   ├── consumers.py           # WebSocket consumer (Django Channels)
│   │   ├── routing.py             # WebSocket URL routing
│   │   └── tests/
│   │
│   ├── ratings/                   # Post-exchange ratings
│   │   ├── models.py              # Rating model
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py                # /api/ratings/...
│   │   └── tests/
│   │
│   ├── notifications/             # Notification system
│   │   ├── models.py              # Notification model
│   │   ├── serializers.py
│   │   ├── views.py               # List, mark read, preferences
│   │   ├── urls.py                # /api/notifications/...
│   │   ├── consumers.py           # WebSocket consumer for live notifications
│   │   ├── services.py            # Create + dispatch notifications
│   │   └── tasks.py               # Celery tasks for email notifications
│   │
│   ├── moderation/                # Trust & safety
│   │   ├── models.py              # Report, Block models
│   │   ├── serializers.py
│   │   ├── views.py               # Report, block/unblock
│   │   ├── urls.py                # /api/reports/..., /api/blocks/...
│   │   └── tests/
│   │
│   └── core/                      # Shared utilities
│       ├── models.py              # BaseModel (created_at, updated_at)
│       ├── permissions.py         # Shared permission classes
│       ├── pagination.py          # Custom pagination class
│       ├── throttling.py          # Rate limiting configuration
│       ├── exceptions.py          # Custom exception handler
│       └── middleware.py          # Request logging, timing
│
├── tasks/                         # Celery tasks (cross-app)
│   ├── email.py                   # Send transactional emails
│   ├── images.py                  # Image processing (resize, thumbnail)
│   ├── cleanup.py                 # Expire old requests, cleanup orphaned images
│   └── scheduled.py               # Celery Beat periodic tasks
│
├── templates/
│   └── emails/                    # Email templates (Django templates or MJML)
│       ├── welcome.html
│       ├── partner_request.html
│       ├── request_accepted.html
│       └── new_message.html
│
├── manage.py
├── requirements/
│   ├── base.txt                   # Shared dependencies
│   ├── development.txt            # Dev tools (debug toolbar, etc.)
│   ├── production.txt             # Production (gunicorn, sentry)
│   └── test.txt                   # Test dependencies
├── pyproject.toml                 # Project metadata + tool config (ruff, pytest)
├── Dockerfile
├── docker-compose.yml             # Local dev: Django + Postgres + Redis
├── .env.example
└── Makefile                       # Common commands (make run, make test, make migrate)
```

### 4.2 Django App Responsibilities

| App | Responsibility | Models | Key Endpoints |
|-----|---------------|--------|---------------|
| `users` | Registration, profiles, auth, GDPR | User | /api/users/, /api/auth/ |
| `books` | Book CRUD, ISBN lookup, nearby search | Book, Wishlist | /api/books/, /api/books/nearby/ |
| `exchanges` | Partner request flow, conditions, confirmation | ExchangeRequest, ConditionsAcceptance | /api/exchanges/ |
| `messaging` | Chat history + WebSocket | Message | /api/messages/, ws/chat/ |
| `ratings` | Post-exchange ratings | Rating | /api/ratings/ |
| `notifications` | Notification CRUD + WebSocket | Notification | /api/notifications/, ws/notifications/ |
| `moderation` | Reports, blocks | Report, Block | /api/reports/, /api/blocks/ |
| `core` | Shared base models, permissions, utils | BaseModel | — |

### 4.3 Key Design Patterns

**ViewSet + Router pattern (DRF):**

```python
# books/views.py
class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]
    filterset_class = BookFilter
    pagination_class = StandardPagination

    def get_queryset(self):
        # Exclude books from blocked users
        blocked_ids = Block.objects.filter(
            Q(blocker=self.request.user) | Q(blocked=self.request.user)
        ).values_list('blocker_id', 'blocked_id')
        excluded = set(chain.from_iterable(blocked_ids)) - {self.request.user.id}

        return Book.objects.filter(
            status='available'
        ).exclude(
            owner_id__in=excluded
        ).select_related('owner')

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """GET /api/books/nearby/?lat=52.36&lng=4.89&radius=5000"""
        lat = float(request.query_params['lat'])
        lng = float(request.query_params['lng'])
        radius = int(request.query_params.get('radius', 5000))  # meters

        user_point = Point(lng, lat, srid=4326)
        queryset = self.get_queryset().filter(
            owner__location__distance_lte=(user_point, D(m=radius))
        ).annotate(
            distance=Distance('owner__location', user_point)
        ).order_by('distance')

        page = self.paginate_queryset(queryset)
        serializer = BookListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
```

**Exchange State Machine:**

```python
# exchanges/state_machine.py
from enum import Enum

class ExchangeState(Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    CONDITIONS_PENDING = 'conditions_pending'
    ACTIVE = 'active'
    SWAP_CONFIRMED = 'swap_confirmed'
    COMPLETED = 'completed'
    DECLINED = 'declined'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'

# Valid state transitions: (current_state, action) → new_state
TRANSITIONS = {
    (ExchangeState.PENDING, 'accept'): ExchangeState.ACCEPTED,
    (ExchangeState.PENDING, 'decline'): ExchangeState.DECLINED,
    (ExchangeState.PENDING, 'cancel'): ExchangeState.CANCELLED,
    (ExchangeState.PENDING, 'expire'): ExchangeState.EXPIRED,
    (ExchangeState.ACCEPTED, 'conditions_met'): ExchangeState.ACTIVE,
    (ExchangeState.ACCEPTED, 'cancel'): ExchangeState.CANCELLED,
    (ExchangeState.ACTIVE, 'confirm_swap'): ExchangeState.SWAP_CONFIRMED,
    (ExchangeState.ACTIVE, 'cancel'): ExchangeState.CANCELLED,
    (ExchangeState.SWAP_CONFIRMED, 'complete'): ExchangeState.COMPLETED,
}

def transition(exchange, action, actor):
    """Attempt a state transition. Raises ValueError if invalid."""
    current = ExchangeState(exchange.status)
    key = (current, action)
    if key not in TRANSITIONS:
        raise ValueError(f"Cannot {action} from state {current.value}")
    exchange.status = TRANSITIONS[key].value
    exchange.save(update_fields=['status', 'updated_at'])
    # Trigger side effects (notifications, book status updates)
    post_transition.send(sender=exchange.__class__, exchange=exchange, action=action, actor=actor)
```

**WebSocket Consumer (Chat):**

```python
# messaging/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.exchange_id = self.scope['url_route']['kwargs']['exchange_id']
        self.room_group = f'chat_{self.exchange_id}'
        self.user = self.scope['user']

        # Verify user is a participant in this exchange
        if not await self.is_participant():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'chat.message':
            message = await self.save_message(content['text'])
            await self.channel_layer.group_send(self.room_group, {
                'type': 'chat_message',
                'message': message,
            })

        elif msg_type == 'chat.typing':
            await self.channel_layer.group_send(self.room_group, {
                'type': 'chat_typing',
                'user_id': self.user.id,
                'display_name': self.user.display_name,
            })

    async def chat_message(self, event):
        await self.send_json(event['message'])

    async def chat_typing(self, event):
        if event['user_id'] != self.user.id:  # Don't echo typing to sender
            await self.send_json({
                'type': 'typing',
                'user': event['display_name'],
            })

    @database_sync_to_async
    def is_participant(self):
        return ExchangeRequest.objects.filter(
            id=self.exchange_id,
            status='active',
        ).filter(
            Q(requester=self.user) | Q(owner=self.user)
        ).exists()

    @database_sync_to_async
    def save_message(self, text):
        msg = Message.objects.create(
            exchange_id=self.exchange_id,
            sender=self.user,
            content=text,
        )
        return MessageSerializer(msg).data
```

### 4.4 Celery Task Example (Exchange Notification)

```python
# apps/notifications/tasks.py
from celery import shared_task
from django.conf import settings
from django.template.loader import render_to_string
from apps.notifications.models import Notification
import resend

@shared_task(bind=True, soft_time_limit=30, time_limit=45, max_retries=1)
def send_exchange_notification(self, exchange_id, event_type):
    """Send email + in-app notification for exchange events."""
    from apps.exchanges.models import ExchangeRequest

    exchange = ExchangeRequest.objects.select_related(
        'requester', 'owner', 'requested_book', 'offered_book'
    ).get(id=exchange_id)

    # Determine recipient and content based on event type
    TEMPLATES = {
        'request_received': {
            'recipient': exchange.owner,
            'title': f'{exchange.requester.display_name} wants to swap books!',
            'email_template': 'emails/partner_request.html',
            'link': f'/exchange/{exchange.id}',
        },
        'request_accepted': {
            'recipient': exchange.requester,
            'title': f'{exchange.owner.display_name} accepted your swap request!',
            'email_template': 'emails/request_accepted.html',
            'link': f'/exchange/{exchange.id}',
        },
        'swap_confirmed': {
            'recipient': None,  # Both users
            'title': 'Swap confirmed — rate your partner!',
            'email_template': 'emails/swap_confirmed.html',
            'link': f'/exchange/{exchange.id}',
        },
    }
    config = TEMPLATES[event_type]

    recipients = [config['recipient']] if config['recipient'] else [exchange.requester, exchange.owner]

    for user in recipients:
        # Check user notification preferences
        prefs = user.notification_prefs or {}
        category = 'exchange_updates'

        # 1. Always create in-app notification
        Notification.objects.create(
            user=user,
            type=event_type,
            title=config['title'],
            body=f'{exchange.requested_book.title} ↔ {exchange.offered_book.title}',
            link=config['link'],
        )

        # 2. Send email if not disabled
        if prefs.get(category, True):
            html = render_to_string(config['email_template'], {
                'user': user,
                'exchange': exchange,
                'frontend_url': settings.FRONTEND_URL,
            })
            try:
                resend.api_key = settings.RESEND_API_KEY
                resend.Emails.send({
                    'from': 'BookSwap <noreply@bookswap.nl>',
                    'to': user.email,
                    'subject': config['title'],
                    'html': html,
                })
            except Exception as exc:
                self.retry(exc=exc, countdown=300)  # Retry in 5 min
```

### 4.5 Middleware Stack

```python
# config/settings/base.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',         # CORS (must be high)
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',     # Not needed for JWT API, but kept for admin
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.core.middleware.RequestTimingMiddleware',   # Log slow requests (>500ms)
]
```

### 4.6 Background Tasks (Celery)

| Task | Trigger | Queue | Priority |
|------|---------|-------|----------|
| `send_email` | Exchange events, new messages | `email` | High |
| `process_book_photo` | Photo upload | `images` | Medium |
| `expire_pending_requests` | Celery Beat (daily) | `cleanup` | Low |
| `expire_pending_conditions` | Celery Beat (daily) | `cleanup` | Low |
| `auto_confirm_stale_swaps` | Celery Beat (weekly) | `cleanup` | Low |
| `cleanup_orphaned_images` | Celery Beat (weekly) | `cleanup` | Low |
| `update_user_rating_averages` | After rating submission | `default` | Medium |
| `send_new_report_alert` | Report submitted | `email` | High |

**Celery Beat schedule:**

```python
# config/celery.py
CELERY_BEAT_SCHEDULE = {
    'expire-pending-requests': {
        'task': 'tasks.cleanup.expire_pending_requests',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM CET
    },
    'expire-pending-conditions': {
        'task': 'tasks.cleanup.expire_pending_conditions',
        'schedule': crontab(hour=3, minute=15),
    },
    'auto-confirm-stale-swaps': {
        'task': 'tasks.cleanup.auto_confirm_stale_swaps',
        'schedule': crontab(hour=4, minute=0, day_of_week=1),  # Weekly Monday
    },
    'cleanup-orphaned-images': {
        'task': 'tasks.cleanup.cleanup_orphaned_images',
        'schedule': crontab(hour=5, minute=0, day_of_week=0),  # Weekly Sunday
    },
}
```

---

## 5. Database Schema

### 5.1 Entity Relationship Overview

```
┌──────────┐     ┌──────────┐     ┌───────────────────┐
│  users   │────<│  books   │────<│ exchange_requests  │
│          │     │          │     │                    │
│ id (PK)  │     │ id (PK)  │     │ id (PK)           │
│ email    │     │ owner_id │     │ requester_id (FK)  │
│ location │     │ isbn     │     │ owner_id (FK)      │
│ ...      │     │ title    │     │ requested_book_id  │
└──────┬───┘     │ status   │     │ offered_book_id    │
       │         │ ...      │     │ status             │
       │         └──────────┘     └─────────┬──────────┘
       │                                    │
       │         ┌──────────┐     ┌─────────▼──────────┐
       │────────<│  blocks  │     │ conditions_accept  │
       │         └──────────┘     └────────────────────┘
       │
       │         ┌──────────┐     ┌──────────────────┐
       │────────<│ ratings  │     │    messages       │
       │         └──────────┘     │ exchange_id (FK)  │
       │                          │ sender_id (FK)    │
       │         ┌──────────────┐ └──────────────────┘
       └────────<│ notifications│
                 └──────────────┘
```

### 5.2 Complete Model Definitions

```python
# apps/users/models.py
from django.contrib.gis.db import models as gis_models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom user model with location and profile fields."""

    # Override default fields
    email = models.EmailField(unique=True)
    username = None  # Remove username, use email for auth

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']

    # Profile
    display_name = models.CharField(max_length=30, unique=True, db_index=True)
    bio = models.CharField(max_length=300, blank=True)
    avatar_url = models.URLField(blank=True)
    preferred_genres = ArrayField(
        models.CharField(max_length=50),
        size=5,
        default=list,
        blank=True,
    )
    preferred_language = models.CharField(
        max_length=10,
        choices=[('en', 'English'), ('nl', 'Dutch'), ('both', 'Both')],
        default='en',
    )

    # Location (PostGIS)
    location = gis_models.PointField(
        geography=True,  # Use geography for meter-based distance calculations
        srid=4326,
        null=True,
        blank=True,
        spatial_index=True,  # GiST index auto-created
    )
    neighborhood = models.CharField(max_length=100, blank=True)

    # Stats (denormalized for performance)
    avg_rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    swap_count = models.PositiveIntegerField(default=0)

    # Auth
    email_verified = models.BooleanField(default=False)
    auth_provider = models.CharField(
        max_length=20,
        choices=[('email', 'Email'), ('google', 'Google'), ('apple', 'Apple')],
        default='email',
    )

    # Preferences
    preferred_radius = models.PositiveIntegerField(default=5000)  # meters
    notification_prefs = models.JSONField(default=dict)  # per-category toggles

    # GDPR
    deletion_requested_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['display_name']),
        ]
```

```python
# apps/books/models.py
class BookCondition(models.TextChoices):
    NEW = 'new', 'New'
    LIKE_NEW = 'like_new', 'Like New'
    GOOD = 'good', 'Good'
    ACCEPTABLE = 'acceptable', 'Acceptable'

class BookStatus(models.TextChoices):
    AVAILABLE = 'available', 'Available'
    IN_EXCHANGE = 'in_exchange', 'In Exchange'
    RETURNED = 'returned', 'Returned'

class Book(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='books')
    isbn = models.CharField(max_length=13, blank=True, db_index=True)
    title = models.CharField(max_length=300, db_index=True)
    author = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    cover_url = models.URLField(blank=True)
    condition = models.CharField(max_length=20, choices=BookCondition.choices)
    genres = ArrayField(
        models.CharField(max_length=50),
        size=3,
        default=list,
    )
    language = models.CharField(max_length=10, choices=[
        ('en', 'English'), ('nl', 'Dutch'), ('de', 'German'),
        ('fr', 'French'), ('es', 'Spanish'), ('other', 'Other'),
    ])
    status = models.CharField(
        max_length=20,
        choices=BookStatus.choices,
        default=BookStatus.AVAILABLE,
        db_index=True,
    )
    photos = ArrayField(models.URLField(), size=3, default=list)
    notes = models.CharField(max_length=200, blank=True)

    # Full-text search vector
    search_vector = SearchVectorField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            GinIndex(fields=['search_vector']),
            models.Index(fields=['status', 'created_at']),
            GinIndex(fields=['genres']),
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update search vector (or use a trigger)
        Book.objects.filter(pk=self.pk).update(
            search_vector=SearchVector('title', weight='A') +
                          SearchVector('author', weight='B')
        )
```

```python
# apps/exchanges/models.py
class ExchangeStatus(models.TextChoices):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    CONDITIONS_PENDING = 'conditions_pending'
    ACTIVE = 'active'
    SWAP_CONFIRMED = 'swap_confirmed'
    COMPLETED = 'completed'
    DECLINED = 'declined'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'

class ExchangeRequest(models.Model):
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    requested_book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='incoming_requests')
    offered_book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='outgoing_requests')
    status = models.CharField(max_length=25, choices=ExchangeStatus.choices, default=ExchangeStatus.PENDING, db_index=True)
    message = models.CharField(max_length=200, blank=True)
    counter_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    # Confirmation timestamps
    requester_confirmed_at = models.DateTimeField(null=True, blank=True)
    owner_confirmed_at = models.DateTimeField(null=True, blank=True)

    # Return flow (P1)
    return_requested_at = models.DateTimeField(null=True, blank=True)
    return_confirmed_requester = models.DateTimeField(null=True, blank=True)
    return_confirmed_owner = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['requester', 'requested_book'],
                condition=Q(status='pending'),
                name='unique_pending_request_per_book',
            ),
        ]
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]


class ConditionsAcceptance(models.Model):
    exchange = models.ForeignKey(ExchangeRequest, on_delete=models.CASCADE, related_name='conditions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    accepted_at = models.DateTimeField(auto_now_add=True)
    conditions_version = models.CharField(max_length=10, default='1.0')

    class Meta:
        unique_together = ('exchange', 'user')
```

```python
# apps/messaging/models.py
class Message(models.Model):
    exchange = models.ForeignKey(ExchangeRequest, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)
    image_url = models.URLField(blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['exchange', 'created_at']),
        ]


# apps/ratings/models.py
class Rating(models.Model):
    exchange = models.ForeignKey(ExchangeRequest, on_delete=models.CASCADE, related_name='ratings')
    rater = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings_given')
    rated = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings_received')
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('exchange', 'rater')


# apps/moderation/models.py
class ReportCategory(models.TextChoices):
    INAPPROPRIATE = 'inappropriate', 'Inappropriate content'
    FAKE_LISTING = 'fake_listing', 'Suspicious or fake listing'
    NO_SHOW = 'no_show', 'No-show at meetup'
    MISREPRESENTED = 'misrepresented', 'Book condition misrepresented'
    HARASSMENT = 'harassment', 'Harassment or threatening behavior'
    SPAM = 'spam', 'Spam'
    OTHER = 'other', 'Other'

class Report(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_filed')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received')
    reported_book = models.ForeignKey(Book, null=True, blank=True, on_delete=models.SET_NULL)
    category = models.CharField(max_length=20, choices=ReportCategory.choices)
    description = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=[
        ('open', 'Open'), ('reviewed', 'Reviewed'), ('resolved', 'Resolved'),
    ], default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')


# apps/notifications/models.py
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30)  # 'partner_request', 'request_accepted', 'new_message', etc.
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=500)
    link = models.CharField(max_length=200, blank=True)  # Frontend route
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'read_at']),
        ]
```

### 5.3 Database Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | location | GiST (spatial) | Proximity queries (ST_DWithin) |
| users | email | B-tree | Login lookup |
| users | display_name | B-tree | Uniqueness check, profile search |
| books | search_vector | GIN | Full-text search on title + author |
| books | (status, created_at) | B-tree | Feed queries (available books, newest first) |
| books | genres | GIN | Array overlap filtering |
| books | isbn | B-tree | ISBN lookup |
| exchange_requests | (status, created_at) | B-tree | Active/pending request queries |
| messages | (exchange, created_at) | B-tree | Chat history pagination |
| notifications | (user, -created_at) | B-tree | Notification feed |
| notifications | (user, read_at) | B-tree | Unread count |

### 5.4 Migration Strategy

- All migrations are auto-generated by Django `makemigrations` and stored in version control.
- PostGIS extension enabled via a RunSQL migration: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Data migrations (e.g., backfilling search vectors) are separate from schema migrations.
- Production migrations run automatically on deploy via `python manage.py migrate` in the release phase.

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EMAIL/PASSWORD                  OAUTH (Google / Apple)          │
│  ─────────────                   ──────────────────              │
│  1. POST /api/auth/register/     1. GET /api/auth/google/        │
│     { email, password, name }       → Redirect to Google         │
│  2. Verification email sent      2. Google callback              │
│  3. Click link → verified           → /api/auth/google/callback/ │
│  4. POST /api/auth/login/        3. django-allauth processes     │
│     { email, password }          4. JWT tokens returned          │
│  5. JWT tokens returned          5. Redirect to frontend with    │
│                                     tokens in URL fragment       │
│  RESPONSE (both flows):                                          │
│  {                                                               │
│    "access": "eyJ...",     ← 15 min expiry                      │
│    "refresh": "eyJ...",    ← 7 day expiry                       │
│    "user": { id, email, display_name, ... }                     │
│  }                                                               │
│                                                                  │
│  TOKEN REFRESH                                                   │
│  ─────────────                                                   │
│  POST /api/auth/token/refresh/                                   │
│  { "refresh": "eyJ..." }                                        │
│  → { "access": "new_eyJ..." }                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 JWT Configuration

```python
# config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,           # New refresh token on each refresh
    'BLACKLIST_AFTER_ROTATION': True,         # Old refresh token invalidated
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.CustomTokenObtainSerializer',
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '50/hour',       # Unauthenticated
        'user': '500/hour',      # Authenticated
        'login': '10/minute',    # Login endpoint specifically
    },
}
```

### 6.3 OAuth Configuration (django-allauth)

```python
# config/settings/base.py
INSTALLED_APPS = [
    ...
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.apple',
    'dj_rest_auth',
    'dj_rest_auth.registration',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': env('GOOGLE_CLIENT_ID'),
            'secret': env('GOOGLE_CLIENT_SECRET'),
        },
    },
    'apple': {
        'APP': {
            'client_id': env('APPLE_CLIENT_ID'),
            'secret': env('APPLE_CLIENT_SECRET'),
            'key': env('APPLE_KEY_ID'),
        },
    },
}

# Auto-verify email for OAuth users
SOCIALACCOUNT_AUTO_SIGNUP = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'  # For email/password
SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'  # OAuth emails are pre-verified
```

### 6.4 Authorization (Permission Classes)

```python
# apps/core/permissions.py
from rest_framework.permissions import BasePermission

class IsVerifiedUser(BasePermission):
    """Requires email verification for write operations."""
    message = "Please verify your email address to perform this action."

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True  # Read access for all authenticated users
        return request.user.email_verified


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: only the owner can modify."""
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return obj.owner == request.user


class IsExchangeParticipant(BasePermission):
    """Only participants of an exchange can access it."""
    def has_object_permission(self, request, view, obj):
        return request.user in (obj.requester, obj.owner)
```

### 6.5 Frontend Token Management

```typescript
// api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
          refresh,
        });

        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);  // Retry original request
      } catch (refreshError) {
        // Refresh failed: log out
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 7. AI/LLM Integration

### 7.1 Current Phase (MVP) — No AI Required

Phase 1 MVP does not include AI features. All matching, search, and recommendations are handled by database queries (PostGIS proximity, PostgreSQL full-text search, genre filtering).

### 7.2 Planned AI/LLM Features (Phase 2+)

| Feature | Model | Purpose | Priority |
|---------|-------|---------|----------|
| Smart book matching | Embedding model (e.g., OpenAI text-embedding-3-small) | Match books beyond genre — by themes, writing style, reader preferences | P2 |
| Book description enrichment | LLM (GPT-4o-mini or Claude Haiku) | Auto-generate rich descriptions for books with minimal API data | P2 |
| Chat safety moderation | Classification model | Flag potentially unsafe messages (harassment, personal info sharing) | P2 |
| Personalized recommendations | Collaborative filtering + embeddings | "Readers who swapped this also liked..." | P3 |
| Smart condition assessment | Vision model | Analyze book photos to suggest condition rating | P3 |

### 7.3 Architecture for Future AI Integration

When AI features are added, they will follow this pattern:

```
User action → Django API → Celery task (async) → AI service call → Store result → Notify user
```

This keeps AI calls off the request/response path (they're slow and unreliable) and uses the existing Celery infrastructure for background processing.

```python
# Future: apps/ai/services.py (Phase 2 example)
import openai
from django.conf import settings

class BookMatcher:
    """Semantic book matching using embeddings."""

    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    def get_embedding(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding

    def compute_book_embedding(self, book):
        text = f"{book.title} by {book.author}. {book.description}. Genres: {', '.join(book.genres)}"
        return self.get_embedding(text)

# Storage: pgvector extension for PostgreSQL (vector similarity search)
# ALTER TABLE books ADD COLUMN embedding vector(1536);
# CREATE INDEX ON books USING ivfflat (embedding vector_cosine_ops);
```

### 7.4 Cost Estimation for AI Features

| Feature | Model | Est. Cost/1000 ops | Monthly at 1K users |
|---------|-------|--------------------|---------------------|
| Book embeddings | text-embedding-3-small | $0.02 | ~$2 |
| Description enrichment | GPT-4o-mini | $0.15 | ~$15 |
| Chat moderation | Classification API | $0.01 | ~$5 |

AI costs are minimal and well within budget for Phase 2. The key is to use async processing (Celery) so AI latency never blocks the user experience.

---

## 8. API Contract

### 8.1 Base URL & Versioning

```
Production:  https://api.bookswap.nl/api/v1/
Development: http://localhost:8000/api/v1/
Docs:        https://api.bookswap.nl/api/docs/  (Swagger UI via drf-spectacular)
```

API versioning via URL prefix (`/api/v1/`). When breaking changes are needed, deploy `/api/v2/` alongside v1 with a deprecation timeline.

### 8.2 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register/` | Register with email + password | Public |
| POST | `/api/auth/login/` | Login, returns JWT pair | Public |
| POST | `/api/auth/token/refresh/` | Refresh access token | Public (refresh token) |
| POST | `/api/auth/logout/` | Blacklist refresh token | Authenticated |
| POST | `/api/auth/password/reset/` | Request password reset email | Public |
| POST | `/api/auth/password/reset/confirm/` | Set new password with token | Public |
| GET | `/api/auth/google/` | Initiate Google OAuth | Public |
| GET | `/api/auth/google/callback/` | Google OAuth callback | Public |
| GET | `/api/auth/apple/` | Initiate Apple OAuth | Public |
| GET | `/api/auth/apple/callback/` | Apple OAuth callback | Public |
| POST | `/api/auth/verify-email/` | Verify email with token | Public |
| POST | `/api/auth/verify-email/resend/` | Resend verification email | Authenticated |

### 8.3 User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me/` | Current user profile | Authenticated |
| PATCH | `/api/users/me/` | Update profile | Authenticated |
| DELETE | `/api/users/me/` | Request account deletion (GDPR) | Authenticated |
| GET | `/api/users/me/data-export/` | Download personal data (JSON) | Authenticated |
| GET | `/api/users/{id}/` | Public user profile | Authenticated |
| PATCH | `/api/users/me/location/` | Update location | Authenticated |
| PATCH | `/api/users/me/notification-prefs/` | Update notification preferences | Authenticated |

### 8.4 Book Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/books/` | List user's own books (My Shelf) | Authenticated |
| POST | `/api/books/` | Create a book listing | Verified |
| GET | `/api/books/{id}/` | Book detail | Authenticated |
| PATCH | `/api/books/{id}/` | Update book | Owner |
| DELETE | `/api/books/{id}/` | Remove book listing | Owner |
| GET | `/api/books/nearby/` | Nearby books feed | Authenticated |
| GET | `/api/books/search/` | Full-text search | Authenticated |
| GET | `/api/books/isbn/{isbn}/` | Lookup book metadata by ISBN | Authenticated |
| POST | `/api/books/{id}/photos/` | Upload photo (multipart) | Owner |
| DELETE | `/api/books/{id}/photos/{photo_index}/` | Remove photo | Owner |

**Example: Nearby Books Request**

```
GET /api/books/nearby/?lat=52.3602&lng=4.8891&radius=5000&genre=fiction&language=en&condition=good,like_new&page=1
Authorization: Bearer eyJ...

Response 200:
{
  "count": 47,
  "next": "/api/books/nearby/?...&page=2",
  "previous": null,
  "results": [
    {
      "id": 142,
      "title": "The Alchemist",
      "author": "Paulo Coelho",
      "isbn": "9780062315007",
      "cover_url": "https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg",
      "condition": "like_new",
      "condition_display": "Like New",
      "genres": ["fiction", "philosophy"],
      "language": "en",
      "photos": [
        "https://r2.bookswap.nl/books/142/photo1.jpg"
      ],
      "distance_meters": 1823,
      "distance_display": "~1.8 km",
      "owner": {
        "id": 28,
        "display_name": "bookworm_amsterdam",
        "avatar_url": "https://r2.bookswap.nl/avatars/28.jpg",
        "neighborhood": "De Pijp",
        "avg_rating": "4.7",
        "swap_count": 12
      },
      "created_at": "2026-02-10T14:30:00Z"
    }
  ]
}
```

### 8.5 Exchange Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/exchanges/` | Send partner request | Verified |
| GET | `/api/exchanges/` | List user's exchanges (sent + received) | Authenticated |
| GET | `/api/exchanges/{id}/` | Exchange detail | Participant |
| POST | `/api/exchanges/{id}/accept/` | Accept request | Owner |
| POST | `/api/exchanges/{id}/decline/` | Decline request | Owner |
| POST | `/api/exchanges/{id}/counter/` | Counter-propose | Owner |
| POST | `/api/exchanges/{id}/cancel/` | Cancel exchange | Participant |
| POST | `/api/exchanges/{id}/accept-conditions/` | Accept exchange conditions | Participant |
| POST | `/api/exchanges/{id}/confirm-swap/` | Confirm physical swap happened | Participant |
| POST | `/api/exchanges/{id}/request-return/` | Initiate return (P1) | Participant |

### 8.6 Messaging Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exchanges/{id}/messages/` | Chat history (paginated, oldest first) | Participant |
| POST | `/api/exchanges/{id}/messages/` | Send message (REST fallback) | Participant |
| PATCH | `/api/exchanges/{id}/messages/read/` | Mark messages as read | Participant |

**WebSocket:**
```
WSS: wss://api.bookswap.nl/ws/chat/{exchange_id}/?token={access_token}

// Client → Server
{ "type": "chat.message", "text": "Hey! Want to meet at OBA library?" }
{ "type": "chat.typing" }

// Server → Client
{ "type": "chat.message", "id": 501, "sender_id": 28, "text": "Hey! Want to meet at OBA library?", "created_at": "2026-02-10T15:30:00Z" }
{ "type": "chat.typing", "user": "bookworm_amsterdam" }
```

### 8.7 Rating, Report, Block, Notification Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/exchanges/{id}/rate/` | Rate swap partner | Participant |
| POST | `/api/reports/` | Report user or listing | Authenticated |
| POST | `/api/blocks/` | Block user | Authenticated |
| DELETE | `/api/blocks/{user_id}/` | Unblock user | Authenticated |
| GET | `/api/blocks/` | List blocked users | Authenticated |
| GET | `/api/notifications/` | List notifications | Authenticated |
| PATCH | `/api/notifications/{id}/read/` | Mark as read | Authenticated |
| POST | `/api/notifications/read-all/` | Mark all as read | Authenticated |
| GET | `/api/notifications/unread-count/` | Unread count | Authenticated |

### 8.8 API Standards

| Standard | Implementation |
|----------|---------------|
| Pagination | Cursor-based for feeds (books/nearby), offset for others. Default 20 per page. |
| Error format | `{ "detail": "Error message", "code": "error_code", "field_errors": { ... } }` |
| Date format | ISO 8601 (`2026-02-10T15:30:00Z`) |
| Filtering | django-filter via query params (`?genre=fiction&language=en`) |
| Sorting | `?ordering=-created_at` (DRF OrderingFilter) |
| Rate limiting | 50/hr anonymous, 500/hr authenticated, 10/min login |
| Documentation | Auto-generated OpenAPI 3.0 via drf-spectacular, served at `/api/docs/` |

---

## 9. Infrastructure & Deployment

### 9.1 Environment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRODUCTION                                │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   │
│  │ Cloudflare   │   │ Vercel      │   │ Railway          │   │
│  │ DNS + CDN    │──→│ (Frontend)  │   │ (Backend)        │   │
│  │              │   │ React PWA   │   │ Django + Celery   │   │
│  │ bookswap.nl  │   │ Static SPA  │   │ + Channels        │   │
│  └──────┬───────┘   └─────────────┘   └────────┬─────────┘   │
│         │                                       │             │
│         │           ┌─────────────┐   ┌─────────▼─────────┐  │
│         │           │ Cloudflare  │   │ Railway Postgres   │  │
│         └──────────→│ R2          │   │ + PostGIS          │  │
│                     │ (Images)    │   └───────────────────┘   │
│                     └─────────────┘   ┌───────────────────┐  │
│                                       │ Railway Redis      │  │
│                                       │ (Cache + Broker)   │  │
│                                       └───────────────────┘   │
│                                       ┌───────────────────┐  │
│                                       │ Resend            │   │
│                                       │ (Email)           │   │
│                                       └───────────────────┘   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT (Local)                       │
│                                                               │
│  docker-compose up:                                           │
│    - Django dev server (hot reload)     :8000                 │
│    - PostgreSQL + PostGIS               :5432                 │
│    - Redis                              :6379                 │
│    - Celery worker                                            │
│    - Celery Beat                                              │
│                                                               │
│  pnpm dev (separate terminal):                                │
│    - Vite dev server                    :5173                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Deployment Pipeline

```
Developer pushes to main
        │
        ▼
┌─────────────────────────┐
│    GitHub Actions CI     │
│                          │
│  1. Lint (Ruff + ESLint) │
│  2. Type check (mypy)    │
│  3. Unit tests (pytest)  │
│  4. Frontend tests       │
│  5. Build frontend       │
│  6. Build Docker image   │
└───────────┬─────────────┘
            │ (all pass)
            ▼
┌───────────┴──────────────────────────┐
│              DEPLOY                   │
│                                       │
│  Frontend: Vercel auto-deploys       │
│    from main (connected to repo)      │
│                                       │
│  Backend: Railway auto-deploys       │
│    from main (Docker build)           │
│    → Run migrations                   │
│    → Restart Gunicorn + Daphne        │
│    → Restart Celery workers           │
│                                       │
│  Preview: PRs get preview deployments │
│    on both Vercel + Railway           │
│                                       │
└───────────────────────────────────────┘
```

### 9.3 Docker Configuration

```dockerfile
# Dockerfile (backend)
FROM python:3.12-slim

# System deps for PostGIS + Pillow
RUN apt-get update && apt-get install -y \
    gdal-bin libgdal-dev libgeos-dev \
    libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements/production.txt .
RUN pip install --no-cache-dir -r production.txt

COPY . .
RUN python manage.py collectstatic --noinput

# Run with Daphne (ASGI: HTTP + WebSocket)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
```

```yaml
# docker-compose.yml (local development)
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: bookswap
      POSTGRES_USER: bookswap
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.development
      - DATABASE_URL=postgis://bookswap:localdev@db:5432/bookswap
      - REDIS_URL=redis://redis:6379/0

  celery:
    build: .
    command: celery -A config worker -l info -Q default,email,images,cleanup
    volumes:
      - .:/app
    depends_on:
      - db
      - redis

  celery-beat:
    build: .
    command: celery -A config beat -l info
    volumes:
      - .:/app
    depends_on:
      - redis

volumes:
  postgres_data:
```

### 9.4 Environment Variables

```env
# .env.example

# Django
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=your-secret-key-here
DEBUG=false
ALLOWED_HOSTS=api.bookswap.nl

# Database
DATABASE_URL=postgis://user:pass@host:5432/bookswap

# Redis
REDIS_URL=redis://host:6379/0

# Auth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=nl.bookswap.auth
APPLE_CLIENT_SECRET=xxx
APPLE_KEY_ID=xxx

# Storage (Cloudflare R2)
AWS_ACCESS_KEY_ID=xxx          # R2 uses S3-compatible keys
AWS_SECRET_ACCESS_KEY=xxx
AWS_STORAGE_BUCKET_NAME=bookswap-media
AWS_S3_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
AWS_S3_CUSTOM_DOMAIN=media.bookswap.nl

# Email
RESEND_API_KEY=re_xxx

# Frontend
FRONTEND_URL=https://bookswap.nl
CORS_ALLOWED_ORIGINS=https://bookswap.nl

# Sentry (monitoring)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 9.5 Cost Estimate (Monthly)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Railway (Django + Celery + Postgres + Redis) | Hobby | ~$5–20/mo | Usage-based, very cheap at MVP scale |
| Vercel (Frontend) | Free tier | $0 | 100GB bandwidth, plenty for MVP |
| Cloudflare (DNS + CDN + R2) | Free tier | $0 | R2: 10GB storage free, 10M reads free |
| Resend (Email) | Free tier | $0 | 3,000 emails/month |
| Domain (bookswap.nl) | — | ~€10/year | .nl domain |
| Apple Developer | — | $99/year | Required for Apple Sign In |
| **Total** | | **~$10–25/month** | |

---

## 10. Security & Compliance

### 10.1 Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | HTTPS everywhere | Cloudflare SSL (auto-provisioned), HSTS header |
| Authentication | JWT with short expiry | 15 min access, 7 day refresh, rotation enabled |
| Passwords | bcrypt hashing | Django's default PBKDF2 or switch to argon2-cffi |
| API security | Rate limiting | DRF throttling: 50/hr anon, 500/hr auth, 10/min login |
| Input validation | Serializer validation | DRF serializers validate all input before DB writes |
| SQL injection | ORM parameterization | Django ORM and GeoDjango queries are parameterized by default |
| XSS | Content-Type headers | `X-Content-Type-Options: nosniff`, JSON-only API responses |
| CSRF | Not applicable | JWT-based API (no cookies for auth), CSRF only on Django admin |
| CORS | Allowlist | django-cors-headers with explicit origin allowlist |
| File uploads | Validation + scanning | File type validation (magic bytes, not just extension), size limits |
| Secrets | Environment variables | Never in code. Loaded via `os.environ` or `django-environ` |
| Dependencies | Automated updates | Dependabot for both Python and JS dependencies |

### 10.2 Django Security Settings (Production)

```python
# config/settings/production.py
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000           # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
```

### 10.3 GDPR & Dutch UAVG Compliance

| Requirement | Implementation |
|-------------|----------------|
| Lawful basis | Consent (explicit opt-in at registration) + Legitimate interest (service delivery) |
| Privacy policy | Bilingual (NL + EN), accessible from every page footer |
| Cookie consent | Banner on first visit; only essential cookies (auth session) in MVP |
| Data minimization | Collect only what's needed. Location snapped to 500m grid. |
| Right to access | GET `/api/users/me/data-export/` returns all personal data as JSON |
| Right to erasure | DELETE `/api/users/me/` triggers 30-day soft delete then hard purge |
| Right to rectification | PATCH `/api/users/me/` allows updating all personal fields |
| Data portability | JSON export covers all user-related data |
| Breach notification | Incident response plan: notify Dutch DPA within 72 hours if breach occurs |
| DPIA | Documented for location data processing (required for geospatial data under GDPR) |
| Age restriction | Minimum age 16 (Dutch UAVG requirement); self-declaration checkbox at registration |
| Data processing records | Internal documentation of what data is processed, why, and how long retained |
| Retention policy | Inactive accounts: auto-prompt at 12 months; delete at 24 months of inactivity |

### 10.4 Location Privacy Architecture

```
User enters postcode or uses GPS
        │
        ▼
Backend receives exact coordinates
        │
        ▼
Snap to 500m grid centroid:
  lat = round(lat * 200) / 200    (~500m N/S)
  lng = round(lng * 125) / 125    (~500m E/W at Amsterdam latitude)
        │
        ▼
Store ONLY the snapped point in database
  (exact coordinates are NEVER stored)
        │
        ▼
Distance displayed as approximate:
  "~2.3 km away" (never "2.317 km")
        │
        ▼
Other users see: "De Pijp" (neighborhood name)
  (never an address, never a precise location)
```

---

## 11. Monitoring & Observability

### 11.1 Monitoring Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Sentry | Error tracking, performance monitoring | Free tier (5K events/month) |
| Railway metrics | CPU, memory, response times, DB connections | Built-in (free) |
| Vercel Analytics | Frontend Core Web Vitals | Free tier |
| UptimeRobot | Uptime monitoring + alerting | Free tier (50 monitors) |
| Django Debug Toolbar | Local dev profiling | Dev only |
| Custom dashboard | Business metrics (signups, exchanges, books) | Django admin + charts |

### 11.2 Application Logging

```python
# config/settings/base.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'loggers': {
        'apps': {                  # Application logs
            'handlers': ['console'],
            'level': 'INFO',
        },
        'django.request': {        # 4xx/5xx errors
            'handlers': ['console'],
            'level': 'WARNING',
        },
        'django.db.backends': {    # SQL queries (dev only)
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'WARNING',
        },
    },
}
```

### 11.3 Key Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| API down | No 200 response from `/api/health/` for 2 min | Email + SMS (UptimeRobot) |
| High error rate | >5% of requests returning 5xx in 5 min window | Sentry + Email |
| Slow response | P95 response time >2s for 5 min | Sentry Performance |
| Database connection pool | >80% connections used | Railway metrics alert |
| Celery queue backlog | >100 tasks pending for >10 min | Custom health check |
| New report submitted | Any new moderation report | Email to founder |

### 11.4 Health Check Endpoint

```python
# config/urls.py
from django.http import JsonResponse
from django.db import connection
from django_redis import get_redis_connection

def health_check(request):
    checks = {}
    status = 200

    # Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = 'ok'
    except Exception as e:
        checks['database'] = str(e)
        status = 503

    # Redis
    try:
        redis = get_redis_connection("default")
        redis.ping()
        checks['redis'] = 'ok'
    except Exception as e:
        checks['redis'] = str(e)
        status = 503

    # PostGIS
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT PostGIS_Version()")
            checks['postgis'] = cursor.fetchone()[0]
    except Exception as e:
        checks['postgis'] = str(e)
        status = 503

    return JsonResponse({'status': 'healthy' if status == 200 else 'degraded', 'checks': checks}, status=status)
```

### 11.5 Business Metrics Dashboard

Built using Django admin with custom views (no additional tooling):

| Metric | Query | Refresh |
|--------|-------|---------|
| Total registered users | `User.objects.count()` | Real-time |
| Active users (7d) | Users with any action in last 7 days | Daily |
| Total books listed | `Book.objects.count()` | Real-time |
| Available books | `Book.objects.filter(status='available').count()` | Real-time |
| Books per km² (by area) | Spatial aggregation query | Daily |
| Exchanges by status | Group by status | Real-time |
| Completed exchanges (cumulative) | `ExchangeRequest.objects.filter(status='completed').count()` | Real-time |
| Average rating | `Rating.objects.aggregate(Avg('score'))` | Daily |
| Report queue size | `Report.objects.filter(status='open').count()` | Real-time |
| Repeat exchange rate | Users with 2+ completed exchanges / total exchangers | Weekly |

---

## 12. Development Workflow

### 12.1 Git Strategy

**Trunk-based development** with short-lived feature branches (suitable for solo/small team):

```
main (production)
  └── feature/US-301-isbn-scan     (1-3 day branches)
  └── feature/US-401-nearby-feed
  └── fix/chat-reconnect
  └── chore/upgrade-django-5.2
```

Branch naming: `{type}/{US-ID}-{short-description}`
Types: `feature/`, `fix/`, `chore/`, `docs/`

### 12.2 Commit Convention

Follow Conventional Commits for clean history and potential auto-changelog:

```
feat(books): add ISBN barcode scanning via camera (US-301)
fix(exchanges): prevent duplicate pending requests for same book
chore(deps): upgrade Django to 5.1.3
docs(api): add exchange flow sequence diagram
test(auth): add OAuth login edge case tests
```

### 12.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: test_bookswap
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r requirements/test.txt

      - name: Lint (Ruff)
        run: ruff check . && ruff format --check .

      - name: Type check (mypy)
        run: mypy apps/ --ignore-missing-imports

      - name: Run tests
        run: pytest --cov=apps --cov-report=xml -v
        env:
          DATABASE_URL: postgis://test:test@localhost:5432/test_bookswap
          REDIS_URL: redis://localhost:6379/0
          DJANGO_SETTINGS_MODULE: config.settings.test

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint (ESLint)
        run: pnpm lint

      - name: Type check (TypeScript)
        run: pnpm tsc --noEmit

      - name: Run tests
        run: pnpm test --run

      - name: Build
        run: pnpm build
```

### 12.4 Local Development Setup

```bash
# One-time setup
git clone git@github.com:thrilled/bookswap.git
cd bookswap

# Backend
cp .env.example .env
docker-compose up -d db redis   # Start Postgres + Redis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver       # API at http://localhost:8000

# In another terminal: Celery
celery -A config worker -l info

# Frontend
cd ../bookswap-web
cp .env.example .env.local       # Set VITE_API_URL=http://localhost:8000
pnpm install
pnpm dev                         # App at http://localhost:5173
```

### 12.5 Testing Strategy

| Layer | Tool | What to test | Target coverage |
|-------|------|-------------|-----------------|
| Model tests | pytest-django | Model methods, constraints, signals | 90%+ |
| API tests | DRF test client | Endpoints, permissions, serialization, status codes | 85%+ |
| Service tests | pytest | ISBN lookup, state machine, notifications | 90%+ |
| Spatial tests | pytest + PostGIS | Nearby queries, distance calculations, grid snapping | 100% |
| WebSocket tests | Channels test client | Chat connection, message delivery, auth | 80%+ |
| Frontend unit | Vitest | Hooks, utilities, formatters | 80%+ |
| Frontend component | Testing Library | Key components (BookCard, ChatWindow, ExchangeFlow) | 70%+ |
| Frontend integration | Playwright (later) | Critical flows (register → list book → request → chat) | Key paths |

```python
# Example: Testing nearby books API
@pytest.mark.django_db
class TestNearbyBooks:
    def test_returns_books_within_radius(self, api_client, user_factory, book_factory):
        # User in De Pijp
        user = user_factory(location=Point(4.8936, 52.3547, srid=4326))
        api_client.force_authenticate(user)

        # Book 1km away (Jordaan)
        owner1 = user_factory(location=Point(4.8828, 52.3738, srid=4326))
        near_book = book_factory(owner=owner1, status='available')

        # Book 20km away (Haarlem)
        owner2 = user_factory(location=Point(4.6462, 52.3874, srid=4326))
        far_book = book_factory(owner=owner2, status='available')

        response = api_client.get('/api/books/nearby/', {
            'lat': 52.3547, 'lng': 4.8936, 'radius': 5000,
        })

        assert response.status_code == 200
        book_ids = [b['id'] for b in response.data['results']]
        assert near_book.id in book_ids
        assert far_book.id not in book_ids

    def test_excludes_blocked_users(self, api_client, user_factory, book_factory, block_factory):
        user = user_factory(location=Point(4.8936, 52.3547, srid=4326))
        blocked_owner = user_factory(location=Point(4.8940, 52.3550, srid=4326))
        block_factory(blocker=user, blocked=blocked_owner)
        blocked_book = book_factory(owner=blocked_owner, status='available')

        api_client.force_authenticate(user)
        response = api_client.get('/api/books/nearby/', {
            'lat': 52.3547, 'lng': 4.8936, 'radius': 5000,
        })

        book_ids = [b['id'] for b in response.data['results']]
        assert blocked_book.id not in book_ids
```

### 12.6 Makefile (Common Commands)

```makefile
.PHONY: run test lint migrate seed

run:
	python manage.py runserver

test:
	pytest --cov=apps -v

lint:
	ruff check . && ruff format --check .

format:
	ruff check --fix . && ruff format .

migrate:
	python manage.py makemigrations && python manage.py migrate

seed:
	python manage.py seed_books --count=200 --city=amsterdam

shell:
	python manage.py shell_plus

celery:
	celery -A config worker -l info -Q default,email,images,cleanup

beat:
	celery -A config beat -l info
```

---

## Appendix: Key File Checklist for MVP

A quick reference of the most important files to create, roughly in build order:

```
Backend:
  ✅ config/settings/base.py, production.py, development.py
  ✅ config/urls.py, asgi.py, celery.py
  ✅ apps/users/models.py (Custom User with PostGIS)
  ✅ apps/users/serializers.py, views.py, urls.py
  ✅ apps/books/models.py (Book with search vector)
  ✅ apps/books/views.py (nearby action with GeoDjango)
  ✅ apps/books/services.py (ISBN lookup)
  ✅ apps/exchanges/models.py (ExchangeRequest + Conditions)
  ✅ apps/exchanges/state_machine.py
  ✅ apps/exchanges/views.py (full exchange flow)
  ✅ apps/messaging/models.py, consumers.py (WebSocket chat)
  ✅ apps/ratings/models.py, views.py
  ✅ apps/moderation/models.py, views.py (report + block)
  ✅ apps/notifications/models.py, services.py, tasks.py
  ✅ Dockerfile, docker-compose.yml
  ✅ .github/workflows/ci.yml

Frontend:
  ✅ src/api/client.ts (Axios + JWT interceptor)
  ✅ src/context/AuthContext.tsx
  ✅ src/hooks/useAuth.ts, useWebSocket.ts, useNearbyBooks.ts
  ✅ src/pages/ (all 12 route pages)
  ✅ src/components/books/ (BookCard, BookForm, PhotoUpload)
  ✅ src/components/exchange/ (RequestCard, ConditionsModal)
  ✅ src/components/chat/ (ChatWindow, MessageBubble)
  ✅ vite.config.ts (PWA plugin)
  ✅ public/manifest.json
```

---

*— End of Document —*
