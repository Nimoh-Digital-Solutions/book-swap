"""WebSocket consumer for real-time chat between exchange partners."""

import time
from urllib.parse import urlparse

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings as django_settings

from apps.exchanges.models import ExchangeRequest
from bookswap.ws_first_msg_auth import FirstMessageAuthMixin

from .models import Message
from .permissions import CHAT_ELIGIBLE_STATUSES, CHAT_WRITABLE_STATUSES


def _absolute_media_url(field):
    """Return an absolute URL for a FileField, handling both S3 and local storage."""
    if not field:
        return None
    url = field.url
    if url.startswith(("http://", "https://")):
        return url
    frontend_url = getattr(django_settings, "FRONTEND_URL", "").rstrip("/")
    if frontend_url:
        parsed = urlparse(frontend_url)
        base = f"{parsed.scheme}://{parsed.hostname}"
        if parsed.port and parsed.port not in (80, 443):
            base += f":{parsed.port}"
        return f"{base}{url}"
    return url


class ChatConsumer(FirstMessageAuthMixin, AsyncJsonWebsocketConsumer):
    """
    Real-time chat WebSocket for exchange partners.

    Route: ws/chat/{exchange_id}/
    """

    RATE_LIMIT_MAX = 5
    RATE_LIMIT_WINDOW = 10
    INVALID_MSG_LIMIT = 5
    INVALID_MSG_WINDOW = 30

    async def post_authenticate(self):
        """Called after successful auth — validate exchange and join group."""
        user = self.user
        self.exchange_id = self.scope["url_route"]["kwargs"]["exchange_id"]
        self.group_name = f"chat_{self.exchange_id}"
        self.send_timestamps: list[float] = []
        self.invalid_msg_timestamps: list[float] = []

        exchange = await self._get_exchange()
        if exchange is None:
            await self.close(code=4004)
            return

        if user.id not in (exchange.requester_id, exchange.owner_id):
            await self.close(code=4003)
            return

        other_id = exchange.owner_id if user.id == exchange.requester_id else exchange.requester_id
        if await self._is_blocked(user, other_id):
            await self.close(code=4003)
            return

        if exchange.status not in CHAT_ELIGIBLE_STATUSES:
            await self.close(code=4002)
            return

        self.is_read_only = exchange.status not in CHAT_WRITABLE_STATUSES

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        if not self._ws_accepted:
            await self.accept()
            self._ws_accepted = True

        if self.is_read_only:
            await self.send_json(
                {
                    "type": "chat.locked",
                    "reason": "This chat is now read-only.",
                }
            )

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )
        await super().disconnect(code)

    async def receive_json(self, content, **kwargs):
        if not await self.ensure_authenticated(content):
            return

        msg_type = content.get("type")

        if msg_type == "chat.message":
            await self._handle_message(content)
        elif msg_type == "chat.typing":
            await self._handle_typing()
        elif msg_type == "chat.read":
            await self._handle_read(content)
        else:
            now = time.time()
            self.invalid_msg_timestamps = [
                ts for ts in self.invalid_msg_timestamps if now - ts < self.INVALID_MSG_WINDOW
            ]
            self.invalid_msg_timestamps.append(now)
            if len(self.invalid_msg_timestamps) > self.INVALID_MSG_LIMIT:
                await self.send_json({"type": "chat.error", "message": "Too many invalid messages. Disconnecting."})
                await self.close(code=4008)
                return
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": f"Unknown message type: {msg_type}",
                }
            )

    # ── Message handlers ──────────────────────────────────────────────

    async def _handle_message(self, content):
        if self.is_read_only:
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": "This chat is read-only.",
                }
            )
            return

        if not await self._is_email_verified():
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": "Please verify your email address before sending messages.",
                }
            )
            return

        now = time.monotonic()
        self.send_timestamps = [ts for ts in self.send_timestamps if now - ts < self.RATE_LIMIT_WINDOW]
        if len(self.send_timestamps) >= self.RATE_LIMIT_MAX:
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": "Rate limit exceeded. Max 5 messages per 10 seconds.",
                }
            )
            return
        self.send_timestamps.append(now)

        text = content.get("text", "").strip()
        if not text:
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": "Message text is required.",
                }
            )
            return

        if len(text) > 1000:
            await self.send_json(
                {
                    "type": "chat.error",
                    "message": "Message must be at most 1000 characters.",
                }
            )
            return

        message = await self._save_message(text)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_message",
                "id": str(message.id),
                "exchange": str(message.exchange_id),
                "sender": {
                    "id": str(self.user.id),
                    "username": self.user.username,
                    "avatar": _absolute_media_url(self.user.avatar),
                },
                "content": message.content,
                "image": None,
                "read_at": None,
                "created_at": message.created_at.isoformat(),
            },
        )

    async def _handle_typing(self):
        if self.is_read_only:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_typing",
                "user_id": str(self.user.id),
                "display_name": self.user.username,
            },
        )

    async def _handle_read(self, content):
        message_id = content.get("message_id")
        if not message_id:
            return

        read_at = await self._mark_message_read(message_id)
        if read_at:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_read",
                    "message_id": message_id,
                    "read_at": read_at.isoformat(),
                },
            )

    # ── Group message handlers (called by channel layer) ──────────────

    async def chat_message(self, event):
        await self.send_json(
            {
                "type": "chat.message",
                "id": event["id"],
                "exchange": event["exchange"],
                "sender": event["sender"],
                "content": event["content"],
                "image": event["image"],
                "read_at": event["read_at"],
                "created_at": event["created_at"],
            }
        )

    async def chat_typing(self, event):
        if event["user_id"] != str(self.user.id):
            await self.send_json(
                {
                    "type": "chat.typing",
                    "user_id": event["user_id"],
                    "display_name": event["display_name"],
                }
            )

    async def chat_read(self, event):
        await self.send_json(
            {
                "type": "chat.read",
                "message_id": event["message_id"],
                "read_at": event["read_at"],
            }
        )

    async def chat_read_all(self, event):
        await self.send_json(
            {
                "type": "chat.read_all",
                "read_at": event["read_at"],
            }
        )

    # ── Database helpers ──────────────────────────────────────────────

    @database_sync_to_async
    def _get_exchange(self):
        try:
            return ExchangeRequest.objects.select_related(
                "requester",
                "owner",
            ).get(pk=self.exchange_id)
        except ExchangeRequest.DoesNotExist:
            return None

    @database_sync_to_async
    def _save_message(self, text):
        return Message.objects.create(
            exchange_id=self.exchange_id,
            sender=self.user,
            content=text,
        )

    @database_sync_to_async
    def _mark_message_read(self, message_id):
        from django.utils import timezone

        now = timezone.now()
        updated = (
            Message.objects.filter(
                pk=message_id,
                exchange_id=self.exchange_id,
                read_at__isnull=True,
            )
            .exclude(sender=self.user)
            .update(read_at=now)
        )
        return now if updated else None

    @database_sync_to_async
    def _is_blocked(self, user, other_id):
        from apps.trust_safety.services import get_blocked_user_ids

        return other_id in get_blocked_user_ids(user)

    @database_sync_to_async
    def _is_email_verified(self):
        user = self.user
        if getattr(user, "is_social_account", False):
            return True
        return getattr(user, "email_verified", False)
