"""Domain services — geocoding and data export for the bookswap core app.

Moved to dedicated apps:
- ``ISBNLookupService``, ``ISBNLookupError`` → ``apps.books.services``
- ``get_blocked_user_ids`` → ``apps.trust_safety.services``
"""

import logging

import httpx
from django.contrib.gis.geos import Point

from .external_http import (
    SHORT_TIMEOUT,
    CircuitBreaker,
    CircuitOpenError,
    cached_call,
)

logger = logging.getLogger(__name__)

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "BookSwap/1.0 (bookswap.example; contact@bookswap.example)"

# AUD-B-701: tight, dedicated timeouts for the two Nominatim calls.
# Both used to share a 10s budget which meant a slow upstream could pin a
# request thread for 20s on a single profile-location update.
NOMINATIM_FORWARD_TIMEOUT = SHORT_TIMEOUT  # 3s — postcode → coords
NOMINATIM_REVERSE_TIMEOUT = 2.0  # neighbourhood lookup is best-effort

# Cache TTLs.
NOMINATIM_FORWARD_TTL = 60 * 60 * 24 * 30  # 30 days — postcodes don't move
NOMINATIM_REVERSE_TTL = 60 * 60 * 24  # 24h is plenty for neighbourhood data

_nominatim_breaker = CircuitBreaker("nominatim", failure_threshold=5, cooldown=60)


class GeocodingError(Exception):
    """Raised when geocoding fails."""


def _nominatim_forward(postcode: str, country_code: str) -> Point:
    """Hit Nominatim once for a postcode → Point (no caching, no breaker)."""
    response = httpx.get(
        f"{NOMINATIM_BASE}/search",
        params={
            "postalcode": postcode,
            "countrycodes": country_code,
            "format": "json",
            "limit": 1,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=NOMINATIM_FORWARD_TIMEOUT,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise GeocodingError(f"No results for postcode {postcode}")
    lat = float(results[0]["lat"])
    lng = float(results[0]["lon"])
    return Point(lng, lat, srid=4326)


def _nominatim_query(query: str) -> Point:
    """Hit Nominatim free-text search for a place name → Point."""
    response = httpx.get(
        f"{NOMINATIM_BASE}/search",
        params={
            "q": query,
            "format": "json",
            "limit": 1,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=NOMINATIM_FORWARD_TIMEOUT,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise GeocodingError(f'No results for "{query}"')
    lat = float(results[0]["lat"])
    lng = float(results[0]["lon"])
    return Point(lng, lat, srid=4326)


def _nominatim_reverse(lat: float, lng: float) -> str:
    """Hit Nominatim once for a point → neighbourhood (no caching, no breaker)."""
    response = httpx.get(
        f"{NOMINATIM_BASE}/reverse",
        params={
            "lat": lat,
            "lon": lng,
            "format": "json",
            "zoom": 14,  # suburb/neighbourhood level
        },
        headers={"User-Agent": USER_AGENT},
        timeout=NOMINATIM_REVERSE_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    address = data.get("address", {})
    return (
        address.get("suburb")
        or address.get("neighbourhood")
        or address.get("city_district")
        or address.get("town")
        or address.get("city")
        or ""
    )


class NominatimGeocodingService:
    """Geocode Dutch postcodes and reverse-geocode points via Nominatim.

    All outbound calls are guarded by a shared circuit breaker
    (``cb:nominatim``) and cached via the Django cache so repeated lookups
    for the same postcode / coordinates do not re-hit the upstream.
    """

    @staticmethod
    def geocode_postcode(postcode: str, country_code: str = "nl") -> Point:
        """Convert a postcode to a PostGIS Point.

        Raises ``GeocodingError`` on network failures, no-result responses,
        or when the Nominatim circuit breaker is currently open.
        """
        normalised = postcode.strip().upper().replace(" ", "")
        cache_key = f"nominatim:fwd:v1:{country_code}:{normalised}"

        def _do_call() -> Point:
            return _nominatim_breaker.call(_nominatim_forward, postcode, country_code)

        try:
            return cached_call(cache_key, NOMINATIM_FORWARD_TTL, _do_call)
        except CircuitOpenError as exc:
            logger.warning("Nominatim forward geocode short-circuited (circuit open).")
            raise GeocodingError("Geocoding service is temporarily unavailable.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Nominatim geocode failed for %s: %s", postcode, exc)
            raise GeocodingError(f"Geocoding failed for postcode {postcode}") from exc

    @staticmethod
    def geocode_query(query: str) -> Point:
        """Convert a free-text place name to a PostGIS Point.

        Accepts city names, neighbourhoods, areas, or postcodes — anything
        Nominatim's free-text search can resolve. No country restriction.

        Raises ``GeocodingError`` on network failures, no-result responses,
        or when the Nominatim circuit breaker is currently open.
        """
        normalised = query.strip().lower()
        cache_key = f"nominatim:query:v1:{normalised}"

        def _do_call() -> Point:
            return _nominatim_breaker.call(_nominatim_query, query.strip())

        try:
            return cached_call(cache_key, NOMINATIM_FORWARD_TTL, _do_call)
        except CircuitOpenError as exc:
            logger.warning("Nominatim query geocode short-circuited (circuit open).")
            raise GeocodingError("Geocoding service is temporarily unavailable.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Nominatim geocode failed for query %r: %s", query, exc)
            raise GeocodingError(f'Could not find location "{query}"') from exc

    @staticmethod
    def reverse_geocode_neighborhood(point: Point) -> str:
        """Derive a neighborhood/suburb name from a point.

        Best-effort — returns an empty string on any failure (network, parse,
        or open circuit). Cache key buckets the point to ~100m so nearby
        users share a hit.
        """
        # Round to 3 decimals (~110m at the equator) — fine for a neighbourhood
        # label and gives us a much better cache hit rate.
        lat_b = round(point.y, 3)
        lng_b = round(point.x, 3)
        cache_key = f"nominatim:rev:v1:{lat_b}:{lng_b}"

        def _do_call() -> str:
            return _nominatim_breaker.call(_nominatim_reverse, point.y, point.x)

        try:
            return cached_call(cache_key, NOMINATIM_REVERSE_TTL, _do_call)
        except CircuitOpenError:
            logger.info("Nominatim reverse geocode short-circuited (circuit open).")
            return ""
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Nominatim reverse geocode failed: %s", exc)
            return ""


# ── Overpass POI discovery ────────────────────────────────────────────────────

OVERPASS_API = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 25  # seconds — Overpass can be slow

OSM_CATEGORY_MAP: dict[str, str] = {
    "library": "library",
    "cafe": "cafe",
    "park": "park",
    "station": "station",
}

OVERPASS_QUERY_TEMPLATE = """
[out:json][timeout:25];
(
  node["amenity"="library"](around:{radius},{lat},{lng});
  node["amenity"="cafe"](around:{radius},{lat},{lng});
  node["leisure"="park"](around:{radius},{lat},{lng});
  way["leisure"="park"](around:{radius},{lat},{lng});
  node["railway"="station"](around:{radius},{lat},{lng});
);
out center 80;
"""


class OverpassPOIService:
    """Discover nearby points of interest via the OSM Overpass API."""

    @staticmethod
    def find_nearby(lat: float, lng: float, radius_m: int = 5000) -> list[dict]:
        """Query Overpass for libraries, cafes, parks, and stations near a point.

        Returns a list of dicts: {name, address, category, city, lat, lng}.
        """
        query = OVERPASS_QUERY_TEMPLATE.format(radius=radius_m, lat=lat, lng=lng)

        try:
            response = httpx.post(
                OVERPASS_API,
                data={"data": query},
                headers={"User-Agent": USER_AGENT},
                timeout=OVERPASS_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Overpass POI query failed (%.4f, %.4f): %s", lat, lng, exc)
            return []

        results: list[dict] = []
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name")
            if not name:
                continue

            elem_lat = element.get("lat") or element.get("center", {}).get("lat")
            elem_lng = element.get("lon") or element.get("center", {}).get("lon")
            if not elem_lat or not elem_lng:
                continue

            category = OverpassPOIService._resolve_category(tags)
            if not category:
                continue

            address = OverpassPOIService._build_address(tags)
            city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:municipality") or ""

            results.append(
                {
                    "name": name,
                    "address": address,
                    "category": category,
                    "city": city,
                    "lat": float(elem_lat),
                    "lng": float(elem_lng),
                }
            )

        return results

    @staticmethod
    def _resolve_category(tags: dict) -> str | None:
        amenity = tags.get("amenity", "")
        if amenity in ("library",):
            return "library"
        if amenity in ("cafe",):
            return "cafe"

        leisure = tags.get("leisure", "")
        if leisure == "park":
            return "park"

        railway = tags.get("railway", "")
        if railway == "station":
            return "station"

        return None

    @staticmethod
    def _build_address(tags: dict) -> str:
        parts = [
            tags.get("addr:street", ""),
            tags.get("addr:housenumber", ""),
        ]
        street = " ".join(p for p in parts if p).strip()
        postcode = tags.get("addr:postcode", "")
        city = tags.get("addr:city") or tags.get("addr:town") or ""
        return ", ".join(p for p in (street, postcode, city) if p) or tags.get("name", "")


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
        "id": str(user.pk),
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
        "bio": user.bio,
        "neighborhood": user.neighborhood,
        "preferred_genres": user.preferred_genres,
        "preferred_language": user.preferred_language,
        "preferred_radius": user.preferred_radius,
        "avg_rating": float(user.avg_rating),
        "swap_count": user.swap_count,
        "rating_count": user.rating_count,
        "created_at": user.created_at.isoformat(),
    }

    books = list(
        user.books.values(
            "id",
            "isbn",
            "title",
            "author",
            "description",
            "condition",
            "genres",
            "language",
            "status",
            "created_at",
        )
    )
    for b in books:
        b["id"] = str(b["id"])
        b["created_at"] = b["created_at"].isoformat()

    from django.db import models as db_models

    exchanges = list(
        ExchangeRequest.objects.filter(db_models.Q(requester=user) | db_models.Q(owner=user)).values(
            "id",
            "status",
            "message",
            "created_at",
            "requester_id",
            "owner_id",
            "requested_book_id",
            "offered_book_id",
        )
    )
    for e in exchanges:
        for k in ("id", "requester_id", "owner_id", "requested_book_id", "offered_book_id"):
            e[k] = str(e[k]) if e[k] else None
        e["created_at"] = e["created_at"].isoformat()

    messages = list(
        Message.objects.filter(sender=user).values(
            "id",
            "exchange_id",
            "content",
            "created_at",
        )
    )
    for m in messages:
        m["id"] = str(m["id"])
        m["exchange_id"] = str(m["exchange_id"])
        m["created_at"] = m["created_at"].isoformat()

    ratings_given = list(
        Rating.objects.filter(rater=user).values(
            "id",
            "exchange_id",
            "rated_id",
            "score",
            "comment",
            "created_at",
        )
    )
    ratings_received = list(
        Rating.objects.filter(rated=user).values(
            "id",
            "exchange_id",
            "rater_id",
            "score",
            "comment",
            "created_at",
        )
    )
    for r in ratings_given + ratings_received:
        for k in ("id", "exchange_id", "rated_id", "rater_id"):
            if r.get(k):
                r[k] = str(r[k])
        r["created_at"] = r["created_at"].isoformat()

    blocks = list(
        Block.objects.filter(blocker=user).values(
            "id",
            "blocked_user_id",
            "created_at",
        )
    )
    for b in blocks:
        b["id"] = str(b["id"])
        b["blocked_user_id"] = str(b["blocked_user_id"])
        b["created_at"] = b["created_at"].isoformat()

    reports = list(
        Report.objects.filter(reporter=user).values(
            "id",
            "reported_user_id",
            "category",
            "description",
            "created_at",
        )
    )
    for rp in reports:
        rp["id"] = str(rp["id"])
        rp["reported_user_id"] = str(rp["reported_user_id"])
        rp["created_at"] = rp["created_at"].isoformat()

    return {
        "profile": profile,
        "books": books,
        "exchanges": exchanges,
        "messages_sent": messages,
        "ratings_given": ratings_given,
        "ratings_received": ratings_received,
        "blocks": blocks,
        "reports_filed": reports,
    }
