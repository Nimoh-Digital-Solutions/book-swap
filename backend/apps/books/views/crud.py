"""Book CRUD viewset (list, retrieve, create, update, destroy)."""

from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework import serializers as drf_serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from bookswap.permissions import IsEmailVerified

from ..models import Book, BookStatus
from ..permissions import IsBookOwner
from ..serializers import (
    BookCreateSerializer,
    BookListSerializer,
    BookSerializer,
    BookUpdateSerializer,
)
from ._helpers import _get_blocked_user_ids


def _active_exchange_book_ids(user):
    """IDs of books the user is currently a party to via an active exchange.

    Active = any non-terminal status. Both ``requested_book`` and
    ``offered_book`` are returned for both sides of the request, so the
    counter-party can load the book they're swapping for.
    """
    from apps.exchanges.models import ExchangeRequest, ExchangeStatus

    active_statuses = (
        ExchangeStatus.PENDING,
        ExchangeStatus.ACCEPTED,
        ExchangeStatus.CONDITIONS_PENDING,
        ExchangeStatus.ACTIVE,
        ExchangeStatus.SWAP_CONFIRMED,
        ExchangeStatus.RETURN_REQUESTED,
    )
    pairs = ExchangeRequest.objects.filter(
        Q(requester=user) | Q(owner=user),
        status__in=active_statuses,
    ).values_list("requested_book_id", "offered_book_id")
    ids: set = set()
    for requested_id, offered_id in pairs:
        ids.add(requested_id)
        ids.add(offered_id)
    return ids


class BookPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class BookViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD for book listings."""

    permission_classes = (IsAuthenticated,)
    pagination_class = BookPagination
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return BookCreateSerializer
        if self.action in ("update", "partial_update"):
            return BookUpdateSerializer
        if self.action == "list":
            return BookListSerializer
        return BookSerializer

    def get_queryset(self):
        qs = Book.objects.select_related("owner").prefetch_related("photos")
        user = self.request.user

        if self.action in ("update", "partial_update", "destroy"):
            return qs.filter(owner=user)

        owner_param = self.request.query_params.get("owner")
        if owner_param == "me" and user.is_authenticated:
            return qs.filter(owner=user)

        blocked_ids = _get_blocked_user_ids(user) if user.is_authenticated else set()

        # Detail view: owners must always be able to load their own books
        # (any status), and parties to an active exchange must be able to
        # load the books being swapped — otherwise IN_EXCHANGE / RETURNED
        # books 404 on MyBooks, the exchange detail screen, and chat.
        # Public/anonymous users keep the AVAILABLE-only restriction so
        # non-AVAILABLE listings stay private.
        if self.action == "retrieve" and user.is_authenticated:
            party_ids = _active_exchange_book_ids(user)
            return qs.filter(
                Q(owner=user) | Q(id__in=party_ids) | Q(status=BookStatus.AVAILABLE),
            ).exclude(owner_id__in=blocked_ids)

        if owner_param and owner_param != "me":
            return qs.filter(owner_id=owner_param, status=BookStatus.AVAILABLE).exclude(owner_id__in=blocked_ids)
        return qs.filter(status=BookStatus.AVAILABLE).exclude(owner_id__in=blocked_ids)

    def perform_authentication(self, request):
        try:
            super().perform_authentication(request)
        except Exception:
            if self.action in ("list", "retrieve"):
                from django.contrib.auth.models import AnonymousUser

                request._user = AnonymousUser()
                request._auth = None
            else:
                raise

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsBookOwner()]
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified()]
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_destroy(self, instance):
        if instance.status == BookStatus.IN_EXCHANGE:
            raise drf_serializers.ValidationError("Cannot delete a book that is currently in exchange.")
        instance.delete()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book = serializer.save()
        return Response(
            BookSerializer(book, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            BookSerializer(instance, context={"request": request}).data,
        )
