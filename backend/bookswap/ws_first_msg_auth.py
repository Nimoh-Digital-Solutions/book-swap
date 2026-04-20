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

from .ws_auth import get_user_from_token

logger = logging.getLogger(__name__)

AUTH_TIMEOUT_SECONDS = 10


class FirstMessageAuthMixin:
    """Adds first-message JWT auth to an ``AsyncJsonWebsocketConsumer``.

    On ``connect``, if the user is already authenticated (via query-string
    fallback), it calls ``post_authenticate()`` immediately. Otherwise it
    accepts the connection and waits for an ``authenticate`` message.

    Subclasses must implement ``post_authenticate()`` for setup that
    requires an authenticated user (group joins, initial state, etc.).
    """

    _ws_authenticated: bool = False
    _ws_accepted: bool = False

    async def connect(self):
        user = self.scope.get("user")

        # Already authenticated via query-string (backward compat)
        if user and user.is_authenticated:
            self._ws_authenticated = True
            self.user = user
            await self.post_authenticate()
            return

        # Accept the connection and wait for first-message auth.
        await self.accept()
        self._ws_accepted = True
        self._auth_timeout_task = asyncio.ensure_future(self._auth_timeout())

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
