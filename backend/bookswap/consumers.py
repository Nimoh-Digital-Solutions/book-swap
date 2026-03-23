from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ExampleConsumer(AsyncJsonWebsocketConsumer):
    """Starter WebSocket consumer — replace with your own application logic."""

    async def connect(self):
        # Reject unauthenticated WebSocket connections.
        if not self.scope["user"].is_authenticated:
            await self.close(code=4001)
            return
        await self.accept()

    async def disconnect(self, code):
        pass

    async def receive_json(self, content, **kwargs):
        # Echo the message back — replace with real business logic.
        await self.send_json({"echo": content})
