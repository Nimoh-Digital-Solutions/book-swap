"""bookswap views — user profile, location, onboarding, account, book, wishlist, browse, and trust & safety endpoints."""

from django.contrib.auth import get_user_model
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.core import signing
from django.db.models import Case, Count, F, FloatField, IntegerField, Value, When
from django.db.models.functions import Cast
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Block, Book, BookPhoto, BookStatus, Report, WishlistItem
from .permissions import IsBookOwner, IsEmailVerified
from .serializers import (
    AccountDeletionRequestSerializer,
    BlockCreateSerializer,
    BlockSerializer,
    BookCreateSerializer,
    BookListSerializer,
    BookPhotoSerializer,
    BookSerializer,
    BookUpdateSerializer,
    BrowseBookListSerializer,
    BrowseFilterSerializer,
    CheckUsernameSerializer,
    ExternalSearchSerializer,
    ISBNLookupSerializer,
    OnboardingCompleteSerializer,
    PhotoReorderSerializer,
    ReportAdminUpdateSerializer,
    ReportCreateSerializer,
    ReportListSerializer,
    SetLocationSerializer,
    UserPrivateSerializer,
    UserPublicSerializer,
    UserUpdateSerializer,
    WishlistItemSerializer,
)
from .services import ISBNLookupError, ISBNLookupService, get_blocked_user_ids
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
    lookup_field = "pk"

    def get_queryset(self):
        blocked_ids = get_blocked_user_ids(self.request.user)
        return User.objects.filter(is_active=True).exclude(pk__in=blocked_ids)


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

        # Public listings: exclude blocked users' books
        blocked_ids = get_blocked_user_ids(self.request.user)
        if owner_param:
            return qs.filter(owner_id=owner_param, status=BookStatus.AVAILABLE).exclude(owner_id__in=blocked_ids)
        return qs.filter(status=BookStatus.AVAILABLE).exclude(owner_id__in=blocked_ids)

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsBookOwner()]
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified()]
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


# ══════════════════════════════════════════════════════════════════════════════
# Browse / Discovery (Epic 4 — US-401, US-402)
# ══════════════════════════════════════════════════════════════════════════════

RADIUS_BUCKETS = [1000, 3000, 5000, 10000, 25000]


class BrowsePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class BrowseViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """Browse nearby available books, sorted by distance.

    - ``GET /books/browse/`` — paginated list with distance annotation.
    - ``GET /books/browse/radius-counts/`` — book count per radius bucket.
    """

    permission_classes = (IsAuthenticatedOrReadOnly,)
    serializer_class = BrowseBookListSerializer
    pagination_class = BrowsePagination

    def _get_user_location(self):
        """Return the browsing location as a GEOSGeometry Point or None.

        For authenticated users their saved profile location is used.
        Anonymous users (and authenticated users without a saved location)
        may supply ``lat`` / ``lng`` query params instead.
        """
        from django.contrib.gis.geos import Point

        user = self.request.user
        if user.is_authenticated and user.location is not None:
            return user.location

        # Fallback: caller-supplied coordinates (anonymous browse or users
        # who haven't set a profile location yet).
        try:
            lat = float(self.request.query_params.get("lat", ""))
            lng = float(self.request.query_params.get("lng", ""))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return Point(lng, lat, srid=4326)
        except (TypeError, ValueError):
            pass

        return None

    def _get_validated_filters(self):
        """Parse and validate all browse query params."""
        filter_ser = BrowseFilterSerializer(data=self.request.query_params)
        filter_ser.is_valid(raise_exception=True)
        return filter_ser.validated_data

    def _get_radius(self, filters):
        user = self.request.user
        default_radius = (
            user.preferred_radius
            if user.is_authenticated and user.preferred_radius
            else 5000
        )
        return filters.get("radius", default_radius)

    def _base_queryset(self, user_location, radius):
        """Queryset of available books within radius, excluding own books and blocked users."""
        user = self.request.user
        blocked_ids = get_blocked_user_ids(user) if user.is_authenticated else set()
        qs = (
            Book.objects.select_related("owner")
            .prefetch_related("photos")
            .filter(
                status=BookStatus.AVAILABLE,
                owner__location__isnull=False,
                owner__location__distance_lte=(user_location, D(m=radius)),
            )
            .annotate(distance=Distance("owner__location", user_location))
        )
        if user.is_authenticated:
            qs = qs.exclude(owner=user).exclude(owner_id__in=blocked_ids)
        return qs

    @staticmethod
    def _is_isbn(term: str) -> bool:
        """Return True if term looks like an ISBN (10–13 digits)."""
        cleaned = term.replace("-", "").replace(" ", "")
        return cleaned.replace("X", "").isdigit() and len(cleaned) in (10, 13)

    def _apply_search(self, qs, search_term):
        """Apply FTS or ISBN exact-match to the queryset."""
        if not search_term:
            return qs, False

        if self._is_isbn(search_term):
            cleaned = search_term.replace("-", "").replace(" ", "")
            return qs.filter(isbn=cleaned), False

        query = SearchQuery(search_term, search_type="plain")
        qs = qs.filter(search_vector=query)
        qs = qs.annotate(text_rank=SearchRank(F("search_vector"), query))
        return qs, True

    @staticmethod
    def _apply_filters(qs, filters):
        """Apply genre, language, condition comma-separated filters."""
        genre = filters.get("genre")
        if genre:
            genre_list = [g.strip() for g in genre.split(",") if g.strip()]
            if genre_list:
                qs = qs.filter(genres__overlap=genre_list)

        language = filters.get("language")
        if language:
            lang_list = [l.strip() for l in language.split(",") if l.strip()]
            if lang_list:
                qs = qs.filter(language__in=lang_list)

        condition = filters.get("condition")
        if condition:
            cond_list = [c.strip() for c in condition.split(",") if c.strip()]
            if cond_list:
                qs = qs.filter(condition__in=cond_list)

        return qs

    def get_queryset(self):
        user_location = self._get_user_location()
        if user_location is None:
            return Book.objects.none()

        filters = self._get_validated_filters()
        radius = self._get_radius(filters)
        qs = self._base_queryset(user_location, radius)

        # Full-text search or ISBN match
        search_term = filters.get("search", "").strip()
        qs, has_text_rank = self._apply_search(qs, search_term)

        # Multi-value filters
        qs = self._apply_filters(qs, filters)

        # Ordering
        ordering = filters.get("ordering", "")
        if ordering == "relevance" and has_text_rank:
            qs = qs.order_by("-text_rank", "distance")
        elif ordering == "-created_at":
            qs = qs.order_by("-created_at")
        else:
            qs = qs.order_by("distance")

        return qs

    def list(self, request, *args, **kwargs):
        if self._get_user_location() is None:
            return Response(
                {"detail": "Provide 'lat' and 'lng' query params or set your profile location first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="radius-counts")
    def radius_counts(self, request):
        """Return book counts per radius bucket in a single query."""
        user_location = self._get_user_location()
        if user_location is None:
            return Response(
                {"detail": "Provide 'lat' and 'lng' query params or set your profile location first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_qs = (
            Book.objects.filter(
                status=BookStatus.AVAILABLE,
                owner__location__isnull=False,
            )
        )
        if request.user.is_authenticated:
            base_qs = base_qs.exclude(owner=request.user)

        whens = [
            When(
                owner__location__distance_lte=(user_location, D(m=r)),
                then=1,
            )
            for r in RADIUS_BUCKETS
        ]

        counts = base_qs.aggregate(
            **{
                str(r): Count(
                    Case(whens[i], output_field=IntegerField())
                )
                for i, r in enumerate(RADIUS_BUCKETS)
            }
        )

        return Response({"counts": counts})


class NearbyCountView(APIView):
    """GET /books/nearby-count/ — public book count for landing page."""

    permission_classes = (AllowAny,)

    def get(self, request):
        from django.contrib.gis.geos import Point

        try:
            lat = float(request.query_params.get("lat", ""))
            lng = float(request.query_params.get("lng", ""))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Valid 'lat' and 'lng' query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return Response(
                {"detail": "lat must be [-90,90] and lng must be [-180,180]."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            radius = int(request.query_params.get("radius", 5000))
        except (TypeError, ValueError):
            radius = 5000

        radius = max(500, min(radius, 50000))

        point = Point(lng, lat, srid=4326)
        count = (
            Book.objects.filter(
                status=BookStatus.AVAILABLE,
                owner__location__isnull=False,
                owner__location__distance_lte=(point, D(m=radius)),
            )
            .count()
        )

        return Response({"count": count, "radius": radius})


# ══════════════════════════════════════════════════════════════════════════════
# Trust & Safety endpoints (Epic 8)
# ══════════════════════════════════════════════════════════════════════════════


class BlockViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Block / Unblock / List blocked users.

    - ``POST /users/block/``           — block a user
    - ``GET  /users/block/``           — list blocked users
    - ``DELETE /users/block/{user_id}/`` — unblock a user
    """

    permission_classes = (IsAuthenticated,)
    serializer_class = BlockSerializer

    def get_queryset(self):
        return (
            Block.objects.filter(blocker=self.request.user)
            .select_related('blocked_user')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return BlockCreateSerializer
        return BlockSerializer

    def create(self, request, *args, **kwargs):
        serializer = BlockCreateSerializer(
            data=request.data, context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        blocked_user_id = serializer.validated_data['blocked_user_id']

        block, created = Block.objects.get_or_create(
            blocker=request.user,
            blocked_user_id=blocked_user_id,
        )

        if not created:
            return Response(
                {'detail': 'User is already blocked.'},
                status=status.HTTP_200_OK,
            )

        # Auto-cancel pending/accepted exchanges between the pair
        self._cancel_exchanges_between(request.user.pk, blocked_user_id)

        result = BlockSerializer(block).data
        return Response(result, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Unblock — lookup by blocked_user's UUID (not Block PK)."""
        blocked_user_id = kwargs.get('pk')
        try:
            block = Block.objects.get(
                blocker=request.user, blocked_user_id=blocked_user_id,
            )
        except Block.DoesNotExist:
            return Response(
                {'detail': 'Block not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _cancel_exchanges_between(user_a_id, user_b_id):
        """Cancel all pending/accepted/active exchanges between two users."""
        from apps.exchanges.models import ExchangeRequest, ExchangeStatus
        from django.db import models as db_models

        cancelable = [
            ExchangeStatus.PENDING,
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.CONDITIONS_PENDING,
            ExchangeStatus.ACTIVE,
        ]
        ExchangeRequest.objects.filter(
            db_models.Q(
                requester_id=user_a_id, owner_id=user_b_id,
            ) | db_models.Q(
                requester_id=user_b_id, owner_id=user_a_id,
            ),
            status__in=cancelable,
        ).update(status=ExchangeStatus.CANCELLED)


class ReportCreateView(generics.CreateAPIView):
    """POST /reports/ — create a report about a user/listing/exchange."""

    permission_classes = (IsAuthenticated, IsEmailVerified)
    serializer_class = ReportCreateSerializer

    def perform_create(self, serializer):
        report = serializer.save()
        # Fire Celery task to notify admin
        from .tasks import send_report_notification_email
        send_report_notification_email.delay(str(report.pk))


class ReportAdminListView(generics.ListAPIView):
    """GET /reports/admin/ — admin-only list of all reports."""

    permission_classes = (IsAdminUser,)
    serializer_class = ReportListSerializer

    def get_queryset(self):
        qs = Report.objects.select_related('reporter', 'reported_user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ReportAdminUpdateView(generics.UpdateAPIView):
    """PATCH /reports/admin/{id}/ — update report status/notes (admin only)."""

    permission_classes = (IsAdminUser,)
    serializer_class = ReportAdminUpdateSerializer
    queryset = Report.objects.all()
    lookup_field = 'pk'
    http_method_names = ['patch']


class DataExportView(APIView):
    """GET /users/me/data-export/ — download all personal data as JSON."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        from .services import build_data_export

        data = build_data_export(request.user)
        response = Response(data)
        response['Content-Disposition'] = 'attachment; filename="bookswap-data-export.json"'
        return response
