"""Views for the messaging app."""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.db.models import FloatField, Value
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.exchanges.models import ExchangeRequest
from apps.trust_safety.services import get_blocked_user_ids
from bookswap.pagination import DefaultPagination
from bookswap.permissions import IsEmailVerified

from .models import MeetupLocation, Message
from .permissions import (
    CHAT_ELIGIBLE_STATUSES,
    CHAT_WRITABLE_STATUSES,
    IsExchangeParticipantForChat,
)
from .serializers import (
    MeetupLocationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
)


class MessageViewSet(GenericViewSet):
    """
    Messages for a specific exchange.

    list:    GET  /api/v1/messaging/exchanges/{exchange_id}/messages/
    create:  POST /api/v1/messaging/exchanges/{exchange_id}/messages/
    mark_read: POST /api/v1/messaging/exchanges/{exchange_id}/messages/mark-read/
    """

    permission_classes = [IsAuthenticated, IsExchangeParticipantForChat]  # noqa: RUF012
    pagination_class = DefaultPagination

    def initial(self, request, *args, **kwargs):
        """Resolve the exchange before permission checks."""
        exchange_id = kwargs.get("exchange_id")
        try:
            self.exchange = ExchangeRequest.objects.select_related(
                "requester",
                "owner",
            ).get(pk=exchange_id)
        except (ExchangeRequest.DoesNotExist, ValueError):
            raise NotFound("Exchange not found.") from None

        # Block check: hide exchange if either party is blocked
        if request.user.is_authenticated:
            blocked_ids = get_blocked_user_ids(request.user)
            other_id = (
                self.exchange.owner_id if self.exchange.requester_id == request.user.pk else self.exchange.requester_id
            )
            if other_id in blocked_ids:
                raise NotFound("Exchange not found.")

        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        return Message.objects.filter(exchange=self.exchange).select_related("sender").order_by("created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    def list(self, request, *args, **kwargs):
        """List messages for this exchange."""
        if self.exchange.status not in CHAT_ELIGIBLE_STATUSES:
            return Response(
                {"detail": "Chat is not available for this exchange."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        ctx = {"request": request}
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context=ctx)
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(queryset, many=True, context=ctx)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Send a message in this exchange."""
        # Email verification gate (US-803)
        if not IsEmailVerified().has_permission(request, self):
            return Response(
                {"detail": IsEmailVerified.message},
                status=status.HTTP_403_FORBIDDEN,
            )

        if self.exchange.status not in CHAT_WRITABLE_STATUSES:
            return Response(
                {"detail": "Chat is read-only for this exchange."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = Message.objects.create(
            exchange=self.exchange,
            sender=request.user,
            **serializer.validated_data,
        )

        self._broadcast_to_ws_group(message)

        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _absolute_media_url(field):
        """Return an absolute URL for a FileField, handling both S3 and local storage."""
        if not field:
            return None
        url = field.url
        if url.startswith(("http://", "https://")):
            return url
        from django.conf import settings as _s

        frontend_url = getattr(_s, "FRONTEND_URL", "").rstrip("/")
        if frontend_url:
            from urllib.parse import urlparse

            parsed = urlparse(frontend_url)
            base = f"{parsed.scheme}://{parsed.hostname}"
            if parsed.port and parsed.port not in (80, 443):
                base += f":{parsed.port}"
            return f"{base}{url}"
        return url

    @staticmethod
    def _broadcast_to_ws_group(message):
        """Push the new message to the chat WebSocket group for real-time delivery."""
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        group_name = f"chat_{message.exchange_id}"
        sender = message.sender
        import logging

        abs_url = MessageViewSet._absolute_media_url

        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "chat_message",
                    "id": str(message.id),
                    "exchange": str(message.exchange_id),
                    "sender": {
                        "id": str(sender.id),
                        "username": sender.username,
                        "avatar": abs_url(sender.avatar),
                    },
                    "content": message.content,
                    "image": abs_url(message.image),
                    "read_at": None,
                    "created_at": message.created_at.isoformat(),
                },
            )
        except Exception:
            logging.getLogger("messaging").warning(
                "Failed to broadcast message %s to WS group %s",
                message.id,
                group_name,
            )

    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request, *args, **kwargs):
        """Mark all unread messages from the partner as read."""
        if self.exchange.status not in CHAT_ELIGIBLE_STATUSES:
            return Response(
                {"detail": "Chat is not available for this exchange."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        updated = (
            Message.objects.filter(exchange=self.exchange, read_at__isnull=True)
            .exclude(sender=request.user)
            .update(read_at=now)
        )

        if updated:
            self._broadcast_read_receipt(self.exchange.pk, now)

        return Response({"marked_read": updated})

    @staticmethod
    def _broadcast_read_receipt(exchange_id, read_at):
        """Notify the sender that their messages have been read."""
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        import logging

        group_name = f"chat_{exchange_id}"
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "chat_read_all",
                    "read_at": read_at.isoformat(),
                },
            )
        except Exception:
            logging.getLogger("messaging").warning(
                "Failed to broadcast read receipt to WS group %s",
                group_name,
            )


class MeetupSuggestionViewSet(GenericViewSet):
    """
    Meetup location suggestions for an exchange.

    list: GET /api/v1/messaging/exchanges/{exchange_id}/meetup-suggestions/
    """

    permission_classes = [IsAuthenticated, IsExchangeParticipantForChat]  # noqa: RUF012
    serializer_class = MeetupLocationSerializer

    def initial(self, request, *args, **kwargs):
        exchange_id = kwargs.get("exchange_id")
        try:
            self.exchange = ExchangeRequest.objects.select_related(
                "requester",
                "owner",
            ).get(pk=exchange_id)
        except (ExchangeRequest.DoesNotExist, ValueError):
            raise NotFound("Exchange not found.") from None

        if request.user.is_authenticated:
            blocked_ids = get_blocked_user_ids(request.user)
            other_id = (
                self.exchange.owner_id if self.exchange.requester_id == request.user.pk else self.exchange.requester_id
            )
            if other_id in blocked_ids:
                raise NotFound("Exchange not found.")

        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        qs = MeetupLocation.objects.filter(is_active=True)

        # Try to compute midpoint from both users' locations.
        requester_loc = getattr(self.exchange.requester, "location", None)
        owner_loc = getattr(self.exchange.owner, "location", None)

        if requester_loc and owner_loc:
            midpoint = Point(
                (requester_loc.x + owner_loc.x) / 2,
                (requester_loc.y + owner_loc.y) / 2,
                srid=4326,
            )
            qs = qs.annotate(
                distance_km=Distance("location", midpoint) / 1000,
            ).order_by("distance_km")
        elif requester_loc:
            qs = qs.annotate(
                distance_km=Distance("location", requester_loc) / 1000,
            ).order_by("distance_km")
        elif owner_loc:
            qs = qs.annotate(
                distance_km=Distance("location", owner_loc) / 1000,
            ).order_by("distance_km")
        else:
            qs = qs.annotate(
                distance_km=Value(None, output_field=FloatField()),
            )

        return qs[:10]

    def list(self, request, *args, **kwargs):
        """List meetup suggestions sorted by distance from exchange midpoint."""
        if self.exchange.status not in CHAT_ELIGIBLE_STATUSES:
            return Response(
                {"detail": "Meetup suggestions are not available for this exchange."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        serializer = MeetupLocationSerializer(queryset, many=True)
        return Response(serializer.data)
