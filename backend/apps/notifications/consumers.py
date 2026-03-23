"""
WebSocket consumer for real-time notification bell (US-902).

Route   : ws/notifications/
Group   : notifications_{user.id}
Protocol: Authenticated only — unauthenticated connections are rejected (4001).

The consumer joins a per-user channel group on connect and forwards any
'notification.push' messages to the WebSocket client as JSON.
Celery tasks (see tasks.py) push into this group when a notification is
created, giving users a live bell icon update without polling.
"""
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time notification push for the in-app bell (US-902).

    Route: ws/notifications/
    """

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f'notifications_{user.id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.debug('NotificationConsumer: user %s connected.', user.id)

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.debug(
                'NotificationConsumer: user %s disconnected (code %s).',
                getattr(self, 'user', '?'), code,
            )

    async def receive_json(self, content, **kwargs):
        # Clients don't send messages to this consumer — read-only push channel.
        pass

    # -------------------------------------------------------------------------
    # Channel-layer message handlers
    # -------------------------------------------------------------------------

    async def notification_push(self, event):
        """Forward a notification.push event to the connected WebSocket client."""
        await self.send_json({
            'type': 'notification.push',
            'notification': event.get('notification', {}),
        })
