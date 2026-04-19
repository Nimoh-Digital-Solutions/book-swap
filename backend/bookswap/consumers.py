from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .ws_first_msg_auth import FirstMessageAuthMixin


class ExampleConsumer(FirstMessageAuthMixin, AsyncJsonWebsocketConsumer):
    """Starter WebSocket consumer — replace with your own application logic."""

    async def post_authenticate(self):
        if not self._ws_accepted:
            await self.accept()
            self._ws_accepted = True

    async def disconnect(self, code):
        pass

    async def receive_json(self, content, **kwargs):
        if not await self.ensure_authenticated(content):
            return
        await self.send_json({"echo": content})
