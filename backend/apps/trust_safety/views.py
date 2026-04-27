"""Views for the trust_safety app — Block and Report endpoints."""

from rest_framework import generics, mixins, status, viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from bookswap.pagination import DefaultPagination
from bookswap.permissions import IsEmailVerified

from .models import Block, Report
from .serializers import (
    BlockCreateSerializer,
    BlockSerializer,
    ReportAdminUpdateSerializer,
    ReportCreateSerializer,
    ReportListSerializer,
)


class BlockViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Block / Unblock / List blocked users.

    - ``POST /users/block/``             — block a user
    - ``GET  /users/block/``             — list blocked users
    - ``DELETE /users/block/{user_id}/`` — unblock a user
    """

    permission_classes = (IsAuthenticated,)
    serializer_class = BlockSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user).select_related("blocked_user")

    def get_serializer_class(self):
        if self.action == "create":
            return BlockCreateSerializer
        return BlockSerializer

    def create(self, request, *args, **kwargs):
        serializer = BlockCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        blocked_user_id = serializer.validated_data["blocked_user_id"]

        block, created = Block.objects.get_or_create(
            blocker=request.user,
            blocked_user_id=blocked_user_id,
        )

        if not created:
            return Response(
                {"detail": "User is already blocked."},
                status=status.HTTP_200_OK,
            )

        self._cancel_exchanges_between(request.user.pk, blocked_user_id)

        result = BlockSerializer(block).data
        return Response(result, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Unblock — lookup by blocked_user's UUID (not Block PK)."""
        blocked_user_id = kwargs.get("pk")
        try:
            block = Block.objects.get(
                blocker=request.user,
                blocked_user_id=blocked_user_id,
            )
        except Block.DoesNotExist:
            return Response(
                {"detail": "Block not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _cancel_exchanges_between(user_a_id, user_b_id):
        """Cancel all pending/accepted/active exchanges between two users."""
        from django.db import models as db_models

        from apps.exchanges.models import ExchangeRequest, ExchangeStatus

        cancelable = [
            ExchangeStatus.PENDING,
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.CONDITIONS_PENDING,
            ExchangeStatus.ACTIVE,
        ]
        ExchangeRequest.objects.filter(
            db_models.Q(
                requester_id=user_a_id,
                owner_id=user_b_id,
            )
            | db_models.Q(
                requester_id=user_b_id,
                owner_id=user_a_id,
            ),
            status__in=cancelable,
        ).update(status=ExchangeStatus.CANCELLED)


class ReportCreateView(generics.CreateAPIView):
    """POST /reports/ — create a report about a user/listing/exchange."""

    permission_classes = (IsAuthenticated, IsEmailVerified)
    serializer_class = ReportCreateSerializer

    def perform_create(self, serializer):
        serializer.save()


class ReportAdminListView(generics.ListAPIView):
    """GET /reports/admin/ — admin-only list of all reports."""

    permission_classes = (IsAdminUser,)
    serializer_class = ReportListSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = Report.objects.select_related("reporter", "reported_user").order_by("-created_at")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ReportAdminUpdateView(generics.UpdateAPIView):
    """PATCH /reports/admin/{id}/ — update report status/notes (admin only)."""

    permission_classes = (IsAdminUser,)
    serializer_class = ReportAdminUpdateSerializer
    queryset = Report.objects.all()
    lookup_field = "pk"
    http_method_names = ["patch"]  # noqa: RUF012
