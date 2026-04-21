# BookSwap — Adversarial Code Review

> **Date**: 2026-04-20
> **Scope**: Backend (Django 5 / DRF) · Frontend (React 19 / Vite 7) · Mobile (Expo / React Native)
> **Method**: White-box red-team review — attacker-model driven, PoC-backed
> **Reviewer**: Claude adversarial-review skill
> **Complements**: `security-action-plan.md` (run `security-audit` for config/settings findings)

---

## Executive Summary

BookSwap's authorization model is **generally sound** — exchanges, messages, notifications, and wishlists are properly scoped to participants or owners, and UUID primary keys prevent enumeration. However, the review uncovered **one critical conditional account-takeover vector** via Apple Sign-In (ADV-101), **two high-severity business logic flaws** (book status mass-assignment ADV-201, swap confirmation race condition ADV-202), and several medium-severity gaps in WebSocket DoS protection and notification delivery. The platform **should not go to production** without fixing ADV-101 (Apple auth email spoofing) and ADV-201/202 (exchange integrity). All other findings are defence-in-depth improvements that reduce the blast radius of future bugs.

---

## Attacker Archetypes

| ID | Archetype | Description |
|----|-----------|-------------|
| A1 | Authenticated user | Has valid JWT, active account, email verified |
| A2 | Unauthenticated external | No JWT, network access only |
| A3 | Malicious mobile client | Modified APK/IPA + MITM proxy, valid account |
| A4 | Infrastructure attacker | Access to logs, Redis, or backup media |

---

## Attacker Goal Coverage

| Goal | Description | Finding count | Highest severity |
|------|-------------|--------------|-----------------|
| G3 | Access another user's data | 3 | 🔴 Critical |
| G4 | Account takeover | 1 | 🔴 Critical |
| G2 | Manipulate exchange status fraudulently | 3 | 🟠 High |
| G7 | Extract PII at scale | 2 | 🟡 Medium |
| G8 | Denial of service | 4 | 🟠 High |
| G5 | Manipulate ratings | 2 | 🟡 Medium |
| G6 | Extract API keys/tokens | 3 | 🟡 Medium |

---

## Finding Summary

| ID | Title | Severity | Goal | Layer | Status |
|----|-------|----------|------|-------|--------|
| ADV-101 | Apple Sign-In email spoofing → account takeover | 🔴 | G4 | Backend | ✅ Resolved |
| ADV-201 | Book `status` mass assignment bypasses exchange lifecycle | 🟠 | G2 | Backend | ✅ Resolved |
| ADV-202 | `confirm_swap` race condition — no row locking | 🟠 | G2 | Backend | ✅ Resolved |
| ADV-203 | Bulk decline of competing requests skips notifications | 🟠 | G3 | Backend | ✅ Resolved |
| ADV-301 | WebSocket connection flood — no per-user/IP limit | 🟠 | G8 | Backend | ✅ Resolved |
| ADV-302 | `chat.typing` / `chat.read` not rate-limited | 🟡 | G8 | Backend | ✅ Resolved |
| ADV-303 | Stale `is_read_only` flag on long-lived WS connections | 🟡 | G2 | Backend | ✅ Resolved |
| ADV-304 | JWT in WebSocket query string leaks to access logs | 🟡 | G6 | Backend | ⬜ PENDING |
| ADV-305 | Push token hijack when raw token is leaked | 🟡 | G3 | Backend | ⬜ PENDING |
| ADV-306 | Username enumeration via `check-username` endpoint | 🟡 | G7 | Backend | ✅ Resolved |
| ADV-307 | React Query cache persisted without sensitive-data filtering | 🟡 | G6 | Mobile | ✅ Resolved |
| ADV-308 | Google service account key on disk in workspace | 🟡 | G6 | Infra | ⬜ PENDING |
| ADV-309 | Rating deadline tied to `updated_at` (slidable window) | 🟡 | G5 | Backend | ✅ Resolved |
| ADV-310 | Profanity filter trivially bypassable | 🟢 | G5 | Backend | ⬜ PENDING |
| ADV-311 | Double rating race → uncaught IntegrityError (500) | 🟢 | G8 | Backend | ✅ Resolved |
| ADV-312 | Manual wishlist duplicates (null book) not prevented | 🟢 | G8 | Backend | ✅ Resolved |
| ADV-313 | `ACTIVE→CANCELLED` transition defined but unreachable via API | ℹ️ | — | Backend | ⬜ PENDING |
| ADV-314 | Report email task fired twice per create (signal + view) | 🟢 | G8 | Backend | ✅ Resolved |
| ADV-315 | Sentry breadcrumbs may carry rich notification payloads | 🟢 | G7 | Mobile | ⬜ PENDING |
| ADV-316 | No jailbreak/root detection on mobile | ℹ️ | G6 | Mobile | ⬜ PENDING |
| ADV-317 | No certificate pinning on mobile | ℹ️ | G6 | Mobile | ⬜ PENDING |
| SEC-001–010 | *(see security-action-plan.md)* | Various | — | Various | Mixed |

---

## Critical Findings 🔴

### ADV-101 — Apple Sign-In email spoofing → account takeover

> ✅ **Resolved** in `b70a3d9` on 2026-04-20
> Fix: Reject Apple tokens lacking verified email in signed JWT claims; never fall back to unsigned client body.
> Test: `backend/bookswap/tests/test_security_adv101.py`

- **Severity**: 🔴 CRITICAL
- **Attacker goal**: G4 — Account takeover
- **Attacker type**: A2 — Unauthenticated external (needs a valid Apple ID)
- **Layer**: Backend
- **File**: `backend/bookswap/views.py:618-667`

**Description**

When Apple omits the `email` claim from the identity token (which Apple commonly does after the first authorization), the backend falls back to reading `email` from the **unsigned, client-supplied** `request.data["user"]` field. An attacker with their own Apple identity token (new to BookSwap) can supply `victim@example.com` as the email. The backend looks up the victim user by email, then creates a `UserSocialAuth` row binding the attacker's Apple `sub` to the victim's user account. On subsequent sign-ins, the attacker authenticates as the victim.

Unlike the Google auth flow, there is **no** `email_verified` check on the Apple path.

**Proof of Concept**

```bash
# 1. Attacker obtains a valid Apple identity token for their own Apple ID
#    (first-time link to BookSwap — no existing UserSocialAuth for this sub)

# 2. Attacker sends the token with a spoofed email
curl -X POST https://api.bookswap.app/api/v1/auth/social/apple-mobile/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "<valid-apple-jwt-without-email-claim>",
    "user": {
      "email": "victim@known-bookswap-user.com",
      "first_name": "Attacker"
    }
  }'

# 3. Backend: UserSocialAuth.objects.get_or_create(
#      user=<victim_user>,  # looked up by email
#      provider="apple-id",
#      uid=<attacker_apple_sub>)
#
# 4. Next sign-in: attacker's Apple sub → victim account → full access
```

**Confirmed**: Yes — code at `backend/bookswap/views.py:618-667`. When `claims.get("email")` is empty, `request.data.get("user", {}).get("email")` is used to look up/create the user.

**Recommended Fix**

```python
# In AppleMobileAuthView — only trust email from signed claims
email = (claims.get("email") or "").lower().strip()
if not email:
    return Response(
        {"detail": "Apple token must include a verified email. "
                   "Please revoke and re-authorize BookSwap in Apple ID settings."},
        status=status.HTTP_400_BAD_REQUEST,
    )

# Also add email_verified check (Apple includes "email_verified" in claims)
if not claims.get("email_verified", False):
    return Response(
        {"detail": "Apple account email is not verified."},
        status=status.HTTP_400_BAD_REQUEST,
    )
```

**Fix complexity**: S (<2h)

---

## High Findings 🟠

### ADV-201 — Book `status` mass assignment bypasses exchange lifecycle

- **Severity**: 🟠 HIGH
- **Attacker goal**: G2 — Manipulate exchange status fraudulently
- **Attacker type**: A1 — Authenticated user (book owner)
- **Layer**: Backend
- **File**: `backend/apps/books/serializers.py:129-147`

**Description**

`BookUpdateSerializer` includes `status` as a writable field with no transition validation. When a book is accepted into an exchange, the `accept()` view sets its status to `in_exchange`. However, the book owner can bypass this by sending `PATCH /api/v1/books/{id}/` with `{"status": "available"}`, effectively making the book appear available for new exchanges while still locked in an active one. This desynchronizes book state from exchange state.

**Proof of Concept**

```bash
# 1. Book is accepted into an exchange (status: in_exchange)
# 2. Owner patches the book status directly
curl -X PATCH \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.bookswap.app/api/v1/books/<book-uuid>/ \
  -d '{"status": "available"}'
# Expected: 400 — cannot change status while in an active exchange
# Actual: 200 OK — status changed to available
```

**Confirmed**: Yes — `BookUpdateSerializer` (serializers.py:129-147) has `status` in `fields` with no `validate_status` method, no `read_only` declaration, and no model-level guard.

**Recommended Fix**

```python
# Option A: Remove status from BookUpdateSerializer fields entirely
# (preferred — status should only be changed by exchange lifecycle views)

# Option B: Add validation
def validate_status(self, value):
    book = self.instance
    if book and book.status == BookStatus.IN_EXCHANGE:
        active_exchanges = ExchangeRequest.objects.filter(
            Q(requested_book=book) | Q(offered_book=book),
            status__in=[ExchangeStatus.ACCEPTED, ExchangeStatus.CONDITIONS_PENDING,
                        ExchangeStatus.ACTIVE, ExchangeStatus.SWAP_CONFIRMED],
        ).exists()
        if active_exchanges:
            raise serializers.ValidationError(
                "Cannot change status while book is in an active exchange."
            )
    return value
```

**Fix complexity**: S (<2h)

---

### ADV-202 — `confirm_swap` race condition — no row locking

- **Severity**: 🟠 HIGH
- **Attacker goal**: G2 — Manipulate exchange status / corrupt trust metrics
- **Attacker type**: A1 — Authenticated users (both exchange participants, concurrent)
- **Layer**: Backend
- **File**: `backend/apps/exchanges/views.py:388-428`

**Description**

The `confirm_swap` action uses **no** `transaction.atomic()` and **no** `select_for_update()`. Each participant loads their own snapshot of the exchange, sets their confirmation timestamp, and saves with `update_fields` that include **both** `requester_confirmed_at` and `owner_confirmed_at`. If both users confirm simultaneously, the second save can **overwrite** the first user's confirmation with `NULL`, because each snapshot only has their own timestamp set. This can cause: (1) confirmations being permanently lost, (2) `swap_count` never incrementing, (3) exchange stuck in `active` state.

**Proof of Concept**

```bash
# Both participants confirm swap at the exact same time
# Request 1 (requester): loads exchange → requester_confirmed_at=now, owner_confirmed_at=NULL
# Request 2 (owner): loads exchange → requester_confirmed_at=NULL, owner_confirmed_at=now
# Request 2 saves last → requester_confirmed_at overwritten to NULL
# Result: exchange stuck in ACTIVE, swap_count never incremented

curl -X POST -H "Authorization: Bearer $REQUESTER_TOKEN" \
  https://api.bookswap.app/api/v1/exchanges/<id>/confirm-swap/ &
curl -X POST -H "Authorization: Bearer $OWNER_TOKEN" \
  https://api.bookswap.app/api/v1/exchanges/<id>/confirm-swap/ &
wait
```

**Confirmed**: Yes — `views.py:388-428` shows no atomic block or row lock around the read-modify-write cycle.

**Recommended Fix**

```python
@action(detail=True, methods=["post"], url_path="confirm-swap")
def confirm_swap(self, request, pk=None):
    with transaction.atomic():
        exchange = (
            ExchangeRequest.objects.select_for_update()
            .get(pk=pk)
        )
        if exchange.status != ExchangeStatus.ACTIVE:
            return Response(...)

        now = timezone.now()
        if request.user.pk == exchange.requester_id:
            if exchange.requester_confirmed_at:
                return Response({"detail": "Already confirmed."}, ...)
            exchange.requester_confirmed_at = now
        else:
            if exchange.owner_confirmed_at:
                return Response({"detail": "Already confirmed."}, ...)
            exchange.owner_confirmed_at = now

        if exchange.is_swap_confirmed:
            exchange.transition_to(ExchangeStatus.SWAP_CONFIRMED)
            UserModel.objects.filter(
                pk__in=[exchange.requester_id, exchange.owner_id],
            ).update(swap_count=F("swap_count") + 1)

        exchange.save()
    return Response(...)
```

**Fix complexity**: S (<2h)

---

### ADV-203 — Bulk decline of competing requests skips notifications

- **Severity**: 🟠 HIGH
- **Attacker goal**: G3 — Users left unaware of request status changes
- **Attacker type**: N/A — systemic issue
- **Layer**: Backend
- **File**: `backend/apps/exchanges/views.py:170-188`

**Description**

When an exchange is accepted, the `accept()` view bulk-declines all other pending requests for the same books using `QuerySet.update()`. Django's `update()` does **not** fire `post_save` signals per row. The notification system relies on `post_save` signals to detect status transitions and dispatch notifications. Consequently, users whose requests are auto-declined **never receive decline notifications** — no in-app notification, no WebSocket push, no email, no push notification.

**Proof of Concept**

```bash
# 1. User A lists a book; users B, C, D all request it
# 2. Owner accepts user B's request
# 3. Users C and D's requests are bulk-declined via .update()
# 4. post_save signal does NOT fire for C and D's ExchangeRequest rows
# 5. Users C and D see no notification — their requests appear "pending" until refresh
```

**Confirmed**: Yes — `views.py:170-188` uses `ExchangeRequest.objects.filter(...).update(status=DECLINED)`, and `apps/notifications/signals.py` uses `@receiver(post_save, sender=ExchangeRequest)` which does not fire on bulk `.update()`.

**Recommended Fix**

```python
# After bulk update, iterate declined PKs and fire notifications
declined_pks = list(
    ExchangeRequest.objects.filter(
        requested_book=exchange.requested_book,
        status=ExchangeStatus.PENDING,
    ).exclude(pk=exchange.pk).values_list("pk", flat=True)
)
# ... existing bulk .update() ...
for declined_pk in declined_pks:
    send_request_declined_notification.delay(str(declined_pk))
```

**Fix complexity**: S (<2h)

---

### ADV-301 — WebSocket connection flood — no per-user/IP limit

- **Severity**: 🟠 HIGH
- **Attacker goal**: G8 — Denial of service
- **Attacker type**: A1/A2 — Any (authenticated hold long-lived; unauthenticated hold 10s each)
- **Layer**: Backend
- **File**: `backend/bookswap/ws_first_msg_auth.py`, `backend/apps/messaging/consumers.py`

**Description**

There is no limit on the number of concurrent WebSocket connections per user or per IP address. An authenticated attacker can open thousands of long-lived connections (notifications + chat channels), each consuming ASGI worker memory, Redis channel-layer group subscriptions, and file descriptors. Unauthenticated attackers can hold connections for 10 seconds each via the first-message auth window. Combined with the `chat.typing` flood (ADV-302), this enables amplified resource exhaustion.

**Proof of Concept**

```python
import asyncio, websockets

async def flood():
    tasks = []
    for _ in range(5000):
        tasks.append(websockets.connect(
            f"wss://api.bookswap.app/ws/notifications/?token={valid_jwt}"
        ))
    connections = await asyncio.gather(*tasks, return_exceptions=True)
    # Hold all connections open indefinitely
    await asyncio.sleep(3600)
```

**Confirmed**: Yes — no `CONNECTION_LIMIT` or per-user concurrency check exists in any consumer or middleware file.

**Recommended Fix**

```python
# In ws_first_msg_auth.py or a custom middleware:
# Track connections per user in Redis (INCR on connect, DECR on disconnect)
# Reject with close code 4009 if limit exceeded (e.g., 10 per user)
```

**Fix complexity**: M (half-day)

---

## Medium Findings 🟡

### ADV-302 — `chat.typing` / `chat.read` not rate-limited

- **Severity**: 🟡 MEDIUM
- **Goal**: G8 — DoS (Redis/channel-layer pressure)
- **File**: `backend/apps/messaging/consumers.py:177-204`
- **Description**: `chat.message` is rate-limited to 5/10s, but `chat.typing` and `chat.read` have **no** rate limit. An attacker can flood `chat.typing` events, each triggering `group_send` to Redis and fan-out to the other participant — amplified I/O.
- **Fix**: Apply the same rate-limit pattern (or a separate, slightly higher limit) to typing and read events.
- **Fix complexity**: S

### ADV-303 — Stale `is_read_only` flag on long-lived WS connections

- **Severity**: 🟡 MEDIUM
- **Goal**: G2 — Send messages after exchange moves to read-only status
- **File**: `backend/apps/messaging/consumers.py:53`
- **Description**: `is_read_only` is computed once at `post_authenticate` from the exchange status. If the exchange transitions from `active` to `completed` while the WebSocket is open, the user can continue sending messages because `_handle_message` checks the cached flag, not the current DB status.
- **Fix**: Re-check exchange status on each `chat.message`, or push a "status changed" event that forces reconnect.
- **Fix complexity**: S

### ADV-304 — JWT in WebSocket query string leaks to access logs

- **Severity**: 🟡 MEDIUM
- **Goal**: G6 — Token extraction from infrastructure
- **File**: `backend/bookswap/ws_auth.py:45-55`
- **Description**: The `JwtQueryStringAuthMiddleware` accepts `?token=<jwt>` in the WebSocket URL. Reverse proxies (Nginx, Cloudflare) and ASGI servers commonly log the full upgrade URL including query parameters. Short-lived tokens mitigate the window but the risk is non-zero.
- **Fix**: Document first-message auth as the preferred path; deprecate query-string auth; configure log scrubbing at proxy/server level.
- **Fix complexity**: S (documentation) / M (deprecation + log scrubbing)

### ADV-305 — Push token hijack when raw token is leaked

- **Severity**: 🟡 MEDIUM
- **Goal**: G3 — Intercept another user's push notifications
- **File**: `backend/apps/notifications/serializers.py:76-90`
- **Description**: If an attacker obtains a victim's raw Expo/FCM push token (via device malware, leaked logs, or backup extraction), they can register it under their own account via `POST /users/me/devices/`. The backend deactivates the victim's registration, redirecting all push notifications to the attacker.
- **Fix**: Require a device-attestation challenge or bind push tokens to device identity (not just user account).
- **Fix complexity**: L (requires device attestation design)

### ADV-306 — Username enumeration via `check-username` endpoint

- **Severity**: 🟡 MEDIUM
- **Goal**: G7 — User enumeration / reconnaissance
- **File**: `backend/bookswap/views.py:95-122`
- **Description**: `GET /api/v1/users/check-username/?q=<name>` with `AllowAny` returns `{"available": false}` for registered usernames, enabling unauthenticated enumeration. This is a common UX-vs-security trade-off.
- **Fix**: Add rate limiting specific to this endpoint (e.g., 10/minute per IP). Consider requiring authentication for this check.
- **Fix complexity**: S

### ADV-307 — React Query cache persisted without sensitive-data filtering

- **Severity**: 🟡 MEDIUM
- **Goal**: G6 — PII exposure on compromised device
- **File**: `mobile/src/App.tsx:80-86`
- **Description**: `PersistQueryClientProvider` persists the **entire** query cache (including chat messages, profile data, exchange details) to MMKV/AsyncStorage for 24 hours. On a compromised or backed-up device, this data is accessible outside SecureStore protections.
- **Fix**: Add `dehydrateOptions.shouldDehydrateQuery` to exclude sensitive queries (messages, user profiles) from persistence.
- **Fix complexity**: S

### ADV-308 — Google service account key on disk in workspace

- **Severity**: 🟡 MEDIUM
- **Goal**: G6 — Key exposure
- **File**: `mobile/google-service-account.json`
- **Description**: A full GCP service account credential file exists in the workspace. While `.gitignore` should prevent it from being committed, its presence increases risk of accidental exposure.
- **Fix**: Verify it's gitignored (`git ls-files`), use EAS/CI secrets instead of a long-lived file, rotate the key.
- **Fix complexity**: S

### ADV-309 — Rating deadline tied to `updated_at` (slidable window)

- **Severity**: 🟡 MEDIUM
- **Goal**: G5 — Rate exchanges outside intended window
- **File**: `backend/apps/ratings/serializers.py:65-68`
- **Description**: The 30-day rating window is calculated from `exchange.updated_at`, not from a dedicated `completed_at` timestamp. Any future save on the exchange (admin action, migration, bug) that bumps `updated_at` would silently re-open the rating window.
- **Fix**: Use a dedicated `completed_at` or `status_changed_at` field anchored to the completion transition.
- **Fix complexity**: S

---

## Low / Info Findings 🟢 ℹ️

| ID | Title | Description | Fix |
|----|-------|-------------|-----|
| ADV-310 | Profanity filter trivially bypassable | `is_profane()` uses simple substring matching — defeated by spacing, leetspeak, homoglyphs, non-English text. | Consider a library like `better-profanity` or ML-based moderation. |
| ADV-311 | Double rating race → uncaught IntegrityError | Two concurrent rating POSTs: DB unique constraint catches the second, but the `IntegrityError` is unhandled → HTTP 500 instead of 400. | Wrap `create()` in try/except for `IntegrityError`, return friendly error. |
| ADV-312 | Manual wishlist duplicates (null book) | `UniqueConstraint` on (`user`, `book`) only applies when `book IS NOT NULL`. Users can create unlimited identical manual wishlist entries. | Add application-level dedup check on (`user`, `isbn`) or (`user`, `title`). |
| ADV-313 | `ACTIVE→CANCELLED` transition unreachable | `VALID_TRANSITIONS` allows `ACTIVE→CANCELLED`, but `cancel()` only permits `PENDING` status. Dead transition — inconsistency, not exploitable. | Either remove from `VALID_TRANSITIONS` or implement the cancel-active flow. |
| ADV-314 | Report email task fired twice | `post_save` signal AND `perform_create` in the view both call `send_report_notification_email.delay()` — admin gets duplicate emails per report. | Remove the `.delay()` call from one location (prefer signal). |
| ADV-315 | Sentry breadcrumbs carry notification payloads | Foreground/response notification handlers add the full push `data` object to Sentry breadcrumbs. If backend ever puts PII in push data, it reaches Sentry. | Whitelist safe keys before adding to breadcrumbs. |
| ADV-316 | No jailbreak/root detection | Mobile app does not detect rooted/jailbroken devices. Token extraction is easier on such devices. | Informational — consider `expo-device` checks or Integrity API for sensitive flows. |
| ADV-317 | No certificate pinning | Mobile trusts the system CA store without pinning. MITM possible with user-installed roots. | See also SEC-009 in `security-action-plan.md`. |

---

## Security-Audit Findings (from security-action-plan.md)

> The following findings are documented in full in `security-action-plan.md` (2026-04-15).
> They are listed here for completeness and to give a unified risk picture.

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| SEC-001 | Rate limiting on auth endpoints | 🟠 High | ✅ Resolved |
| SEC-002 | Location data encryption at rest | 🟡 Medium | 🔁 Manual required |
| SEC-003 | API input size limits | 🟡 Medium | ✅ Resolved |
| SEC-004 | Container image scanning in CI | 🟡 Medium | ✅ Resolved |
| SEC-005 | Database backup encryption | 🟡 Medium | ✅ Resolved |
| SEC-006 | Session fixation on login | 🟢 Low | ✅ Resolved |
| SEC-007 | CORS wildcard check for production | 🟢 Low | ✅ Resolved |
| SEC-008 | Dependency vulnerability monitoring | 🟢 Low | ✅ Resolved |
| SEC-009 | Mobile certificate pinning | 🟡 Medium | 🔁 Manual required |
| SEC-010 | Push notification token validation | 🟢 Low | ✅ Resolved |

> Run `security-implement` to apply remaining SEC-* fixes.

---

## Prioritised Fix Order

Work through findings in this order. Complete all critical fixes before any others.

| Priority | ID | Title | Effort | Severity |
|----------|-----|-------|--------|----------|
| 1 | ADV-101 | Apple Sign-In email spoofing → account takeover | S | 🔴 Critical |
| 2 | ADV-201 | Book `status` mass assignment bypasses exchange lifecycle | S | 🟠 High |
| 3 | ADV-202 | `confirm_swap` race condition — no row locking | S | 🟠 High |
| 4 | ADV-203 | Bulk decline skips notifications | S | 🟠 High |
| 5 | ADV-301 | WebSocket connection flood — no per-user limit | M | 🟠 High |
| 6 | ADV-302 | `chat.typing`/`chat.read` not rate-limited | S | 🟡 Medium |
| 7 | ADV-303 | Stale read-only flag on WS | S | 🟡 Medium |
| 8 | ADV-309 | Rating deadline tied to `updated_at` | S | 🟡 Medium |
| 9 | ADV-311 | Double rating race → IntegrityError 500 | S | 🟢 Low |
| 10 | ADV-314 | Report email fired twice | S | 🟢 Low |

---

## What Was NOT Found

| Hypothesis | Phase | Verdict | Evidence |
|------------|-------|---------|---------|
| Exchange IDOR — view another user's exchange by UUID | Phase 1 | Not confirmed | `get_queryset()` filters by `requester=user \| owner=user` + `IsExchangeParticipant` permission |
| Message IDOR — read messages from other exchanges | Phase 1 | Not confirmed | `IsExchangeParticipantForChat` checks `request.user.id` against exchange participants in `initial()` |
| Notification IDOR — see other user's notifications | Phase 1 | Not confirmed | `Notification.objects.filter(user=request.user)` — strict scoping |
| Wishlist IDOR — delete another user's items | Phase 1 | Not confirmed | `get_queryset()` filters by `user=request.user`; destroy respects queryset |
| Mass assignment of `is_staff`/`is_active`/`email` | Phase 3 | Not confirmed | `UserUpdateSerializer` has explicit field list excluding sensitive fields |
| Mass assignment of `owner`/`requester`/`status` on exchange create | Phase 3 | Not confirmed | `ExchangeRequestCreateSerializer` is a plain `Serializer` (not `ModelSerializer`); all FK fields set server-side in `create()` |
| Google mobile auth token forgery | Phase 1 | Not confirmed | `verify_oauth2_token()` validates signature + audience; requires `email_verified` |
| Rating by non-participant | Phase 2 | Not confirmed | `IsExchangeParticipantForRating` checks user in exchange; `rated_id` derived server-side |
| Cancel exchange after books locked | Phase 2 | Not confirmed | `cancel()` only allows `PENDING` status |
| Complete exchange without swap confirmation | Phase 2 | Not confirmed | `complete()` checks `status != SWAP_CONFIRMED` → 400 |
| Cross-exchange WS eavesdropping | Phase 4 | Not confirmed | `post_authenticate` verifies user is participant → close(4003) if not |
| Notification WS group hijack | Phase 4 | Not confirmed | Group name derived from `self.user.id` after auth, not from URL path |
| Sequential PK enumeration | Phase 3 | Not confirmed | All models use UUID primary keys |
| `ExampleConsumer` live attack surface | Phase 4 | Not confirmed | Not wired in `routing.py` — dead code |

---

## Recommended Next Steps

1. **Fix ADV-101 immediately** — Apple email spoofing enables account takeover with no special conditions beyond a valid Apple ID
2. **Fix ADV-201 and ADV-202** before production — exchange integrity depends on these
3. Fix ADV-203 for user trust — silent decline notifications erode platform confidence
4. Run `adversarial-findings-implement` skill to apply fixes systematically
5. Run `security-implement` for remaining SEC-002 and SEC-009
6. Re-run `adversarial-review` after fixes to verify no regressions
7. Consider a live penetration test once codebase findings are resolved
8. Add integration tests for race condition guards and state machine transitions in CI

---

## Status Tracking

> Updated after each fix is applied.

| ID | Status | Fixed in |
|----|--------|---------|
| ADV-101 | ✅ Resolved | b70a3d9 |
| ADV-201 | ✅ Resolved | Removed `status` from `BookUpdateSerializer.fields` — status now managed exclusively by exchange lifecycle |
| ADV-202 | ✅ Resolved | Wrapped `confirm_swap` in `transaction.atomic()` + `select_for_update()` |
| ADV-203 | ✅ Resolved | Collect auto-declined PKs before bulk `.update()`, dispatch `send_request_declined_notification.delay()` per row |
| ADV-301 | ✅ Resolved | Per-user WS connection counter in Redis cache (`MAX_WS_CONNECTIONS_PER_USER=10`), enforced in `FirstMessageAuthMixin` |
| ADV-302 | ✅ Resolved | Rate-limited `chat.typing` (10/10s) and `chat.read` (20/10s) in ChatConsumer |
| ADV-303 | ✅ Resolved | `_handle_message` now re-checks exchange status from DB via `_refresh_read_only()` |
| ADV-304 | ⬜ PENDING | — |
| ADV-305 | ⬜ PENDING | — |
| ADV-306 | ✅ Resolved | Added `EnumerationThrottle` (10/min per IP) to `CheckUsernameView` |
| ADV-307 | ✅ Resolved | Added `shouldDehydrateQuery` filter to exclude messages/notifications/exchanges from persistence |
| ADV-308 | ⬜ PENDING | — |
| ADV-309 | ✅ Resolved | Added `completed_at` field to ExchangeRequest; rating window now anchored to it |
| ADV-310 | ⬜ PENDING | — |
| ADV-311 | ✅ Resolved | Wrapped `Rating.objects.create()` in try/except IntegrityError → 400 |
| ADV-312 | ✅ Resolved | Added application-level dedup check on (user, isbn) or (user, title) for manual wishlist items |
| ADV-313 | ⬜ PENDING | — |
| ADV-314 | ✅ Resolved | Removed duplicate `.delay()` call from `ReportCreateView.perform_create` (signal handles it) |
| ADV-315 | ⬜ PENDING | — |
| ADV-316 | ⬜ PENDING | — |
| ADV-317 | ⬜ PENDING | — |

*Last updated: 2026-04-20*
