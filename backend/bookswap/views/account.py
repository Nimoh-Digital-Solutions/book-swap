"""Account lifecycle: deletion request/cancel and personal-data export."""

import logging

from django.contrib.auth import get_user_model
from django.core import signing
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers as drf_fields
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import AccountDeletionRequestSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class AccountDeletionRequestView(APIView):
    """POST /users/me/delete/ — request account deletion (GDPR)."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = AccountDeletionRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        cancel_token = signing.dumps(
            {"user_id": str(request.user.pk), "action": "cancel_deletion"},
            salt="account-deletion-cancel",
        )

        from apps.notifications.tasks import send_account_deletion_email

        send_account_deletion_email.delay(str(request.user.pk), cancel_token)

        return Response(
            {
                "detail": "Your account has been scheduled for deletion. You have 30 days to cancel.",
                "cancel_token": cancel_token,
            },
            status=status.HTTP_200_OK,
        )


class AccountDeletionCancelView(APIView):
    """POST /users/me/delete/cancel/ — cancel pending account deletion."""

    permission_classes = (AllowAny,)

    @extend_schema(
        summary="Cancel account deletion",
        description="Cancel a pending account deletion using the cancellation token from the deletion request.",
        request=inline_serializer("CancelDeletionRequest", fields={"token": drf_fields.CharField()}),
        responses={
            200: OpenApiResponse(description="Deletion cancelled"),
            400: OpenApiResponse(description="Invalid or expired token"),
            404: OpenApiResponse(description="User not found"),
        },
        tags=["users"],
    )
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Cancellation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = signing.loads(
                token,
                salt="account-deletion-cancel",
                max_age=30 * 24 * 60 * 60,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid or expired cancellation token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=payload["user_id"])
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.deletion_requested_at is None:
            return Response(
                {"detail": "No pending deletion request found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.deletion_requested_at = None
        user.is_active = True
        user.save(update_fields=["deletion_requested_at", "is_active"])

        return Response(
            {"detail": "Account deletion has been cancelled."},
            status=status.HTTP_200_OK,
        )


class DataExportView(APIView):
    """``/users/me/data-export/`` — request a copy of your personal data.

    AUD-B-704: building the export touches every domain table and used to run
    on the request thread, blocking the worker for several seconds for any
    user with non-trivial activity. We now enqueue a Celery task that builds
    the JSON, attaches it to a branded email, and sends it to the user's
    address — the request returns 202 immediately.

    Both ``GET`` and ``POST`` are accepted so existing clients keep working
    without a coordinated deploy; both behave identically.
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Request a personal data export",
        description=(
            "Enqueues a background job that builds your full data export and "
            "emails it to you as a JSON attachment. Always returns 202; the "
            "email lands within a few minutes."
        ),
        responses={
            202: OpenApiResponse(description="Export queued — will be emailed."),
        },
        tags=["users"],
    )
    def post(self, request):
        return self._enqueue(request)

    def get(self, request):
        return self._enqueue(request)

    @staticmethod
    def _enqueue(request):
        from ..tasks import send_data_export_email

        send_data_export_email.delay(str(request.user.pk))
        return Response(
            {
                "queued": True,
                "detail": (
                    "Your data export is being prepared. We'll email it to you "
                    "as soon as it's ready (usually within a few minutes)."
                ),
            },
            status=status.HTTP_202_ACCEPTED,
        )
