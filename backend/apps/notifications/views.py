"""
Views for the notifications app (US-901/902).

Endpoints:
  GET  /api/v1/notifications/               — list last 50 notifications + unread count
  POST /api/v1/notifications/{id}/read/     — mark one notification as read
  POST /api/v1/notifications/mark-all-read/ — mark all as read
  GET  /api/v1/notifications/preferences/   — retrieve email preferences
  PATCH /api/v1/notifications/preferences/  — update email preferences
  GET  /api/v1/notifications/unsubscribe/{token}/ — one-click unsubscribe (no auth)
"""

from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MobileDevice, Notification, NotificationPreferences
from .serializers import MobileDeviceSerializer, NotificationPreferencesSerializer, NotificationSerializer


class NotificationListView(APIView):
    """Return the last 50 notifications for the authenticated user."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    def get(self, request: Request) -> Response:
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")[:50]
        unread_count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response(
            {
                "unread_count": unread_count,
                "results": NotificationSerializer(qs, many=True).data,
            }
        )


class MarkNotificationReadView(APIView):
    """Mark a single notification as read."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    def post(self, request: Request, pk: str) -> Response:
        updated = Notification.objects.filter(pk=pk, user=request.user, read_at__isnull=True).update(
            read_at=timezone.now()
        )
        return Response({"marked": updated}, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    """Mark all unread notifications for the current user as read."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    def post(self, request: Request) -> Response:
        updated = Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"marked": updated}, status=status.HTTP_200_OK)


class NotificationPreferencesView(RetrieveUpdateAPIView):
    """Retrieve or update email notification preferences."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012
    serializer_class = NotificationPreferencesSerializer
    http_method_names = ["get", "patch"]  # noqa: RUF012

    def get_object(self) -> NotificationPreferences:
        obj, _ = NotificationPreferences.objects.get_or_create(user=self.request.user)
        return obj


class MobileDeviceView(APIView):
    """Register or update a mobile device push token."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    def post(self, request: Request) -> Response:
        serializer = MobileDeviceSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request: Request) -> Response:
        push_token = request.data.get("push_token")
        if not push_token:
            return Response({"detail": "push_token is required."}, status=status.HTTP_400_BAD_REQUEST)
        MobileDevice.objects.filter(user=request.user, push_token=push_token).update(is_active=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnsubscribeView(APIView):
    """One-click global unsubscribe via token — no authentication required."""

    permission_classes = [AllowAny]  # noqa: RUF012

    @extend_schema(
        summary="One-click email unsubscribe",
        description="Disable all email notifications for the user identified by the unsubscribe token.",
        responses={
            200: OpenApiResponse(description="Successfully unsubscribed"),
            404: OpenApiResponse(description="Invalid or expired token"),
        },
        tags=["notifications"],
    )
    def get(self, request: Request, token: str) -> Response:
        try:
            prefs = NotificationPreferences.objects.get(unsubscribe_token=token)
        except NotificationPreferences.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired unsubscribe link."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Disable all email notifications
        NotificationPreferences.objects.filter(pk=prefs.pk).update(
            email_new_request=False,
            email_request_accepted=False,
            email_request_declined=False,
            email_new_message=False,
            email_exchange_completed=False,
            email_rating_received=False,
        )
        return Response({"detail": "You have been unsubscribed from all BookSwap emails."})
