"""
WebSocket consumer for real-time notification bell (US-902).

Route   : ws/notifications/
Group   : notifications_{user.id}
Protocol: Authenticated via first-message auth (or query-string fallback).

The consumer joins a per-user channel group on connect and forwards any
'notification.push' messages to the WebSocket client as JSON.
Celery tasks (see tasks.py) push into this group when a notification is
created, giving users a live bell icon update without polling.
"""

import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from bookswap.ws_first_msg_auth import FirstMessageAuthMixin

logger = logging.getLogger(__name__)


class NotificationConsumer(FirstMessageAuthMixin, AsyncJsonWebsocketConsumer):
    """
    Real-time notification push for the in-app bell (US-902).

    Route: ws/notifications/
    """

    async def post_authenticate(self):
        """Called after successful auth — join the user's notification group."""
        user = self.user
        self.group_name = f"notifications_{user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        if not self._ws_accepted:
            await self.accept()
            self._ws_accepted = True

        logger.debug("NotificationConsumer: user %s connected.", user.id)

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.debug(
                "NotificationConsumer: user %s disconnected (code %s).",
                getattr(self, "user", "?"),
                code,
            )
        await super().disconnect(code)

    async def receive_json(self, content, **kwargs):
        if not await self.ensure_authenticated(content):
            return
        # Clients don't send messages to this consumer — read-only push channel.

    # -------------------------------------------------------------------------
    # Channel-layer message handlers
    # -------------------------------------------------------------------------

    async def notification_push(self, event):
        """Forward a notification.push event to the connected WebSocket client."""
        await self.send_json(
            {
                "type": "notification.push",
                "notification": event.get("notification", {}),
            }
        )
