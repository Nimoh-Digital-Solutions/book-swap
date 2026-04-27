"""Mixin for first-message JWT authentication on WebSocket consumers.

Usage::

    class MyConsumer(FirstMessageAuthMixin, AsyncJsonWebsocketConsumer):
        async def post_authenticate(self):
            # Called after successful auth — join groups, send initial state, etc.
            ...

        async def receive_json(self, content, **kwargs):
            if not await self.ensure_authenticated(content):
                return
            # Normal message handling here
            ...
"""

from __future__ import annotations

import asyncio
import logging

from channels.db import database_sync_to_async
from django.conf import settings

from .ws_auth import get_user_from_token

logger = logging.getLogger(__name__)

AUTH_TIMEOUT_SECONDS = 10
MAX_WS_CONNECTIONS_PER_USER = getattr(settings, "WS_MAX_CONNECTIONS_PER_USER", 10)
WS_CONN_CACHE_KEY = "ws:conn:{user_id}"
WS_CONN_TTL = 60 * 60 * 4  # 4h — auto-expire stale counters


@database_sync_to_async
def _incr_ws_count(user_id: str) -> int:
    """Atomically increment the per-user WS connection counter in cache."""
    from django.core.cache import cache

    key = WS_CONN_CACHE_KEY.format(user_id=user_id)
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=WS_CONN_TTL)
        count = 1
    return count


@database_sync_to_async
def _decr_ws_count(user_id: str) -> None:
    """Atomically decrement the per-user WS connection counter in cache."""
    from django.core.cache import cache

    key = WS_CONN_CACHE_KEY.format(user_id=user_id)
    try:
        val = cache.decr(key)
        if val <= 0:
            cache.delete(key)
    except ValueError:
        cache.delete(key)


class FirstMessageAuthMixin:
    """Adds first-message JWT auth to an ``AsyncJsonWebsocketConsumer``.

    On ``connect``, if the user is already authenticated (via query-string
    fallback), it calls ``post_authenticate()`` immediately. Otherwise it
    accepts the connection and waits for an ``authenticate`` message.

    SECURITY (ADV-301): After authentication, a per-user connection counter
    is checked via the Django cache (Redis).  If a user exceeds
    ``MAX_WS_CONNECTIONS_PER_USER`` (default 10), the connection is rejected
    with close code 4029 ("too many connections").  The counter is
    decremented on disconnect.

    Subclasses must implement ``post_authenticate()`` for setup that
    requires an authenticated user (group joins, initial state, etc.).
    """

    _ws_authenticated: bool = False
    _ws_accepted: bool = False
    _ws_counted: bool = False

    async def connect(self):
        user = self.scope.get("user")

        # Already authenticated via query-string (backward compat)
        if user and user.is_authenticated:
            over_limit = await self._check_connection_limit(user)
            if over_limit:
                return
            self._ws_authenticated = True
            self.user = user
            await self.post_authenticate()
            return

        # Accept the connection and wait for first-message auth.
        await self.accept()
        self._ws_accepted = True
        self._auth_timeout_task = asyncio.ensure_future(self._auth_timeout())

    async def _check_connection_limit(self, user) -> bool:
        """Increment counter and reject if over the per-user limit.

        Returns True if the connection was rejected (caller should return).
        """
        count = await _incr_ws_count(str(user.id))
        if count > MAX_WS_CONNECTIONS_PER_USER:
            await _decr_ws_count(str(user.id))
            logger.warning(
                "WS connection limit reached for user %s (%d/%d).",
                user.id,
                count,
                MAX_WS_CONNECTIONS_PER_USER,
            )
            await self.close(code=4029)
            return True
        self._ws_counted = True
        return False

    async def disconnect(self, code):
        if self._ws_counted and hasattr(self, "user"):
            await _decr_ws_count(str(self.user.id))
            self._ws_counted = False

    async def _auth_timeout(self):
        """Close the connection if the client doesn't authenticate in time."""
        await asyncio.sleep(AUTH_TIMEOUT_SECONDS)
        if not self._ws_authenticated:
            logger.debug("WS auth timeout — closing connection.")
            await self.send_json({"type": "auth.failed", "reason": "Authentication timeout."})
            await self.close(code=4001)

    async def ensure_authenticated(self, content: dict) -> bool:
        """Call at the top of ``receive_json``. Returns True if the message
        should be processed, False if it was consumed by the auth flow."""
        if self._ws_authenticated:
            return True

        # Expect the first message to be an authenticate frame.
        if content.get("type") != "authenticate":
            await self.send_json({"type": "auth.required", "reason": "Send authenticate message first."})
            return False

        token = content.get("token", "")
        if not token:
            await self.send_json({"type": "auth.failed", "reason": "Token is required."})
            await self.close(code=4001)
            return False

        user = await get_user_from_token(token)
        if not user:
            await self.send_json({"type": "auth.failed", "reason": "Invalid or expired token."})
            await self.close(code=4001)
            return False

        over_limit = await self._check_connection_limit(user)
        if over_limit:
            await self.send_json({"type": "auth.failed", "reason": "Too many connections."})
            await self.close(code=4029)
            return False

        self.scope["user"] = user
        self.user = user
        self._ws_authenticated = True

        # Cancel the timeout.
        if hasattr(self, "_auth_timeout_task"):
            self._auth_timeout_task.cancel()

        await self.send_json({"type": "auth.success"})
        await self.post_authenticate()
        return False  # The authenticate message itself is consumed, not forwarded.

    async def post_authenticate(self):
        """Override in subclasses for post-auth setup (group joins, etc.)."""
        raise NotImplementedError
