"""ASGI config for bookswap."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from bookswap.routing import websocket_urlpatterns  # noqa: E402
from bookswap.ws_auth import JwtQueryStringAuthMiddleware  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JwtQueryStringAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
