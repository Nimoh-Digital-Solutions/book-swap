"""Spatial utilities for bookswap."""

import math

from django.contrib.gis.geos import Point


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
