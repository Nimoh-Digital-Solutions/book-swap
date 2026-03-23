"""Domain services — geocoding, ISBN lookup, and trust & safety helpers."""
import logging
from typing import Any

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


# ══════════════════════════════════════════════════════════════════════════════
# Trust & Safety helpers (Epic 8)
# ══════════════════════════════════════════════════════════════════════════════


def get_blocked_user_ids(user) -> set:
    """Return the combined set of user IDs that ``user`` has blocked
    and user IDs that have blocked ``user`` (bidirectional)."""
    from .models import Block

    blocked_by_me = set(
        Block.objects.filter(blocker=user).values_list('blocked_user_id', flat=True)
    )
    blocked_me = set(
        Block.objects.filter(blocked_user=user).values_list('blocker_id', flat=True)
    )
    return blocked_by_me | blocked_me


def build_data_export(user) -> dict:
    """Collect all personal data for the given user as a structured dict.

    Used for GDPR data-portability (US-804 AC6).
    """
    from apps.exchanges.models import ExchangeRequest
    from apps.messaging.models import Message
    from apps.ratings.models import Rating

    from .models import Block, Report

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
            if k in r and r[k]:
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


# ══════════════════════════════════════════════════════════════════════════════
# ISBN Lookup Service (Epic 3 — US-301, US-302)
# ══════════════════════════════════════════════════════════════════════════════

OPEN_LIBRARY_ISBN_URL = "https://openlibrary.org/isbn/{isbn}.json"
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
ISBN_TIMEOUT = 10  # seconds


class ISBNLookupError(Exception):
    """Raised when ISBN lookup fails from all sources."""


class ISBNLookupService:
    """Look up book metadata by ISBN (Open Library → Google Books fallback)
    and search by title/author via Open Library.
    """

    @staticmethod
    def _normalise_open_library(data: dict) -> dict[str, Any]:
        """Normalise an Open Library ISBN response to a BookMetadata dict."""
        title = data.get("title", "")
        authors = data.get("authors", [])
        author_names = []
        for a in authors:
            if isinstance(a, dict) and "name" in a:
                author_names.append(a["name"])
        author = ", ".join(author_names) if author_names else ""

        description = ""
        desc_raw = data.get("description")
        if isinstance(desc_raw, str):
            description = desc_raw
        elif isinstance(desc_raw, dict):
            description = desc_raw.get("value", "")

        covers = data.get("covers", [])
        cover_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else ""

        isbn_13 = data.get("isbn_13", [])
        isbn_10 = data.get("isbn_10", [])
        isbn = (isbn_13[0] if isbn_13 else isbn_10[0]) if (isbn_13 or isbn_10) else ""

        return {
            "isbn": isbn,
            "title": title,
            "author": author,
            "description": description[:2000],
            "cover_url": cover_url,
            "page_count": data.get("number_of_pages"),
            "publish_year": _extract_year(data.get("publish_date", "")),
        }

    @staticmethod
    def _normalise_google_books(item: dict) -> dict[str, Any]:
        """Normalise a Google Books volume to a BookMetadata dict."""
        info = item.get("volumeInfo", {})
        identifiers = info.get("industryIdentifiers", [])
        isbn = ""
        for ident in identifiers:
            if ident.get("type") == "ISBN_13":
                isbn = ident["identifier"]
                break
            if ident.get("type") == "ISBN_10":
                isbn = ident["identifier"]

        image_links = info.get("imageLinks", {})
        cover_url = image_links.get("thumbnail", image_links.get("smallThumbnail", ""))

        return {
            "isbn": isbn,
            "title": info.get("title", ""),
            "author": ", ".join(info.get("authors", [])),
            "description": (info.get("description") or "")[:2000],
            "cover_url": cover_url,
            "page_count": info.get("pageCount"),
            "publish_year": _extract_year(info.get("publishedDate", "")),
        }

    @classmethod
    def lookup_isbn(cls, isbn: str) -> dict[str, Any]:
        """Look up a single ISBN. Tries Open Library first, then Google Books.

        Returns a normalised BookMetadata dict.
        Raises ``ISBNLookupError`` if both sources fail.
        """
        try:
            resp = httpx.get(
                OPEN_LIBRARY_ISBN_URL.format(isbn=isbn),
                headers={"User-Agent": USER_AGENT},
                timeout=ISBN_TIMEOUT,
                follow_redirects=True,
            )
            if resp.status_code == 200:
                return cls._normalise_open_library(resp.json())
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            logger.info("Open Library ISBN lookup failed for %s: %s", isbn, exc)

        try:
            resp = httpx.get(
                GOOGLE_BOOKS_URL,
                params={"q": f"isbn:{isbn}", "maxResults": "1"},
                headers={"User-Agent": USER_AGENT},
                timeout=ISBN_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            if items:
                return cls._normalise_google_books(items[0])
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            logger.info("Google Books ISBN lookup failed for %s: %s", isbn, exc)

        raise ISBNLookupError(f"No metadata found for ISBN {isbn}")

    @classmethod
    def search_external(cls, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Search Open Library by title/author query.

        Returns a list of normalised BookMetadata dicts (up to ``limit``).
        """
        try:
            resp = httpx.get(
                OPEN_LIBRARY_SEARCH_URL,
                params={"q": query, "limit": str(min(limit, 20))},
                headers={"User-Agent": USER_AGENT},
                timeout=ISBN_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Open Library search failed for '%s': %s", query, exc)
            return []

        results = []
        for doc in data.get("docs", []):
            cover_id = doc.get("cover_i")
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else ""
            isbn_list = doc.get("isbn", [])
            results.append({
                "isbn": isbn_list[0] if isbn_list else "",
                "title": doc.get("title", ""),
                "author": ", ".join(doc.get("author_name", [])),
                "description": "",
                "cover_url": cover_url,
                "page_count": doc.get("number_of_pages_median"),
                "publish_year": doc.get("first_publish_year"),
            })
        return results


def _extract_year(date_str: str) -> int | None:
    """Extract a 4-digit year from a date string."""
    if not date_str:
        return None
    import re
    match = re.search(r"\b(\d{4})\b", date_str)
    return int(match.group(1)) if match else None
