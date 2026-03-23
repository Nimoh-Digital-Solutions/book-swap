# Action Plan — Epic 9: Notifications

> Generated: 2026-03-23
> Covers US-901 (P0 Email Notifications) and US-902 (P1 In-App Notification Bell)

---

## 1. Story Status Overview

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| US-901 | Email Notifications | ⚠️ Partial | Models, serializers, views, urls, admin all scaffolded. Missing: tasks.py, signals.py, migration, INSTALLED_APPS wiring, URL wiring, frontend prefs UI |
| US-902 | In-App Notification Bell | ⚠️ Partial | Same backend scaffold present. Missing: consumers.py (WS), routing wiring, migration, entire frontend feature module |

**Legend**: ✅ Implemented · ⚠️ Partial · ❌ Pending

---

## 2. Gaps in Previously Implemented Stories

### Gap: Backend app not wired into Django
- **Evidence**: `apps.notifications` absent from `INSTALLED_APPS` in `backend/config/settings/base.py`. `api/v1/notifications/` absent from `backend/config/urls.py`.
- **Fix needed**: Add `'apps.notifications'` to `INSTALLED_APPS` and `path('api/v1/notifications/', include('apps.notifications.urls'))` to `urlpatterns`.

### Gap: No migration exists
- **Evidence**: `backend/apps/notifications/migrations/` directory is empty — no `0001_initial.py`.
- **Fix needed**: Run `python manage.py makemigrations notifications` after wiring the app.

### Gap: No Celery email tasks
- **Evidence**: No `backend/apps/notifications/tasks.py` file.
- **Fix needed**: Create tasks that send transactional emails via SendGrid for each `NotificationType`.

### Gap: No signal connections
- **Evidence**: No `backend/apps/notifications/signals.py` and no `ready()` hook in `apps.py` to register signals.
- **Fix needed**: Create signals that listen to exchange/rating/message save events and call notification creation + email task dispatch.

### Gap: No WebSocket consumer
- **Evidence**: No `backend/apps/notifications/consumers.py`. The `bookswap/routing.py` file has no `ws/notifications/` route.
- **Fix needed**: Create `NotificationConsumer` and register `ws/notifications/` in the routing.

### Gap: No frontend feature module
- **Evidence**: `frontend/src/features/` lists `auth`, `books`, `discovery`, `exchanges`, `messaging`, `profile`, `ratings`, `trust-safety` — no `notifications` directory.
- **Fix needed**: Implement the complete `features/notifications/` module across Phases 3–5.

---

## 3. Implementation Plan — Epic 9: Notifications

### Context
Epic 9 delivers the notification infrastructure that connects every other epic: exchanges trigger partner-request emails, ratings dispatch feedback emails, and messages send batched chat digests. US-902 overlays this with a real-time bell in the Header driven by a dedicated WebSocket channel. The backend data layer (models, serializers, views, URLs) is already scaffolded; this plan completes the missing wiring, async tasks, and the entire frontend layer.

### Stories Covered
- US-901 — Email Notifications (P0)
- US-902 — In-App Notification Bell (P1)

---

## Phase 1 — Backend: Complete Notifications App

**Status: TODO**

**Goal**: Fill the three missing backend files, generate the migration, and wire the app into Django so the models are reachable and all endpoints are active.

### Files to create

| File | Action |
|------|--------|
| `backend/apps/notifications/tasks.py` | CREATE |
| `backend/apps/notifications/signals.py` | CREATE |
| `backend/apps/notifications/consumers.py` | CREATE |
| `backend/apps/notifications/migrations/0001_initial.py` | GENERATE via `makemigrations` |
| `backend/apps/notifications/apps.py` | MODIFY — add `ready()` to import signals |

### Files to modify

| File | Change |
|------|--------|
| `backend/config/settings/base.py` | Add `'apps.notifications'` to `INSTALLED_APPS` list |
| `backend/config/urls.py` | Add `path('api/v1/notifications/', include('apps.notifications.urls'))` |
| `backend/bookswap/routing.py` | Add `ws/notifications/` route pointing to `NotificationConsumer` |

---

### 1a — `tasks.py` (Celery email tasks)

**What to build:**

```
send_notification_email(user_id, notification_type, context_data)
```

- Look up `NotificationPreferences` for the user; return early if the relevant toggle is `False`.
- Render a plain-text + HTML email template for each `NotificationType` using Django's template engine or a simple string formatter.
- Send via `django.core.mail.send_mail` (backed by the SendGrid `EMAIL_BACKEND` already configured in the project).
- Embed the `unsubscribe_token` in the email footer as a one-click link:  
  `https://<FRONTEND_URL>/notifications/unsubscribe/<token>`
- Retry once after 5 minutes on failure: `autoretry_for=(Exception,)`, `max_retries=1`, `default_retry_delay=300`.
- Task signature: `@shared_task(bind=True, autoretry_for=(Exception,), max_retries=1, default_retry_delay=300)`.

**Email types and subject lines:**

| NotificationType | Subject |
|---|---|
| `new_request` | "You have a new book swap request" |
| `request_accepted` | "Your swap request was accepted!" |
| `request_declined` | "Update on your swap request" |
| `request_expired` | "Your swap request has expired" |
| `exchange_completed` | "Swap complete — please leave a rating" |
| `new_message` | "You have a new message on BookSwap" |
| `rating_received` | "Someone left you a rating" |

**Chat batching (US-901 AC1):** For `new_message`, use a Redis key `notif:msg_email:{user_id}:{exchange_id}` with a 15-minute TTL. If the key exists, skip sending. Set the key on send.

**Helper function** (called from signals, not a task):
```
create_notification_and_queue_email(user, notification_type, title, body, link, context_data)
```
Creates the `Notification` DB row, then calls `.delay()` on the email task.

**Acceptance criteria addressed**: US-901 AC1, AC2, AC3, AC4

---

### 1b — `signals.py` (event → notification bridge)

**What to build:**

Connect to `post_save` on these models:

| Signal | Condition | Notification type |
|---|---|---|
| `ExchangeRequest` post_save | `status` changed to `'pending'` (created=True) | `new_request` → owner |
| `ExchangeRequest` post_save | `status` changed to `'accepted'` | `request_accepted` → requester |
| `ExchangeRequest` post_save | `status` changed to `'declined'` | `request_declined` → requester |
| `ExchangeRequest` post_save | `status` changed to `'expired'` | `request_expired` → requester |
| `ExchangeRequest` post_save | `status` changed to `'completed'` | `exchange_completed` → both parties |
| `Message` post_save | created=True | `new_message` → the other party |
| `Rating` post_save | created=True | `rating_received` → rated user |

**Implementation notes:**
- Use `update_fields` check or compare `instance.status` against `instance.__class__.objects.get(pk=instance.pk)` (via `pre_save` caching on `instance._original_status`) to detect status transitions — avoid firing on every save.
- After creating the `Notification` row, push to the user's WebSocket group via `async_to_sync(channel_layer.group_send)`.
- Import guard: wrap model imports in `AppConfig.ready()` to avoid circular imports.

**Acceptance criteria addressed**: US-901 AC1, US-902 AC6

---

### 1c — `consumers.py` (NotificationConsumer WebSocket)

**What to build:**

```python
class NotificationConsumer(AsyncJsonWebsocketConsumer):
    # Route: ws/notifications/
```

- **connect()**: Reject unauthenticated users with `close(code=4001)`. Join group `notifications_{user.id}`.
- **disconnect()**: Leave the group.
- **receive_json()**: Accept `{"action": "mark_read", "id": "<uuid>"}` — update `read_at` in DB, broadcast updated unread count back to the same group.
- **notification.new** group message handler: Forward to the client as `{"type": "notification.new", "notification": {...}}`.
- **notification.unread_count** group message handler: Forward unread count update.
- No unauthenticated data exposure; group name scoped to user ID.

**Route to add in `bookswap/routing.py`:**
```python
re_path(r'^ws/notifications/$', NotificationConsumer.as_asgi())
```

**Acceptance criteria addressed**: US-902 AC5, AC6

---

### 1d — Wire into Django

**`backend/config/settings/base.py`** — in `INSTALLED_APPS`:
```python
'apps.notifications',   # add after 'apps.ratings'
```

**`backend/config/urls.py`** — in `urlpatterns`:
```python
path('api/v1/notifications/', include('apps.notifications.urls')),
```

**`backend/apps/notifications/apps.py`** — add `ready()`:
```python
def ready(self):
    import apps.notifications.signals  # noqa: F401
```

**Then run:**
```bash
cd backend && python manage.py makemigrations notifications
```

**Acceptance criteria addressed**: US-901 all ACs (prerequisite), US-902 all ACs (prerequisite)

---

## Phase 2 — Backend: Tests

**Status: TODO**

**Goal**: Prove every REST API endpoint and the unsubscribe flow work correctly.

### Files to create

| File | Action |
|------|--------|
| `backend/apps/notifications/tests/__init__.py` | CREATE (empty) |
| `backend/apps/notifications/tests/test_notifications_api.py` | CREATE |
| `backend/apps/notifications/tests/factories.py` | CREATE |

---

### `factories.py`

```python
import factory
from factory.django import DjangoModelFactory

from apps.notifications.models import Notification, NotificationPreferences, NotificationType

class NotificationFactory(DjangoModelFactory):
    class Meta:
        model = Notification

    user = factory.SubFactory('bookswap.tests.factories.UserFactory')
    notification_type = NotificationType.NEW_REQUEST
    title = factory.Faker('sentence', nb_words=4)
    body = factory.Faker('sentence')
    link = '/exchanges/'
    read_at = None


class NotificationPreferencesFactory(DjangoModelFactory):
    class Meta:
        model = NotificationPreferences
        django_get_or_create = ('user',)

    user = factory.SubFactory('bookswap.tests.factories.UserFactory')
```

---

### `test_notifications_api.py` — test cases

| Test | Description |
|---|---|
| `test_list_notifications_authenticated` | GET `/api/v1/notifications/` returns `{unread_count, results}` |
| `test_list_notifications_unauthenticated` | Returns 401 |
| `test_list_scoped_to_user` | User A cannot see User B's notifications |
| `test_list_max_50` | Returns at most 50 results even with 60 in DB |
| `test_mark_one_read` | POST `/{id}/read/` sets `read_at`, returns `{marked: 1}` |
| `test_mark_already_read_idempotent` | POST second time returns `{marked: 0}` |
| `test_mark_other_users_notification` | Returns `{marked: 0}` — no 403 leak |
| `test_mark_all_read` | POST `/mark-all-read/` sets all, returns count |
| `test_get_preferences_autocreated` | GET `/preferences/` creates and returns defaults |
| `test_patch_preferences` | PATCH `/preferences/` updates a toggle |
| `test_unsubscribe_valid_token` | GET `/unsubscribe/<token>/` disables all email flags |
| `test_unsubscribe_invalid_token` | Returns 404 |
| `test_unsubscribe_no_auth_required` | 200 without session cookie |

**Testing conventions to follow (nimoh-stack):**
- `pytest` + `pytest-django`, mark DB tests with `@pytest.mark.django_db`
- Use `APIClient` from DRF test utils; force authenticate via `client.force_authenticate(user=user)`
- Factory Boy for fixture creation — no raw `User.objects.create_user` in tests
- File location: `backend/apps/notifications/tests/test_notifications_api.py`

**Acceptance criteria addressed**: US-901 AC1–AC5, US-902 AC1–AC6

---

## Phase 3 — Frontend: Feature Module

**Status: TODO**

**Goal**: Build the data layer (types → service → query keys → hooks) for the notifications feature.

### Files to create

```
frontend/src/features/notifications/
├── types/
│   └── notification.types.ts
├── services/
│   └── notification.service.ts
├── hooks/
│   ├── notificationKeys.ts
│   ├── useNotifications.ts
│   ├── useMarkRead.ts
│   ├── useMarkAllRead.ts
│   ├── useNotificationPreferences.ts
│   ├── useUpdatePreferences.ts
│   └── useNotificationWebSocket.ts
├── stores/
│   └── notificationStore.ts
└── index.ts
```

---

### `types/notification.types.ts`

```typescript
export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_expired'
  | 'exchange_completed'
  | 'new_message'
  | 'rating_received';

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  unread_count: number;
  results: Notification[];
}

export interface NotificationPreferences {
  email_new_request: boolean;
  email_request_accepted: boolean;
  email_request_declined: boolean;
  email_new_message: boolean;
  email_exchange_completed: boolean;
  email_rating_received: boolean;
}
```

---

### `services/notification.service.ts`

Axios wrappers — follow the same API client pattern as `messaging.service.ts` (base URL from env, `credentials: 'include'`):

| Function | Method | Path |
|---|---|---|
| `getNotifications()` | GET | `/api/v1/notifications/` |
| `markRead(id: string)` | POST | `/api/v1/notifications/{id}/read/` |
| `markAllRead()` | POST | `/api/v1/notifications/mark-all-read/` |
| `getPreferences()` | GET | `/api/v1/notifications/preferences/` |
| `updatePreferences(data)` | PATCH | `/api/v1/notifications/preferences/` |

---

### `hooks/notificationKeys.ts` (TanStack Query key factory)

```typescript
export const notificationKeys = {
  all: () => ['notifications'] as const,
  list: () => [...notificationKeys.all(), 'list'] as const,
  preferences: () => [...notificationKeys.all(), 'preferences'] as const,
};
```

---

### `hooks/useNotifications.ts`

- `useQuery` on `notificationKeys.list()`
- Returns `{ data: NotificationListResponse, ... }`
- `staleTime: 30_000` (unread count fresh for 30s; WS pushes real-time updates)

### `hooks/useMarkRead.ts`

- `useMutation` — calls `markRead(id)`, then `queryClient.invalidateQueries(notificationKeys.list())`

### `hooks/useMarkAllRead.ts`

- `useMutation` — calls `markAllRead()`, then invalidates `notificationKeys.list()`

### `hooks/useNotificationPreferences.ts`

- `useQuery` on `notificationKeys.preferences()`

### `hooks/useUpdatePreferences.ts`

- `useMutation` — calls `updatePreferences(data)`, optimistic update + invalidate

---

### `hooks/useNotificationWebSocket.ts`

- Opens `ws(s)://<WS_BASE>/ws/notifications/` only when `isAuthenticated`.
- On `notification.new` message: prepend to TanStack Query cache for `notificationKeys.list()` via `queryClient.setQueryData`.
- On `notification.unread_count` message: update Zustand `notificationStore.unreadCount`.
- Reconnect on disconnect with exponential back-off (max 5 attempts), matching `useChatWebSocket.ts` pattern.
- Clean-up: `close()` WebSocket on unmount.

---

### `stores/notificationStore.ts` (Zustand)

```typescript
interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  reset: () => void;
}
```

- `unreadCount` drives the badge in `NotificationBell` without requiring a full re-fetch on every WS push.
- Initialized from the `unread_count` field of the first `getNotifications()` response.

### `index.ts`

Re-export public API: types, hooks, store accessor.

**Acceptance criteria addressed**: US-902 AC1 (unread count), AC5 (mark read API), AC6 (real-time hook)

---

## Phase 4 — Frontend: UI

**Status: TODO**

**Goal**: Build all user-facing notification surfaces.

### Files to create

```
frontend/src/features/notifications/
├── components/
│   ├── NotificationBell/
│   │   ├── NotificationBell.tsx
│   │   └── index.ts
│   ├── NotificationPanel/
│   │   ├── NotificationPanel.tsx
│   │   ├── NotificationItem.tsx
│   │   └── index.ts
│   └── NotificationPreferencesSection/
│       ├── NotificationPreferencesSection.tsx
│       └── index.ts
├── pages/
│   └── UnsubscribePage.tsx
├── i18n/
│   └── (locale files live under public/locales — see below)
```

### Locale files to create

| File | Action |
|---|---|
| `frontend/public/locales/en/notifications.json` | CREATE |
| `frontend/public/locales/fr/notifications.json` | CREATE |

---

### Files to modify

| File | Change |
|---|---|
| `frontend/src/components/layout/Header/Header.tsx` | Add `<NotificationBell />` before the profile/sign-in CTA button (authenticated only) |
| `frontend/src/routes/config/paths.ts` | Add `NOTIFICATIONS_UNSUBSCRIBE: '/notifications/unsubscribe/:token'` |
| `frontend/src/routes/routesConfig.tsx` (or equivalent router file) | Register `UnsubscribePage` at the path above as a **public** (no auth guard) route |
| Settings page component | Add `<NotificationPreferencesSection />` inside the settings page |

---

### `NotificationBell.tsx`

**Behaviour:**
- Renders a bell icon (use a suitable icon from the project's icon library or inline SVG).
- Badge shows `unreadCount` from `notificationStore`; if `≥ 100` display `"99+"`.
- Toggling the bell opens/closes `NotificationPanel` as a dropdown positioned below the bell.
- Closes on click-outside (`useRef` + `useEffect` event listener).
- Only rendered when `isAuthenticated` (existing `useAuthStore` check mirrors Header pattern).
- Mounts `useNotificationWebSocket` once at this level so the WS connection is active.

**Accessibility:**
- `<button aria-label={t('notifications.bell.ariaLabel')} aria-expanded={isOpen}>`
- `aria-live="polite"` region for unread count announcement.
- Bell `role="button"` with keyboard (`Enter`/`Space`) open/close.

---

### `NotificationPanel.tsx`

**Behaviour:**
- Lists the last 50 notifications from `useNotifications()`.
- Each `<NotificationItem>` shows: icon (per type), title, body truncated to 2 lines, relative timestamp (`n minutes ago`).
- Unread items visually distinguished (e.g. left border accent or subtle background).
- Clicking an item: calls `markRead(id)` mutation, then navigates to `notification.link` using `useNavigate`. If link is empty, do nothing.
- "Mark all as read" button at top-right of panel header.
- Loading skeleton while query is in-flight.
- Empty state: `t('notifications.panel.empty')` message.
- **Edge case — 99+ unread**: Badge shows `"99+"`, panel shows all items.
- **Edge case — stale link**: If the item's `link` points to a deleted exchange/resource, the back-end will return 404. Handle gracefully in `ExchangeDetailPage` (out of scope here); the notification item merely navigates — no special handling needed at panel level.

---

### `NotificationItem.tsx`

Per-item sub-component. Props: `notification: Notification`, `onRead: (id: string) => void`.

Icon map (use emoji or icon component):
| Type | Icon |
|---|---|
| `new_request` | 📚 |
| `request_accepted` | ✅ |
| `request_declined` | ❌ |
| `request_expired` | ⏰ |
| `exchange_completed` | 🤝 |
| `new_message` | 💬 |
| `rating_received` | ⭐ |

---

### `NotificationPreferencesSection.tsx`

**Behaviour:**
- Fetches preferences via `useNotificationPreferences()`.
- Renders a labelled toggle/checkbox for each of the 6 email categories.
- On toggle change: debounce 300ms then call `useUpdatePreferences` mutation.
- Optimistic update so UI responds immediately.
- Section heading: `t('notifications.preferences.heading')`.
- Category labels pulled from `notifications` i18n namespace.
- Loading skeleton while fetching; error toast on mutation failure.

---

### `UnsubscribePage.tsx`

**Route**: `/notifications/unsubscribe/:token` — **public, no auth required**.

**Behaviour:**
- On mount: reads `:token` from URL params, makes a `GET /api/v1/notifications/unsubscribe/<token>/` request (via the service, not a mutation — it's a GET).
- Success state: confirmation message `t('notifications.unsubscribe.success')` with a link back to `/`.
- Error state (404 / network error): `t('notifications.unsubscribe.error')` with retry button.
- Loading state: spinner.
- No Header/Footer needed — minimal layout.

---

### i18n keys (both `en` and `fr`)

**`public/locales/en/notifications.json`** (define these keys):

```json
{
  "bell": {
    "ariaLabel": "Notifications",
    "unreadCount": "{{count}} unread notifications",
    "unreadCountPlural": "{{count}} unread notifications"
  },
  "panel": {
    "heading": "Notifications",
    "markAllRead": "Mark all as read",
    "empty": "You're all caught up!",
    "timeAgo": "{{time}} ago"
  },
  "types": {
    "new_request": "New swap request",
    "request_accepted": "Request accepted",
    "request_declined": "Request declined",
    "request_expired": "Request expired",
    "exchange_completed": "Exchange completed",
    "new_message": "New message",
    "rating_received": "New rating"
  },
  "preferences": {
    "heading": "Email Notifications",
    "new_request": "New partner requests",
    "request_accepted": "Request accepted / declined",
    "request_declined": "Request accepted / declined",
    "new_message": "New chat messages",
    "exchange_completed": "Exchange updates",
    "rating_received": "Ratings received"
  },
  "unsubscribe": {
    "loading": "Processing your request…",
    "success": "You've been unsubscribed from all BookSwap emails.",
    "successCta": "Back to home",
    "error": "This unsubscribe link is invalid or has already been used.",
    "retry": "Try again"
  }
}
```

**`public/locales/fr/notifications.json`** — French translations of the same keys.

---

### Route registration

Add to `frontend/src/routes/config/paths.ts`:
```typescript
NOTIFICATIONS_UNSUBSCRIBE: '/notifications/unsubscribe/:token',
```

Register in `routesConfig` (equivalent router file) as a **public route** (no `<PrivateRoute>` wrapper):
```tsx
{
  path: PATHS.NOTIFICATIONS_UNSUBSCRIBE,
  element: <UnsubscribePage />,
}
```

**Acceptance criteria addressed**: US-902 AC1–AC6, US-901 AC3 (unsubscribe), AC4 (preferences)

---

## Phase 5 — Frontend: Tests

**Status: TODO**

**Goal**: Vitest + Testing Library tests covering key rendering paths and hook behaviour.

### Files to create

```
frontend/src/features/notifications/__tests__/
├── NotificationBell.test.tsx
├── NotificationPanel.test.tsx
├── NotificationPreferencesSection.test.tsx
├── UnsubscribePage.test.tsx
└── useNotificationWebSocket.test.ts
```

---

### `NotificationBell.test.tsx`

| Test | Description |
|---|---|
| renders bell with badge | Badge shows unread count from store |
| renders "99+" when count ≥ 100 | Store has 100 → badge text is "99+" |
| panel hidden initially | `NotificationPanel` not in DOM |
| panel opens on click | Bell click → panel renders |
| panel closes on outside click | Click outside → panel hidden |

---

### `NotificationPanel.test.tsx`

| Test | Description |
|---|---|
| renders notification list | MSW GET returns 2 items → both rendered |
| renders empty state | MSW returns `results: []` → empty message shown |
| clicking item navigates | `useNavigate` mocked; click calls navigate with `link` |
| mark all read calls mutation | Click "Mark all as read" → POST `/mark-all-read/` called |
| unread item has distinct style | Item with `is_read: false` has class/attribute indicating unread |

---

### `NotificationPreferencesSection.test.tsx`

| Test | Description |
|---|---|
| renders all 6 toggles | GET prefs → all toggles present |
| toggle fires patch mutation | Toggle `email_new_message` → PATCH called with updated value |
| optimistic update | Toggle immediately shows new state before server responds |

---

### `UnsubscribePage.test.tsx`

| Test | Description |
|---|---|
| shows loading then success | MSW returns 200 → success message shown |
| shows error on 404 | MSW returns 404 → error message shown |
| success has link to home | `href="/"` present after success |

---

### `useNotificationWebSocket.test.ts`

| Test | Description |
|---|---|
| connects when authenticated | Socket instantiated with correct URL |
| skips connection when unauthenticated | No socket created |
| appends notification to cache | `notification.new` message updates TanStack Query cache |
| updates store on unread count message | `notification.unread_count` updates Zustand store |
| cleans up on unmount | `socket.close()` called |

**Testing conventions to follow:**
- MSW v2 handlers in `src/test/mocks/handlers.ts` — add notification endpoints there.
- Wrap render in `createWrapper()` that provides `QueryClientProvider` + `MemoryRouter`.
- Mock `useAuthStore` via `vi.mock('@features/auth/stores/authStore')` where needed.
- Mock native `WebSocket` with `vi.stubGlobal('WebSocket', MockWebSocket)`.

**Acceptance criteria addressed**: All US-901 and US-902 ACs verified via tests

---

## Phase 6 — Commit & Push

**Status: TODO**

**Goal**: Clean quality gate and conventional commits per the nimoh-commit workflow.

### Tasks

- [ ] Run `cd backend && python manage.py migrate --check` (migration applied)
- [ ] Run `cd backend && python -m pytest apps/notifications/tests/ -v` (all pass)
- [ ] Run `cd frontend && npm run lint` (zero errors)
- [ ] Run `cd frontend && npm run type-check` (zero errors)
- [ ] Run `cd frontend && npm run test -- --reporter=verbose src/features/notifications` (all pass)
- [ ] Verify `public/locales/fr/notifications.json` has all keys matching `en` file

### Suggested Commit Sequence

1. `feat(notifications): wire app into INSTALLED_APPS, urls, and ws routing`
2. `feat(notifications): add 0001_initial migration`
3. `feat(notifications): add Celery email tasks with SendGrid delivery and chat batching`
4. `feat(notifications): add signals connecting exchanges/ratings/messaging to notification creation`
5. `feat(notifications): add NotificationConsumer WebSocket for real-time bell`
6. `test(notifications): add API tests for all notification endpoints`
7. `feat(notifications): add frontend types, service, TanStack Query hooks, and Zustand store`
8. `feat(notifications): add NotificationBell, NotificationPanel, and NotificationItem components`
9. `feat(notifications): add NotificationPreferencesSection in Settings`
10. `feat(notifications): add UnsubscribePage at /notifications/unsubscribe/:token`
11. `feat(notifications): add en + fr i18n namespace`
12. `test(notifications): add Vitest tests for bell, panel, preferences, unsubscribe page, and WS hook`

---

## 4. Acceptance Criteria Checklist

| Story | AC | Description | Covered in Phase |
|---|---|---|---|
| US-901 | AC1 | Email sent for all 6 event types | Phase 1 (tasks.py + signals.py) |
| US-901 | AC2 | Delivered within 2 minutes | Phase 1 (Celery async task) |
| US-901 | AC3 | Branding, subject, CTA, unsubscribe link | Phase 1 (task email body) |
| US-901 | AC4 | Preferences page with per-category toggles | Phase 4 (PreferencesSection) |
| US-901 | AC5 | One-click unsubscribe without login | Phase 1 (UnsubscribeView) + Phase 4 (UnsubscribePage) |
| US-902 | AC1 | Bell icon with unread badge | Phase 4 (NotificationBell) |
| US-902 | AC2 | Dropdown listing last 50 | Phase 4 (NotificationPanel) |
| US-902 | AC3 | Icon, text, timestamp, read indicator per item | Phase 4 (NotificationItem) |
| US-902 | AC4 | Click navigates + marks read | Phase 4 (panel click handler) + Phase 3 (useMarkRead) |
| US-902 | AC5 | "Mark all as read" button | Phase 4 (panel) + Phase 3 (useMarkAllRead) |
| US-902 | AC6 | Real-time: no page refresh needed | Phase 1 (consumer) + Phase 3 (useNotificationWebSocket) |

---

## 5. Edge Cases to Handle

| Case | Where |
|---|---|
| User has `email_new_message = False` → no chat email, but other types still send | Phase 1 `tasks.py` preference check |
| Email delivery failure → retry once after 5 min | Phase 1 `tasks.py` Celery retry config |
| Chat batching: max 1 email per chat per 15 min | Phase 1 `tasks.py` Redis TTL key |
| 99+ unread → display "99+" | Phase 4 `NotificationBell.tsx` |
| Notification for a deleted exchange → text still shows, link may 404 | Handled by target page (out of scope), noted in `NotificationItem` |
| Unsubscribe token used for a user with no preferences row | Phase 1 view already uses `get_or_create` |
| WS reconnect on dropped connection | Phase 3 `useNotificationWebSocket` exponential back-off |
| `NotificationPreferences` not yet created for user | Phase 1 `NotificationPreferencesView.get_object()` already uses `get_or_create` |

---

## 6. What's Not in This Plan

- **Push notifications (browser/mobile)**: Out of scope for MVP — no service worker push integration planned.
- **Admin bulk-notification tool**: Deferred to a future Epic (internal tooling).
- **Email HTML templates**: The plan uses plain Django template strings in `tasks.py`. Migrating to React Email templates is a future improvement once the email volume justifies it.
- **`nl` locale** (`public/locales/nl/notifications.json`): Dutch locale exists for other features but is not a launch target; add once `en`/`fr` are complete.
