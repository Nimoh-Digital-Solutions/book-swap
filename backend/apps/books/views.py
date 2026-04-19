"""Views for the books app — CRUD, photos, ISBN lookup, wishlist, and browse."""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Case, Count, F, IntegerField, Q, When
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, inline_serializer
from rest_framework import mixins, status, viewsets
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from bookswap.permissions import IsEmailVerified

from .models import Book, BookPhoto, BookStatus, WishlistItem
from .permissions import IsBookOwner
from .serializers import (
    BookCreateSerializer,
    BookListSerializer,
    BookPhotoSerializer,
    BookSerializer,
    BookUpdateSerializer,
    BrowseBookListSerializer,
    BrowseFilterSerializer,
    ExternalSearchSerializer,
    ISBNLookupSerializer,
    PhotoReorderSerializer,
    WishlistItemSerializer,
)
from .services import ISBNLookupError, ISBNLookupService
from .validators import validate_book_photo


def _get_blocked_user_ids(user):
    """Lazy import to avoid circular dependency with trust_safety."""
    from apps.trust_safety.services import get_blocked_user_ids

    return get_blocked_user_ids(user)


# ── Book CRUD ─────────────────────────────────────────────────────────────────


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

        if self.action in ("update", "partial_update", "destroy"):
            return qs.filter(owner=self.request.user)

        owner_param = self.request.query_params.get("owner")
        if owner_param == "me":
            return qs.filter(owner=self.request.user)

        blocked_ids = _get_blocked_user_ids(self.request.user)
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


# ── Book Photos ───────────────────────────────────────────────────────────────


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

        return Response(BookPhotoSerializer(book.photos.all(), many=True, context={"request": request}).data)


# ── ISBN Lookup & External Search ─────────────────────────────────────────────


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


# ── Wishlist ──────────────────────────────────────────────────────────────────


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
        qs = WishlistItem.objects.filter(user=self.request.user)
        book_id = self.request.query_params.get("book")
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs


# ── Browse / Discovery ────────────────────────────────────────────────────────

RADIUS_BUCKETS = [1000, 3000, 5000, 10000, 25000]


class BrowsePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class BrowseViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """Browse nearby available books, sorted by distance."""

    permission_classes = (IsAuthenticatedOrReadOnly,)
    serializer_class = BrowseBookListSerializer
    pagination_class = BrowsePagination

    def _get_user_location(self):
        from django.contrib.gis.geos import Point

        user = self.request.user
        if user.is_authenticated and user.location is not None:
            return user.location

        try:
            lat = float(self.request.query_params.get("lat", ""))
            lng = float(self.request.query_params.get("lng", ""))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return Point(lng, lat, srid=4326)
        except (TypeError, ValueError):
            pass

        return None

    def _get_validated_filters(self):
        filter_ser = BrowseFilterSerializer(data=self.request.query_params)
        filter_ser.is_valid(raise_exception=True)
        return filter_ser.validated_data

    def _get_radius(self, filters):
        user = self.request.user
        default_radius = user.preferred_radius if user.is_authenticated and user.preferred_radius else 5000
        return filters.get("radius", default_radius)

    def _base_queryset(self, user_location, radius):
        """Return books within *radius* of *user_location*."""
        user = self.request.user
        blocked_ids = _get_blocked_user_ids(user) if user.is_authenticated else set()
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
        cleaned = term.replace("-", "").replace(" ", "")
        return cleaned.replace("X", "").isdigit() and len(cleaned) in (10, 13)

    def _apply_search(self, qs, search_term):
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
        genre = filters.get("genre")
        if genre:
            genre_list = [g.strip() for g in genre.split(",") if g.strip()]
            if genre_list:
                qs = qs.filter(genres__overlap=genre_list)

        language = filters.get("language")
        if language:
            lang_list = [lang.strip() for lang in language.split(",") if lang.strip()]
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
        filters = self._get_validated_filters()

        if user_location is None:
            return Book.objects.none()

        radius = self._get_radius(filters)
        qs = self._base_queryset(user_location, radius)

        search_term = filters.get("search", "").strip()
        qs, has_text_rank = self._apply_search(qs, search_term)
        qs = self._apply_filters(qs, filters)

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

        base_qs = Book.objects.filter(
            status=BookStatus.AVAILABLE,
            owner__location__isnull=False,
        )
        if request.user.is_authenticated:
            blocked_ids = _get_blocked_user_ids(request.user)
            base_qs = base_qs.exclude(owner=request.user).exclude(owner_id__in=blocked_ids)

        whens = [
            When(
                owner__location__distance_lte=(user_location, D(m=r)),
                then=1,
            )
            for r in RADIUS_BUCKETS
        ]

        counts = base_qs.aggregate(
            **{str(r): Count(Case(whens[i], output_field=IntegerField())) for i, r in enumerate(RADIUS_BUCKETS)}
        )

        return Response({"counts": counts})


class NearbyCountView(APIView):
    """GET /books/nearby-count/ — book count for authenticated users."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Count nearby books",
        description="Returns the count of available books within a given radius of the provided coordinates.",
        parameters=[
            OpenApiParameter(name="lat", type=float, required=True, description="Latitude (-90 to 90)"),
            OpenApiParameter(name="lng", type=float, required=True, description="Longitude (-180 to 180)"),
            OpenApiParameter(
                name="radius", type=int, required=False, description="Search radius in meters (default 5000)"
            ),
        ],
        responses={
            200: inline_serializer("NearbyCountResponse", fields={"count": drf_serializers.IntegerField()}),
            400: OpenApiResponse(description="Invalid coordinates"),
        },
        tags=["books"],
    )
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
        nearby_qs = Book.objects.filter(
            status=BookStatus.AVAILABLE,
            owner__location__isnull=False,
            owner__location__distance_lte=(point, D(m=radius)),
        )
        count = nearby_qs.count()
        user_count = nearby_qs.values("owner").distinct().count()

        return Response({"count": count, "user_count": user_count, "radius": radius})


class CommunityStatsView(APIView):
    """GET /books/community-stats/ — weekly swap count + recent activity feed."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Community stats and activity feed",
        description=(
            "Returns the number of swaps completed this week and the most recent "
            "community activity (new listings, completed swaps, ratings) within the "
            "given radius of the provided coordinates."
        ),
        parameters=[
            OpenApiParameter(name="lat", type=float, required=True),
            OpenApiParameter(name="lng", type=float, required=True),
            OpenApiParameter(name="radius", type=int, required=False, description="meters (default 10000)"),
        ],
        tags=["books"],
    )
    def get(self, request):
        from itertools import islice

        from django.contrib.gis.geos import Point
        from django.utils import timezone

        from apps.exchanges.models import ExchangeRequest, ExchangeStatus
        from apps.ratings.models import Rating

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
            search_radius = int(request.query_params.get("radius", 10000))
        except (TypeError, ValueError):
            search_radius = 10000
        search_radius = max(500, min(search_radius, 50000))

        point = Point(lng, lat, srid=4326)
        one_week_ago = timezone.now() - timezone.timedelta(days=7)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        nearby_user_ids = (
            User.objects.filter(
                location__isnull=False,
                location__distance_lte=(point, D(m=search_radius)),
            )
            .values_list("id", flat=True)
        )

        swap_statuses = (
            ExchangeStatus.SWAP_CONFIRMED,
            ExchangeStatus.COMPLETED,
            ExchangeStatus.RETURN_REQUESTED,
            ExchangeStatus.RETURNED,
        )
        swaps_this_week = ExchangeRequest.objects.filter(
            status__in=swap_statuses,
            updated_at__gte=one_week_ago,
        ).filter(
            Q(requester_id__in=nearby_user_ids) | Q(owner_id__in=nearby_user_ids),
        ).count()

        feed = []
        seen_users: set[str] = set()

        new_listings = (
            Book.objects.filter(
                status=BookStatus.AVAILABLE,
                created_at__gte=one_week_ago,
                owner_id__in=nearby_user_ids,
            )
            .select_related("owner")
            .order_by("-created_at")[:15]
        )
        for book in new_listings:
            uid = str(book.owner_id)
            if uid in seen_users:
                continue
            seen_users.add(uid)
            feed.append({
                "type": "new_listing",
                "user_name": book.owner.first_name or book.owner.username,
                "book_title": book.title,
                "neighbourhood": book.owner.neighborhood,
                "timestamp": book.created_at.isoformat(),
            })

        completed_swaps = (
            ExchangeRequest.objects.filter(
                status__in=swap_statuses,
                updated_at__gte=one_week_ago,
            )
            .filter(
                Q(requester_id__in=nearby_user_ids) | Q(owner_id__in=nearby_user_ids),
            )
            .select_related("requester", "owner")
            .order_by("-updated_at")[:15]
        )
        for swap in completed_swaps:
            uid = str(swap.requester_id)
            if uid in seen_users:
                continue
            seen_users.add(uid)
            feed.append({
                "type": "completed_swap",
                "user_name": swap.requester.first_name or swap.requester.username,
                "partner_name": swap.owner.first_name or swap.owner.username,
                "book_title": None,
                "neighbourhood": swap.requester.neighborhood or swap.owner.neighborhood,
                "timestamp": swap.updated_at.isoformat(),
            })

        recent_ratings = (
            Rating.objects.filter(
                created_at__gte=one_week_ago,
                rater_id__in=nearby_user_ids,
            )
            .select_related("rater", "rated")
            .order_by("-created_at")[:15]
        )
        for rating in recent_ratings:
            uid = str(rating.rater_id)
            if uid in seen_users:
                continue
            seen_users.add(uid)
            feed.append({
                "type": "new_rating",
                "user_name": rating.rater.first_name or rating.rater.username,
                "partner_name": rating.rated.first_name or rating.rated.username,
                "score": rating.score,
                "book_title": None,
                "neighbourhood": rating.rater.neighborhood,
                "timestamp": rating.created_at.isoformat(),
            })

        feed.sort(key=lambda e: e["timestamp"], reverse=True)
        feed = list(islice(feed, 5))

        return Response({
            "swaps_this_week": swaps_this_week,
            "activity_feed": feed,
        })
