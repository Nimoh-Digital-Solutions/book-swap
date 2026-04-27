"""Wishlist CRUD viewset."""

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import WishlistItem
from ..serializers import WishlistItemSerializer


class WishlistItemViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD for the user's wishlist (max 20 items).

    Supports ``?book=<uuid>`` filter to check if a specific book is wishlisted.
    """

    permission_classes = (IsAuthenticated,)
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        qs = WishlistItem.objects.filter(user=self.request.user).select_related("book")
        book_id = self.request.query_params.get("book")
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs
