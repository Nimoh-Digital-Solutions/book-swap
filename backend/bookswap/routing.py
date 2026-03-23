
from django.urls import re_path

from apps.messaging.consumers import ChatConsumer

from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<exchange_id>[0-9a-f-]+)/$', ChatConsumer.as_asgi()),
    re_path(r'^ws/example/$', consumers.ExampleConsumer.as_asgi()),
]

