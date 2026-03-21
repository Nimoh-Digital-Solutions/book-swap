"""Geocoding service — thin wrapper around Nominatim (OpenStreetMap)."""
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
