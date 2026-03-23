"""WebSocket consumer for real-time chat between exchange partners."""
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.exchanges.models import ExchangeRequest

from .models import Message
from .permissions import CHAT_ELIGIBLE_STATUSES, CHAT_WRITABLE_STATUSES


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time chat WebSocket for exchange partners.

    Route: ws/chat/{exchange_id}/
    """

    # Rate limit: max 5 messages per 10-second window.
    RATE_LIMIT_MAX = 5
    RATE_LIMIT_WINDOW = 10

    async def connect(self):
        # Reject unauthenticated connections.
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.exchange_id = self.scope['url_route']['kwargs']['exchange_id']
        self.group_name = f'chat_{self.exchange_id}'
        self.user = user
        self.send_timestamps: list[float] = []

        # Validate exchange and participant.
        exchange = await self._get_exchange()
        if exchange is None:
            await self.close(code=4004)
            return

        if user.id not in (exchange.requester_id, exchange.owner_id):
            await self.close(code=4003)
            return

        # Block check: reject if the other party is blocked
        other_id = (
            exchange.owner_id if user.id == exchange.requester_id
            else exchange.requester_id
        )
        if await self._is_blocked(user, other_id):
            await self.close(code=4003)
            return

        if exchange.status not in CHAT_ELIGIBLE_STATUSES:
            await self.close(code=4002)
            return

        self.is_read_only = exchange.status not in CHAT_WRITABLE_STATUSES

        # Join the chat group.
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        if self.is_read_only:
            await self.send_json({
                'type': 'chat.locked',
                'reason': 'This chat is now read-only.',
            })

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name, self.channel_name,
            )

    async def receive_json(self, content, **kwargs):
        msg_type = content.get('type')

        if msg_type == 'chat.message':
            await self._handle_message(content)
        elif msg_type == 'chat.typing':
            await self._handle_typing()
        elif msg_type == 'chat.read':
            await self._handle_read(content)
        else:
            await self.send_json({
                'type': 'chat.error',
                'message': f'Unknown message type: {msg_type}',
            })

    # ── Message handlers ──────────────────────────────────────────────

    async def _handle_message(self, content):
        if self.is_read_only:
            await self.send_json({
                'type': 'chat.error',
                'message': 'This chat is read-only.',
            })
            return

        # Email verification gate (US-803)
        if not await self._is_email_verified():
            await self.send_json({
                'type': 'chat.error',
                'message': 'Please verify your email address before sending messages.',
            })
            return

        # Rate limiting.
        now = time.monotonic()
        self.send_timestamps = [
            ts for ts in self.send_timestamps
            if now - ts < self.RATE_LIMIT_WINDOW
        ]
        if len(self.send_timestamps) >= self.RATE_LIMIT_MAX:
            await self.send_json({
                'type': 'chat.error',
                'message': 'Rate limit exceeded. Max 5 messages per 10 seconds.',
            })
            return
        self.send_timestamps.append(now)

        text = content.get('text', '').strip()
        if not text:
            await self.send_json({
                'type': 'chat.error',
                'message': 'Message text is required.',
            })
            return

        if len(text) > 1000:
            await self.send_json({
                'type': 'chat.error',
                'message': 'Message must be at most 1000 characters.',
            })
            return

        message = await self._save_message(text)

        # Broadcast to the group.
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'id': str(message.id),
                'exchange': str(message.exchange_id),
                'sender': {
                    'id': str(self.user.id),
                    'username': self.user.username,
                    'avatar': self.user.avatar.url if self.user.avatar else None,
                },
                'content': message.content,
                'image': None,
                'read_at': None,
                'created_at': message.created_at.isoformat(),
            },
        )

    async def _handle_typing(self):
        if self.is_read_only:
            return

        # Broadcast typing indicator to the group (excluding sender via frontend).
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_typing',
                'user_id': str(self.user.id),
                'display_name': self.user.username,
            },
        )

    async def _handle_read(self, content):
        message_id = content.get('message_id')
        if not message_id:
            return

        read_at = await self._mark_message_read(message_id)
        if read_at:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_read',
                    'message_id': message_id,
                    'read_at': read_at.isoformat(),
                },
            )

    # ── Group message handlers (called by channel layer) ──────────────

    async def chat_message(self, event):
        await self.send_json({
            'type': 'chat.message',
            'id': event['id'],
            'exchange': event['exchange'],
            'sender': event['sender'],
            'content': event['content'],
            'image': event['image'],
            'read_at': event['read_at'],
            'created_at': event['created_at'],
        })

    async def chat_typing(self, event):
        # Don't echo typing back to the sender.
        if event['user_id'] != str(self.user.id):
            await self.send_json({
                'type': 'chat.typing',
                'user_id': event['user_id'],
                'display_name': event['display_name'],
            })

    async def chat_read(self, event):
        await self.send_json({
            'type': 'chat.read',
            'message_id': event['message_id'],
            'read_at': event['read_at'],
        })

    # ── Database helpers ──────────────────────────────────────────────

    @database_sync_to_async
    def _get_exchange(self):
        try:
            return ExchangeRequest.objects.select_related(
                'requester', 'owner',
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
        updated = Message.objects.filter(
            pk=message_id,
            exchange_id=self.exchange_id,
            read_at__isnull=True,
        ).exclude(sender=self.user).update(read_at=now)
        return now if updated else None

    @database_sync_to_async
    def _is_blocked(self, user, other_id):
        from bookswap.services import get_blocked_user_ids
        return other_id in get_blocked_user_ids(user)

    @database_sync_to_async
    def _is_email_verified(self):
        user = self.user
        if getattr(user, 'is_social_account', False):
            return True
        return getattr(user, 'email_verified', False)
