"""Exchange views — REST endpoints for the full exchange lifecycle."""

from django.db import models as db_models
from django.db import transaction
from django.db.models import CharField, Count, Max, OuterRef, Q, Subquery
from django.db.models.functions import Substr
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.books.models import BookStatus, SwapType
from apps.messaging.models import Message
from bookswap.permissions import IsEmailVerified

from .models import (
    ConditionsAcceptance,
    DeclineReason,
    ExchangeRequest,
    ExchangeStatus,
)
from .permissions import (
    IsExchangeOwner,
    IsExchangeParticipant,
    IsExchangeRequester,
)
from .serializers import (
    ConditionsAcceptanceSerializer,
    CounterProposeSerializer,
    DeclineSerializer,
    ExchangeRequestCreateSerializer,
    ExchangeRequestDetailSerializer,
    ExchangeRequestListSerializer,
)


class ExchangeRequestViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Exchange request CRUD and lifecycle actions.

    - POST   /exchanges/              — create request (US-501)
    - GET    /exchanges/              — list my exchanges (sent + received)
    - GET    /exchanges/{id}/         — exchange detail
    - POST   /exchanges/{id}/accept/  — owner accepts (US-502)
    - POST   /exchanges/{id}/decline/ — owner declines (US-502)
    - POST   /exchanges/{id}/counter/ — owner counter-proposes (US-502)
    - POST   /exchanges/{id}/cancel/  — requester cancels (US-501)
    - POST   /exchanges/{id}/accept-conditions/ — accept conditions (US-503)
    - GET    /exchanges/{id}/conditions/        — conditions status (US-503)
    - POST   /exchanges/{id}/confirm-swap/      — confirm swap (US-504)
    - POST   /exchanges/{id}/request-return/    — initiate return (US-505)
    - POST   /exchanges/{id}/confirm-return/    — confirm return (US-505)
    - GET    /exchanges/incoming/               — incoming requests (US-502)
    - GET    /exchanges/incoming/count/         — incoming count (US-502 nav badge)
    """

    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        from apps.trust_safety.services import get_blocked_user_ids

        user = self.request.user
        blocked_ids = get_blocked_user_ids(user)

        last_msg_preview = Subquery(
            Message.objects.filter(exchange=OuterRef("pk")).order_by("-created_at").values("content")[:1],
            output_field=CharField(),
        )

        return (
            ExchangeRequest.objects.filter(db_models.Q(requester=user) | db_models.Q(owner=user))
            .exclude(requester_id__in=blocked_ids)
            .exclude(owner_id__in=blocked_ids)
            .select_related(
                "requester",
                "owner",
                "requested_book",
                "offered_book",
            )
            .prefetch_related(
                "requested_book__photos",
                "offered_book__photos",
                "conditions_acceptances",
            )
            .annotate(
                unread_count=Count(
                    "messages",
                    filter=Q(messages__read_at__isnull=True) & ~Q(messages__sender=user),
                ),
                last_message_at=Max("messages__created_at"),
                last_message_preview=Substr(last_msg_preview, 1, 80),
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ExchangeRequestCreateSerializer
        if self.action == "list" or self.action in ("incoming",):
            return ExchangeRequestListSerializer
        return ExchangeRequestDetailSerializer

    def get_permissions(self):
        if self.action in ("accept", "decline"):
            return [IsAuthenticated(), IsExchangeOwner()]
        if self.action in ("counter", "approve_counter"):
            return [IsAuthenticated(), IsExchangeParticipant()]
        if self.action == "cancel":
            return [IsAuthenticated(), IsExchangeRequester()]
        if self.action in (
            "retrieve",
            "accept_conditions",
            "conditions",
            "confirm_swap",
            "complete",
            "request_return",
            "confirm_return",
        ):
            return [IsAuthenticated(), IsExchangeParticipant()]
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check block relationship between requester and book owner
        from apps.trust_safety.services import get_blocked_user_ids

        blocked_ids = get_blocked_user_ids(request.user)
        requested_book = serializer._requested_book
        if requested_book.owner_id in blocked_ids:
            return Response(
                {"detail": "You cannot create an exchange with this user."},
                status=status.HTTP_403_FORBIDDEN,
            )

        exchange = serializer.save()
        detail = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(detail.data, status=status.HTTP_201_CREATED)

    # ── Owner actions ─────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """Owner accepts a pending request → status 'accepted'."""
        with transaction.atomic():
            exchange = (
                ExchangeRequest.objects.select_for_update()
                .select_related("requested_book", "offered_book", "requester", "owner")
                .get(pk=self.get_object().pk)
            )
            if exchange.status != ExchangeStatus.PENDING:
                return Response(
                    {"detail": "Only pending requests can be accepted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if exchange.last_counter_by_id and not exchange.counter_approved_at:
                return Response(
                    {"detail": "The counter offer must be approved before accepting."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exchange.transition_to(ExchangeStatus.ACCEPTED)
            exchange.save(update_fields=["status", "updated_at"])

            # Lock both books so they can't be requested by others
            exchange.requested_book.status = BookStatus.IN_EXCHANGE
            exchange.requested_book.save(update_fields=["status"])
            exchange.offered_book.status = BookStatus.IN_EXCHANGE
            exchange.offered_book.save(update_fields=["status"])

            # Decline all other pending requests involving either book
            ExchangeRequest.objects.filter(
                requested_book=exchange.requested_book,
                status=ExchangeStatus.PENDING,
            ).exclude(pk=exchange.pk).update(
                status=ExchangeStatus.DECLINED,
                decline_reason=DeclineReason.RESERVED,
            )
            ExchangeRequest.objects.filter(
                offered_book=exchange.offered_book,
                status=ExchangeStatus.PENDING,
            ).exclude(pk=exchange.pk).update(
                status=ExchangeStatus.DECLINED,
                decline_reason=DeclineReason.RESERVED,
            )

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        """Owner declines a pending request → status 'declined'."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.PENDING:
            return Response(
                {"detail": "Only pending requests can be declined."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = DeclineSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        exchange.transition_to(ExchangeStatus.DECLINED)
        reason = ser.validated_data.get("reason", "")
        if reason:
            exchange.decline_reason = reason
        exchange.save(update_fields=["status", "decline_reason", "updated_at"])

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def counter(self, request, pk=None):
        """Either party counter-proposes a different book — updates in place."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.PENDING:
            return Response(
                {"detail": "Only pending requests can be countered."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if exchange.last_counter_by_id == request.user.pk:
            return Response(
                {"detail": "Wait for the other party to respond before countering again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = CounterProposeSerializer(
            data=request.data,
            context={"exchange": exchange, "request": request},
        )
        ser.is_valid(raise_exception=True)

        if not exchange.original_offered_book_id:
            exchange.original_offered_book = exchange.offered_book

        exchange.offered_book = ser._offered_book
        exchange.last_counter_by = request.user
        exchange.counter_approved_at = None
        exchange.save(
            update_fields=[
                "offered_book",
                "original_offered_book",
                "last_counter_by",
                "counter_approved_at",
                "updated_at",
            ]
        )

        from apps.notifications.tasks import send_counter_proposed_notification

        send_counter_proposed_notification.delay(str(exchange.pk), str(request.user.pk))

        detail = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(detail.data)

    @action(detail=True, methods=["post"], url_path="approve-counter")
    def approve_counter(self, request, pk=None):
        """The party who received the counter approves the new book selection."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.PENDING:
            return Response(
                {"detail": "Only pending requests can have counters approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not exchange.last_counter_by_id:
            return Response(
                {"detail": "There is no counter to approve."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if exchange.last_counter_by_id == request.user.pk:
            return Response(
                {"detail": "You cannot approve your own counter offer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if exchange.counter_approved_at:
            return Response(
                {"detail": "Counter has already been approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone

        exchange.counter_approved_at = timezone.now()
        exchange.save(update_fields=["counter_approved_at", "updated_at"])

        from apps.notifications.tasks import send_counter_approved_notification

        send_counter_approved_notification.delay(str(exchange.pk), str(request.user.pk))

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    # ── Requester actions ─────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Requester cancels their own pending request."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.PENDING:
            return Response(
                {"detail": "Only pending requests can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exchange.transition_to(ExchangeStatus.CANCELLED)
        exchange.save(update_fields=["status", "updated_at"])

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    # ── Conditions (US-503) ───────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="accept-conditions")
    def accept_conditions(self, request, pk=None):
        """Accept exchange conditions for this exchange."""
        exchange = self.get_object()
        if exchange.status not in (
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.CONDITIONS_PENDING,
        ):
            return Response(
                {"detail": "Conditions can only be accepted after the request is accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if exchange.conditions_acceptances.filter(user=request.user).exists():
            return Response(
                {"detail": "You have already accepted the conditions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ConditionsAcceptance.objects.create(
            exchange=exchange,
            user=request.user,
        )

        # Clear stale prefetch cache so count() hits the DB
        exchange._prefetched_objects_cache.pop("conditions_acceptances", None)

        if exchange.both_conditions_accepted():
            exchange.transition_to(ExchangeStatus.ACTIVE)
        elif exchange.status == ExchangeStatus.ACCEPTED:
            exchange.transition_to(ExchangeStatus.CONDITIONS_PENDING)
        exchange.save(update_fields=["status", "updated_at"])

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def conditions(self, request, pk=None):
        """Get conditions acceptance status for this exchange."""
        exchange = self.get_object()
        acceptances = exchange.conditions_acceptances.select_related("user").all()
        serializer = ConditionsAcceptanceSerializer(acceptances, many=True)
        return Response(
            {
                "conditions_version": ConditionsAcceptance.CURRENT_VERSION,
                "acceptances": serializer.data,
                "both_accepted": exchange.both_conditions_accepted(),
            }
        )

    # ── Swap confirmation (US-504) ────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="confirm-swap")
    def confirm_swap(self, request, pk=None):
        """Confirm the physical swap happened."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.ACTIVE:
            return Response(
                {"detail": "The exchange must be active to confirm the swap."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        if request.user.pk == exchange.requester_id:
            if exchange.requester_confirmed_at is not None:
                return Response(
                    {"detail": "You have already confirmed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exchange.requester_confirmed_at = now
        else:
            if exchange.owner_confirmed_at is not None:
                return Response(
                    {"detail": "You have already confirmed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exchange.owner_confirmed_at = now

        update_fields = ["requester_confirmed_at", "owner_confirmed_at", "updated_at"]

        if exchange.is_swap_confirmed:
            exchange.transition_to(ExchangeStatus.SWAP_CONFIRMED)
            update_fields.append("status")
            exchange._confirmed_by_user_id = request.user.pk

            from django.contrib.auth import get_user_model
            from django.db.models import F

            UserModel = get_user_model()
            UserModel.objects.filter(
                pk__in=[exchange.requester_id, exchange.owner_id],
            ).update(swap_count=F("swap_count") + 1)

        exchange.save(update_fields=update_fields)

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark a swap-confirmed exchange as completed."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.SWAP_CONFIRMED:
            return Response(
                {"detail": "Only swap-confirmed exchanges can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exchange.transition_to(ExchangeStatus.COMPLETED)
        exchange.save(update_fields=["status", "updated_at"])

        if exchange.swap_type == SwapType.PERMANENT:
            exchange.requested_book.owner = exchange.requester
            exchange.requested_book.status = BookStatus.AVAILABLE
            exchange.requested_book.save(update_fields=["owner", "status"])
            exchange.offered_book.owner = exchange.owner
            exchange.offered_book.status = BookStatus.AVAILABLE
            exchange.offered_book.save(update_fields=["owner", "status"])
        else:
            exchange.requested_book.status = BookStatus.AVAILABLE
            exchange.requested_book.save(update_fields=["status"])
            exchange.offered_book.status = BookStatus.AVAILABLE
            exchange.offered_book.save(update_fields=["status"])

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    # ── Return flow (US-505, P1) ──────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="request-return")
    def request_return(self, request, pk=None):
        """Initiate a book return."""
        exchange = self.get_object()
        if exchange.swap_type == SwapType.PERMANENT:
            return Response(
                {"detail": "Returns are not available for permanent swaps."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if exchange.status != ExchangeStatus.SWAP_CONFIRMED:
            return Response(
                {"detail": "Returns can only be requested after swap is confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exchange.transition_to(ExchangeStatus.RETURN_REQUESTED)
        exchange.return_requested_at = timezone.now()
        exchange._return_requested_by_user_id = request.user.pk
        exchange.save(update_fields=["status", "return_requested_at", "updated_at"])

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="confirm-return")
    def confirm_return(self, request, pk=None):
        """Confirm the physical return happened."""
        exchange = self.get_object()
        if exchange.status != ExchangeStatus.RETURN_REQUESTED:
            return Response(
                {"detail": "The exchange must be in return-requested state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        if request.user.pk == exchange.requester_id:
            if exchange.return_confirmed_requester is not None:
                return Response(
                    {"detail": "You have already confirmed the return."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exchange.return_confirmed_requester = now
        else:
            if exchange.return_confirmed_owner is not None:
                return Response(
                    {"detail": "You have already confirmed the return."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exchange.return_confirmed_owner = now

        update_fields = [
            "return_confirmed_requester",
            "return_confirmed_owner",
            "updated_at",
        ]

        if exchange.is_return_confirmed:
            exchange.transition_to(ExchangeStatus.RETURNED)
            update_fields.append("status")

            # Restore book statuses
            exchange.requested_book.status = BookStatus.AVAILABLE
            exchange.requested_book.save(update_fields=["status"])
            exchange.offered_book.status = BookStatus.AVAILABLE
            exchange.offered_book.save(update_fields=["status"])

        exchange.save(update_fields=update_fields)

        serializer = ExchangeRequestDetailSerializer(
            exchange,
            context={"request": request},
        )
        return Response(serializer.data)

    # ── Incoming requests (owner perspective) ─────────────────────────

    @action(detail=False, methods=["get"])
    def incoming(self, request):
        """List incoming exchange requests (where user is the owner)."""
        qs = self.get_queryset().filter(
            owner=request.user,
            status=ExchangeStatus.PENDING,
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ExchangeRequestListSerializer(
                page,
                many=True,
                context={"request": request},
            )
            return self.get_paginated_response(serializer.data)
        serializer = ExchangeRequestListSerializer(
            qs,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="incoming/count")
    def incoming_count(self, request):
        """Count pending incoming requests (for nav badge)."""
        count = ExchangeRequest.objects.filter(
            owner=request.user,
            status=ExchangeStatus.PENDING,
        ).count()
        return Response({"count": count})
