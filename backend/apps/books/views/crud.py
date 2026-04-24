"""Book CRUD viewset (list, retrieve, create, update, destroy)."""

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
