"""Utilities for bookswap."""

import io
import logging
import math

from django.contrib.gis.geos import Point

logger = logging.getLogger(__name__)

_AVATAR_TIMEOUT_S = 8
_AVATAR_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def set_avatar_from_url(user, url: str) -> bool:
    """Download an image from *url* and persist it as *user.avatar*.

    Only acts when the user has no avatar yet.  Returns ``True`` on success,
    ``False`` on any error (network failure, image too large, bad status).
    Never raises — callers can fire-and-forget.
    """
    import requests
    from django.core.files.base import ContentFile

    if not url or user.avatar:
        return False

    try:
        resp = requests.get(url, timeout=_AVATAR_TIMEOUT_S, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "image/jpeg")
        raw_ext = content_type.split("/")[-1].split(";")[0].strip()
        ext = "jpg" if raw_ext in ("jpeg", "jpg") else raw_ext or "jpg"

        data = io.BytesIO()
        for chunk in resp.iter_content(chunk_size=65_536):
            data.write(chunk)
            if data.tell() > _AVATAR_MAX_BYTES:
                logger.warning("Avatar URL response too large, skipping: %s", url)
                return False

        filename = f"google_{user.pk}.{ext}"
        user.avatar.save(filename, ContentFile(data.getvalue()), save=True)
        logger.info("Saved Google avatar for user %s", user.pk)
        return True

    except Exception:
        logger.warning("Failed to download avatar from %s", url, exc_info=True)
        return False


def snap_to_grid(point: Point | None, cell_size: int = 500) -> dict | None:
    """Snap a PostGIS Point to a grid cell and return approximate lat/lng.

    Uses an equirectangular approximation to convert ``cell_size`` (metres)
    into degree offsets, then floors coordinates to the nearest cell.

    Returns ``None`` if the input point is ``None``.
    Returns ``{"latitude": float, "longitude": float}`` otherwise.
    """
    if point is None:
        return None

    lat = point.y
    lng = point.x

    # 1 degree of latitude ≈ 111 320 m
    lat_cell = cell_size / 111_320
    # 1 degree of longitude varies with latitude
    lng_cell = cell_size / (111_320 * math.cos(math.radians(lat)))

    snapped_lat = math.floor(lat / lat_cell) * lat_cell + lat_cell / 2
    snapped_lng = math.floor(lng / lng_cell) * lng_cell + lng_cell / 2

    return {
        "latitude": round(snapped_lat, 4),
        "longitude": round(snapped_lng, 4),
    }
