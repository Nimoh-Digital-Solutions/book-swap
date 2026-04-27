"""Public community stats + activity feed endpoint."""

from django.contrib.gis.measure import D
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import OptionalJWTAuthentication

from ..models import Book, BookStatus


class CommunityStatsView(APIView):
    """GET /books/community-stats/ — weekly swap count + recent activity feed (public).

    AUD-B-705: every request used to do half-a-dozen GIS counts + ORM pulls.
    The payload is cheap to recompute every few minutes but expensive to
    compute *per request*, so we cache the response by a coarse
    (lat, lng, radius) bucket for ``COMMUNITY_STATS_TTL`` seconds. Within a
    bucket every visitor in the same neighbourhood reuses the same result.
    """

    authentication_classes = (OptionalJWTAuthentication,)
    permission_classes = (AllowAny,)

    # Round to 2 decimals (~1.1 km at the equator) — coarse enough to share
    # cache hits between visitors in the same area, fine enough that the
    # "nearby" feed is still meaningful.
    LOCATION_BUCKET_DECIMALS = 2
    # Bucket the radius to the nearest 1km so e.g. 5000 / 5100 / 5500 share.
    RADIUS_BUCKET_M = 1000
    # 5 minutes is fresh enough for a "this week" feed and keeps the load
    # off the primary DB during traffic spikes.
    COMMUNITY_STATS_TTL = 60 * 5

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

        # Bucket the inputs so visitors in the same neighbourhood share a cache hit.
        lat_b = round(lat, self.LOCATION_BUCKET_DECIMALS)
        lng_b = round(lng, self.LOCATION_BUCKET_DECIMALS)
        radius_b = max(self.RADIUS_BUCKET_M, (search_radius // self.RADIUS_BUCKET_M) * self.RADIUS_BUCKET_M)

        from bookswap.external_http import cached_call

        cache_key = f"community_stats:v1:{lat_b}:{lng_b}:{radius_b}"
        payload = cached_call(
            cache_key,
            self.COMMUNITY_STATS_TTL,
            self._compute_payload,
            lat,
            lng,
            search_radius,
        )
        return Response(payload)

    @staticmethod
    def _compute_payload(lat: float, lng: float, search_radius: int) -> dict:
        """Build the stats payload — broken out so it can be wrapped in cache."""
        from itertools import islice

        from django.contrib.gis.geos import Point
        from django.utils import timezone

        from apps.exchanges.models import ExchangeRequest, ExchangeStatus
        from apps.ratings.models import Rating

        point = Point(lng, lat, srid=4326)
        one_week_ago = timezone.now() - timezone.timedelta(days=7)

        from django.contrib.auth import get_user_model

        User = get_user_model()

        nearby_user_ids = User.objects.filter(
            location__isnull=False,
            location__distance_lte=(point, D(m=search_radius)),
        ).values_list("id", flat=True)

        swap_statuses = (
            ExchangeStatus.SWAP_CONFIRMED,
            ExchangeStatus.COMPLETED,
            ExchangeStatus.RETURN_REQUESTED,
            ExchangeStatus.RETURNED,
        )
        swaps_this_week = (
            ExchangeRequest.objects.filter(
                status__in=swap_statuses,
                updated_at__gte=one_week_ago,
            )
            .filter(
                Q(requester_id__in=nearby_user_ids) | Q(owner_id__in=nearby_user_ids),
            )
            .count()
        )

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
            feed.append(
                {
                    "type": "new_listing",
                    "user_name": book.owner.first_name or book.owner.username,
                    "book_title": book.title,
                    "neighbourhood": book.owner.neighborhood,
                    "timestamp": book.created_at.isoformat(),
                }
            )

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
            feed.append(
                {
                    "type": "completed_swap",
                    "user_name": swap.requester.first_name or swap.requester.username,
                    "partner_name": swap.owner.first_name or swap.owner.username,
                    "book_title": None,
                    "neighbourhood": swap.requester.neighborhood or swap.owner.neighborhood,
                    "timestamp": swap.updated_at.isoformat(),
                }
            )

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
            feed.append(
                {
                    "type": "new_rating",
                    "user_name": rating.rater.first_name or rating.rater.username,
                    "partner_name": rating.rated.first_name or rating.rated.username,
                    "score": rating.score,
                    "book_title": None,
                    "neighbourhood": rating.rater.neighborhood,
                    "timestamp": rating.created_at.isoformat(),
                }
            )

        feed.sort(key=lambda e: e["timestamp"], reverse=True)
        feed = list(islice(feed, 5))

        return {
            "swaps_this_week": swaps_this_week,
            "activity_feed": feed,
        }
