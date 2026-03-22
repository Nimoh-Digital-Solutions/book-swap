"""Domain services — geocoding and ISBN lookup."""
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
