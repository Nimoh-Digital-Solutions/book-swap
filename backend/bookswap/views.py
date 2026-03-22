"""bookswap views — user profile, location, onboarding, account, book, and wishlist endpoints."""

from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, BookPhoto, BookStatus, WishlistItem
from .permissions import IsBookOwner
from .serializers import (
    AccountDeletionRequestSerializer,
    BookCreateSerializer,
    BookListSerializer,
    BookPhotoSerializer,
    BookSerializer,
    BookUpdateSerializer,
    CheckUsernameSerializer,
    ExternalSearchSerializer,
    ISBNLookupSerializer,
    OnboardingCompleteSerializer,
    PhotoReorderSerializer,
    SetLocationSerializer,
    UserPrivateSerializer,
    UserPublicSerializer,
    UserUpdateSerializer,
    WishlistItemSerializer,
)
from .services import ISBNLookupError, ISBNLookupService
from .validators import validate_book_photo

from rest_framework import serializers as drf_serializers

User = get_user_model()


class UserMeView(APIView):
    """GET/PATCH the authenticated user's own profile."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserPrivateSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserPrivateSerializer(request.user).data)


class UserDetailView(generics.RetrieveAPIView):
    """GET a public user profile by UUID."""

    permission_classes = (IsAuthenticated,)
    serializer_class = UserPublicSerializer
    queryset = User.objects.filter(is_active=True)
    lookup_field = "pk"


class SetLocationView(APIView):
    """POST — set the user's location from postcode or coordinates."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = SetLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(user=request.user)
        return Response(UserPrivateSerializer(user).data)


class OnboardingCompleteView(APIView):
    """POST — mark onboarding as complete."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = OnboardingCompleteSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save(user=request.user)
        return Response(UserPrivateSerializer(user).data)

    def get(self, request):
        return Response({"message": "Hello from bookswap!"}, status=status.HTTP_200_OK)


class CheckUsernameView(APIView):
    """GET /users/check-username/?q=<name> — check username availability."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = CheckUsernameSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["q"]

        is_taken = User.objects.filter(username=username).exclude(pk=request.user.pk).exists()

        result = {"available": not is_taken}
        if is_taken:
            base = username.rstrip("0123456789")
            suggestions = []
            import random
            for _ in range(3):
                candidate = f"{base}{random.randint(10, 999)}"  # noqa: S311
                if not User.objects.filter(username=candidate).exists():
                    suggestions.append(candidate)
            result["suggestions"] = suggestions

        return Response(result)


class AccountDeletionRequestView(APIView):
    """POST /users/me/delete/ — request account deletion (GDPR)."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = AccountDeletionRequestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Generate a signed cancellation token valid for 30 days
        cancel_token = signing.dumps(
            {"user_id": str(request.user.pk), "action": "cancel_deletion"},
            salt="account-deletion-cancel",
        )

        return Response(
            {
                "detail": "Your account has been scheduled for deletion. "
                          "You have 30 days to cancel.",
                "cancel_token": cancel_token,
            },
            status=status.HTTP_200_OK,
        )


class AccountDeletionCancelView(APIView):
    """POST /users/me/delete/cancel/ — cancel pending account deletion."""

    permission_classes = (AllowAny,)

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
                max_age=30 * 24 * 60 * 60,  # 30 days
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


# ══════════════════════════════════════════════════════════════════════════════
# Book CRUD (Epic 3 — US-301 → US-305)
# ══════════════════════════════════════════════════════════════════════════════


class BookViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD for book listings.

    - ``GET /books/``      — list all available books (or ``?owner=me`` for shelf).
    - ``POST /books/``     — create a new listing.
    - ``GET /books/{id}/`` — detail.
    - ``PATCH /books/{id}/`` — update (owner only).
    - ``DELETE /books/{id}/`` — delete (owner only, not if in_exchange).
    """

    permission_classes = (IsAuthenticated,)
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

        # For modify actions, allow the owner to access their own books regardless of status
        if self.action in ("update", "partial_update", "destroy"):
            return qs.filter(owner=self.request.user)

        owner_param = self.request.query_params.get("owner")
        if owner_param == "me":
            return qs.filter(owner=self.request.user)
        if owner_param:
            return qs.filter(owner_id=owner_param, status=BookStatus.AVAILABLE)
        return qs.filter(status=BookStatus.AVAILABLE)

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsBookOwner()]
        return [IsAuthenticated()]

    def perform_destroy(self, instance):
        if instance.status == BookStatus.IN_EXCHANGE:
            raise drf_serializers.ValidationError(
                "Cannot delete a book that is currently in exchange."
            )
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


# ══════════════════════════════════════════════════════════════════════════════
# Book Photo Endpoints (Epic 3 — US-303)
# ══════════════════════════════════════════════════════════════════════════════


class BookPhotoViewSet(viewsets.GenericViewSet):
    """Upload, delete, and reorder photos for a book.

    Nested under ``/books/{book_pk}/photos/``.
    """

    permission_classes = (IsAuthenticated, IsBookOwner)
    parser_classes = (MultiPartParser, JSONParser)
    serializer_class = BookPhotoSerializer

    def get_book(self):
        book = Book.objects.get(pk=self.kwargs["book_pk"])
        self.check_object_permissions(self.request, book)
        return book

    def create(self, request, book_pk=None):
        """Upload a photo for the book. Max 3."""
        book = self.get_book()
        if book.photos.count() >= 3:
            return Response(
                {"detail": "A book can have at most 3 photos."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        uploaded = request.FILES.get("image")
        if not uploaded:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        processed = validate_book_photo(uploaded)
        position = book.photos.count()
        photo = BookPhoto.objects.create(book=book, image=processed, position=position)
        return Response(
            BookPhotoSerializer(photo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, book_pk=None, pk=None):
        """Delete a photo."""
        book = self.get_book()
        try:
            photo = book.photos.get(pk=pk)
        except BookPhoto.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["patch"], url_path="reorder", parser_classes=[JSONParser])
    def reorder(self, request, book_pk=None):
        """Reorder photos by providing an ordered list of photo IDs."""
        book = self.get_book()
        serializer = PhotoReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photo_ids = serializer.validated_data["photo_ids"]

        photos = list(book.photos.all())
        photo_map = {p.pk: p for p in photos}

        if set(photo_ids) != set(photo_map.keys()):
            return Response(
                {"detail": "Provided IDs must match the book's current photos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for position, pid in enumerate(photo_ids):
            photo_map[pid].position = position
        BookPhoto.objects.bulk_update(photos, ["position"])

        return Response(
            BookPhotoSerializer(
                book.photos.all(), many=True, context={"request": request}
            ).data
        )


# ══════════════════════════════════════════════════════════════════════════════
# ISBN Lookup & External Search (Epic 3 — US-301, US-302)
# ══════════════════════════════════════════════════════════════════════════════


class ISBNLookupView(APIView):
    """GET /books/isbn-lookup/?isbn=<isbn> — proxy ISBN metadata lookup."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = ISBNLookupSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        isbn = serializer.validated_data["isbn"]
        try:
            metadata = ISBNLookupService.lookup_isbn(isbn)
        except ISBNLookupError:
            return Response(
                {"detail": f"No metadata found for ISBN {isbn}."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(metadata)


class ExternalSearchView(APIView):
    """GET /books/search-external/?q=<query> — proxy Open Library search."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = ExternalSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["q"]
        results = ISBNLookupService.search_external(query)
        return Response(results)


# ══════════════════════════════════════════════════════════════════════════════
# Wishlist (Epic 3 — US-306)
# ══════════════════════════════════════════════════════════════════════════════


class WishlistItemViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD for the user's wishlist (max 20 items)."""

    permission_classes = (IsAuthenticated,)
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)
