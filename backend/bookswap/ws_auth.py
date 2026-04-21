"""JWT authentication for Django Channels WebSocket connections.

Supports two modes (checked in order):
1. **First-message auth** (preferred): Client connects without a token,
   then sends ``{"type": "authenticate", "token": "<jwt>"}`` as the first
   frame. Each consumer calls ``authenticate_from_message()`` to validate.
2. **Query-string auth** (deprecated, kept for backward compatibility):
   ``?token=<jwt>`` on the WebSocket URL. Will be removed in a future release.

First-message auth avoids leaking the JWT in server access logs, proxy logs,
and browser history.
"""

from __future__ import annotations

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str: str):
    """Validate a JWT access token and return the corresponding User."""
    try:
        validated = AccessToken(token_str)
        return User.objects.get(pk=validated["user_id"])
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        return None


class JwtAuthMiddleware(BaseMiddleware):
    """Authenticate WebSocket connections.

    Checks the query string for backward compat, but the preferred path
    is first-message auth handled by consumers via ``authenticate_from_message``.
    """

    async def __call__(self, scope, receive, send):
        qs = parse_qs(scope.get("query_string", b"").decode("utf-8"))
        token_list = qs.get("token", [])

        if token_list:
            import logging

            logging.getLogger(__name__).warning(
                "DEPRECATED: WebSocket query-string auth used from %s. "
                "Migrate to first-message auth to avoid token leakage in logs.",
                scope.get("client", ("?", 0))[0],
            )
            user = await get_user_from_token(token_list[0])
            scope["user"] = user if user else AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


# Keep the old name as an alias so existing imports don't break.
JwtQueryStringAuthMiddleware = JwtAuthMiddleware
