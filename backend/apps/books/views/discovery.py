"""Browse / discovery viewset and the public nearby-count endpoint."""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Case, Count, F, IntegerField, When
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, inline_serializer
from rest_framework import mixins, status, viewsets
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import OptionalJWTAuthentication

from ..models import Book, BookStatus
from ..serializers import BrowseBookListSerializer, BrowseFilterSerializer
from ._helpers import _get_blocked_user_ids

RADIUS_BUCKETS = [1000, 3000, 5000, 10000, 25000]


class BrowsePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class BrowseViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """Browse nearby available books, sorted by distance."""

    authentication_classes = (OptionalJWTAuthentication,)
    permission_classes = (IsAuthenticatedOrReadOnly,)
    serializer_class = BrowseBookListSerializer
    pagination_class = BrowsePagination

    def _get_user_location(self):
        """Resolve the browse location with explicit coords taking priority.

        Priority order:
        1. Explicit ``lat``/``lng`` query params (supports "use my current
           location" toggle on both web and mobile).
        2. Authenticated user's saved profile location.
        3. ``None`` → ``get_queryset`` returns ``Book.objects.none()``.
        """
        from django.contrib.gis.geos import Point

        # Priority 1: explicit query-param coordinates (any user, auth or anon)
        try:
            lat = float(self.request.query_params.get("lat", ""))
            lng = float(self.request.query_params.get("lng", ""))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return Point(lng, lat, srid=4326)
        except (TypeError, ValueError):
            pass

        # Priority 2: authenticated user's stored profile location
        user = self.request.user
        if user.is_authenticated and user.location is not None:
            return user.location

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
    """GET /books/nearby-count/ — book count (public, used on landing page)."""

    authentication_classes = (OptionalJWTAuthentication,)
    permission_classes = (AllowAny,)

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
        stats = nearby_qs.aggregate(
            count=Count("id"),
            user_count=Count("owner", distinct=True),
        )

        return Response({"count": stats["count"], "user_count": stats["user_count"], "radius": radius})
