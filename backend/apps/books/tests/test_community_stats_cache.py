"""AUD-B-705: CommunityStatsView caches its payload per (lat, lng, radius) bucket.

The view used to recompute several GIS counts on every request — fine in
isolation, painful under traffic. These tests pin the new caching behaviour:

1. The same coords + radius yield a cache HIT (no recompute).
2. Coords inside the same ~1.1km bucket also share a cache hit.
3. A different radius bucket triggers a fresh compute.
4. Bad input (non-numeric / out-of-range coords) still returns 400 without
   touching the cache.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


AMSTERDAM = Point(4.9041, 52.3676, srid=4326)
URL = "/api/v1/books/community-stats/"


@pytest.fixture
def client():
    # Anonymous client — community-stats is a public endpoint.
    UserFactory(location=AMSTERDAM)  # one user nearby so the query has data
    return APIClient()


class TestCommunityStatsCaching:
    def test_repeat_request_uses_cache(self, client):
        """Two identical requests => only one DB compute."""
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
            wraps=lambda lat, lng, r: {"swaps_this_week": 0, "activity_feed": []},
        ) as compute:
            r1 = client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 5000})
            r2 = client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 5000})

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json() == r2.json()
        compute.assert_called_once()  # cache hit on the second request

    def test_nearby_coords_share_cache_bucket(self, client):
        """Two requests within ~1km should still hit the same cache key."""
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
            wraps=lambda lat, lng, r: {"swaps_this_week": 0, "activity_feed": []},
        ) as compute:
            client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 5000})
            # Move ~80m south-east — both points round to (52.37, 4.90) at
            # 2dp, sharing the bucket.
            client.get(URL, {"lat": 52.3680, "lng": 4.9045, "radius": 5000})

        compute.assert_called_once()

    def test_far_coords_use_a_different_cache_bucket(self, client):
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
            wraps=lambda lat, lng, r: {"swaps_this_week": 0, "activity_feed": []},
        ) as compute:
            client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 5000})
            # Different city entirely — different bucket, different cache key.
            client.get(URL, {"lat": 51.9244, "lng": 4.4777, "radius": 5000})  # Rotterdam

        assert compute.call_count == 2

    def test_different_radius_bucket_recomputes(self, client):
        """Switching radius from 5km → 12km is a different bucket."""
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
            wraps=lambda lat, lng, r: {"swaps_this_week": 0, "activity_feed": []},
        ) as compute:
            client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 5000})
            client.get(URL, {"lat": 52.3676, "lng": 4.9041, "radius": 12000})

        assert compute.call_count == 2

    def test_invalid_coords_return_400_without_compute(self, client):
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
        ) as compute:
            resp = client.get(URL, {"lat": "abc", "lng": 4.9})
        assert resp.status_code == 400
        compute.assert_not_called()

    def test_out_of_range_coords_return_400_without_compute(self, client):
        with patch(
            "apps.books.views.CommunityStatsView._compute_payload",
        ) as compute:
            resp = client.get(URL, {"lat": 200, "lng": 4.9})
        assert resp.status_code == 400
        compute.assert_not_called()
