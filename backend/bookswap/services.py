"""Domain services — geocoding and data export for the bookswap core app.

Moved to dedicated apps:
- ``ISBNLookupService``, ``ISBNLookupError`` → ``apps.books.services``
- ``get_blocked_user_ids`` → ``apps.trust_safety.services``
"""
import logging

import httpx
from django.contrib.gis.geos import Point

logger = logging.getLogger(__name__)

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "BookSwap/1.0 (bookswap.example; contact@bookswap.example)"
TIMEOUT = 10  # seconds


class GeocodingError(Exception):
    """Raised when geocoding fails."""


class NominatimGeocodingService:
    """Geocode Dutch postcodes and reverse-geocode points via Nominatim."""

    @staticmethod
    def geocode_postcode(postcode: str, country_code: str = "nl") -> Point:
        """Convert a postcode to a PostGIS Point.

        Raises ``GeocodingError`` on network or no-result failures.
        """
        try:
            response = httpx.get(
                f"{NOMINATIM_BASE}/search",
                params={
                    "postalcode": postcode,
                    "countrycodes": country_code,
                    "format": "json",
                    "limit": 1,
                },
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT,
            )
            response.raise_for_status()
            results = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Nominatim geocode failed for %s: %s", postcode, exc)
            raise GeocodingError(f"Geocoding failed for postcode {postcode}") from exc

        if not results:
            raise GeocodingError(f"No results for postcode {postcode}")

        lat = float(results[0]["lat"])
        lng = float(results[0]["lon"])
        return Point(lng, lat, srid=4326)

    @staticmethod
    def reverse_geocode_neighborhood(point: Point) -> str:
        """Derive a neighborhood/suburb name from a point.

        Returns an empty string on failure (non-critical).
        """
        try:
            response = httpx.get(
                f"{NOMINATIM_BASE}/reverse",
                params={
                    "lat": point.y,
                    "lon": point.x,
                    "format": "json",
                    "zoom": 14,  # suburb/neighbourhood level
                },
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Nominatim reverse geocode failed: %s", exc)
            return ""

        address = data.get("address", {})
        return (
            address.get("suburb")
            or address.get("neighbourhood")
            or address.get("city_district")
            or address.get("town")
            or address.get("city")
            or ""
        )


# ── Trust & Safety helpers ────────────────────────────────────────────────────
# get_blocked_user_ids has moved to apps.trust_safety.services


def build_data_export(user) -> dict:
    """Collect all personal data for the given user as a structured dict.

    Used for GDPR data-portability (US-804 AC6).
    """
    from apps.exchanges.models import ExchangeRequest
    from apps.messaging.models import Message
    from apps.ratings.models import Rating
    from apps.trust_safety.models import Block, Report

    profile = {
        'id': str(user.pk),
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_of_birth': str(user.date_of_birth) if user.date_of_birth else None,
        'bio': user.bio,
        'neighborhood': user.neighborhood,
        'preferred_genres': user.preferred_genres,
        'preferred_language': user.preferred_language,
        'preferred_radius': user.preferred_radius,
        'avg_rating': float(user.avg_rating),
        'swap_count': user.swap_count,
        'rating_count': user.rating_count,
        'created_at': user.created_at.isoformat(),
    }

    books = list(
        user.books.values(
            'id', 'isbn', 'title', 'author', 'description',
            'condition', 'genres', 'language', 'status', 'created_at',
        )
    )
    for b in books:
        b['id'] = str(b['id'])
        b['created_at'] = b['created_at'].isoformat()

    from django.db import models as db_models
    exchanges = list(
        ExchangeRequest.objects.filter(
            db_models.Q(requester=user) | db_models.Q(owner=user)
        ).values(
            'id', 'status', 'message', 'created_at',
            'requester_id', 'owner_id',
            'requested_book_id', 'offered_book_id',
        )
    )
    for e in exchanges:
        for k in ('id', 'requester_id', 'owner_id', 'requested_book_id', 'offered_book_id'):
            e[k] = str(e[k]) if e[k] else None
        e['created_at'] = e['created_at'].isoformat()

    messages = list(
        Message.objects.filter(sender=user).values(
            'id', 'exchange_id', 'content', 'created_at',
        )
    )
    for m in messages:
        m['id'] = str(m['id'])
        m['exchange_id'] = str(m['exchange_id'])
        m['created_at'] = m['created_at'].isoformat()

    ratings_given = list(
        Rating.objects.filter(rater=user).values(
            'id', 'exchange_id', 'rated_id', 'score', 'comment', 'created_at',
        )
    )
    ratings_received = list(
        Rating.objects.filter(rated=user).values(
            'id', 'exchange_id', 'rater_id', 'score', 'comment', 'created_at',
        )
    )
    for r in ratings_given + ratings_received:
        for k in ('id', 'exchange_id', 'rated_id', 'rater_id'):
            if r.get(k):
                r[k] = str(r[k])
        r['created_at'] = r['created_at'].isoformat()

    blocks = list(
        Block.objects.filter(blocker=user).values(
            'id', 'blocked_user_id', 'created_at',
        )
    )
    for b in blocks:
        b['id'] = str(b['id'])
        b['blocked_user_id'] = str(b['blocked_user_id'])
        b['created_at'] = b['created_at'].isoformat()

    reports = list(
        Report.objects.filter(reporter=user).values(
            'id', 'reported_user_id', 'category', 'description', 'created_at',
        )
    )
    for rp in reports:
        rp['id'] = str(rp['id'])
        rp['reported_user_id'] = str(rp['reported_user_id'])
        rp['created_at'] = rp['created_at'].isoformat()

    return {
        'profile': profile,
        'books': books,
        'exchanges': exchanges,
        'messages_sent': messages,
        'ratings_given': ratings_given,
        'ratings_received': ratings_received,
        'blocks': blocks,
        'reports_filed': reports,
    }
