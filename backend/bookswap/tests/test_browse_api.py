"""Tests for Epic 4 Phase 1 — Browse, Radius Counts, and Nearby Count endpoints."""
import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from bookswap.models import BookStatus
from bookswap.tests.factories import BookFactory, UserFactory

pytestmark = pytest.mark.django_db

# ── Amsterdam area coordinates ────────────────────────────────────────
# Central: 52.3676, 4.9041
# ~2 km away: 52.3550, 4.8850
# ~8 km away: 52.3100, 4.8600
# ~30 km away: 52.1500, 4.5000

AMSTERDAM_CENTER = Point(4.9041, 52.3676, srid=4326)
NEARBY_2KM = Point(4.8850, 52.3550, srid=4326)
AWAY_8KM = Point(4.8600, 52.3100, srid=4326)
FAR_30KM = Point(4.5000, 52.1500, srid=4326)


# ── Fixtures ──────────────────────────────────────────────────────────


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_with_location():
    """Authenticated user in Amsterdam center."""
    return UserFactory(
        is_active=True,
        location=AMSTERDAM_CENTER,
        neighborhood="Amsterdam Centrum",
        onboarding_completed=True,
    )


@pytest.fixture
def auth_client(api_client, user_with_location):
    api_client.force_authenticate(user=user_with_location)
    return api_client


@pytest.fixture
def nearby_books(user_with_location):
    """Create books owned by other users at various distances."""
    owner_nearby = UserFactory(
        is_active=True,
        location=NEARBY_2KM,
        neighborhood="Amsterdam Zuid",
    )
    owner_medium = UserFactory(
        is_active=True,
        location=AWAY_8KM,
        neighborhood="Amstelveen",
    )
    owner_far = UserFactory(
        is_active=True,
        location=FAR_30KM,
        neighborhood="Leiden",
    )
    owner_no_location = UserFactory(is_active=True)  # no location set

    book_near = BookFactory(owner=owner_nearby, title="Nearby Book")
    book_medium = BookFactory(owner=owner_medium, title="Medium Book")
    book_far = BookFactory(owner=owner_far, title="Far Book")
    BookFactory(owner=owner_no_location, title="No Location Book")

    return {
        "near": book_near,
        "medium": book_medium,
        "far": book_far,
    }


# ═══════════════════════════════════════════════════════════════════════
# Browse Endpoint — GET /api/v1/books/browse/
# ═══════════════════════════════════════════════════════════════════════


class TestBrowseEndpoint:
    """GET /api/v1/books/browse/ — spatial browse with distance."""

    def test_returns_books_within_default_radius(self, auth_client, nearby_books):
        """Default radius (5000m) returns nearby book but not 8km+ books."""
        resp = auth_client.get("/api/v1/books/browse/")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "Nearby Book" in titles
        assert "Medium Book" not in titles
        assert "Far Book" not in titles

    def test_custom_radius_includes_more_books(self, auth_client, nearby_books):
        """Radius of 10000m includes the medium-distance book."""
        resp = auth_client.get("/api/v1/books/browse/?radius=10000")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "Nearby Book" in titles
        assert "Medium Book" in titles
        assert "Far Book" not in titles

    def test_large_radius_includes_all(self, auth_client, nearby_books):
        """Radius of 50000m includes all located books."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "Nearby Book" in titles
        assert "Medium Book" in titles
        assert "Far Book" in titles

    def test_distance_field_present_and_numeric(self, auth_client, nearby_books):
        """Each result has a distance field in km."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        for book in resp.data["results"]:
            assert "distance" in book
            assert isinstance(book["distance"], float)
            assert book["distance"] >= 0

    def test_sorted_by_distance_ascending(self, auth_client, nearby_books):
        """Results are sorted nearest-first."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        distances = [b["distance"] for b in resp.data["results"]]
        assert distances == sorted(distances)

    def test_excludes_own_books(self, auth_client, user_with_location):
        """User's own books are never returned."""
        BookFactory(owner=user_with_location, title="My Own Book")
        other_owner = UserFactory(is_active=True, location=NEARBY_2KM)
        BookFactory(owner=other_owner, title="Other Book")

        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "My Own Book" not in titles
        assert "Other Book" in titles

    def test_excludes_non_available_books(self, auth_client):
        """Only available books are returned."""
        owner = UserFactory(is_active=True, location=NEARBY_2KM)
        BookFactory(owner=owner, title="Available", status=BookStatus.AVAILABLE)
        BookFactory(owner=owner, title="In Exchange", status=BookStatus.IN_EXCHANGE)
        BookFactory(owner=owner, title="Returned", status=BookStatus.RETURNED)

        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "Available" in titles
        assert "In Exchange" not in titles
        assert "Returned" not in titles

    def test_excludes_books_from_owners_without_location(self, auth_client, nearby_books):
        """Books from owners with no location are excluded."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "No Location Book" not in titles

    def test_400_when_user_has_no_location(self, api_client):
        """Returns 400 if the user hasn't set their location."""
        user = UserFactory(is_active=True)  # no location
        api_client.force_authenticate(user=user)
        resp = api_client.get("/api/v1/books/browse/")
        assert resp.status_code == 400
        assert "location" in resp.data["detail"].lower()

    def test_401_for_unauthenticated(self, api_client):
        resp = api_client.get("/api/v1/books/browse/")
        assert resp.status_code == 401

    def test_invalid_radius_returns_400(self, auth_client):
        resp = auth_client.get("/api/v1/books/browse/?radius=100")
        assert resp.status_code == 400

    def test_pagination_meta(self, auth_client, nearby_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        assert "count" in resp.data
        assert "results" in resp.data

    def test_response_shape(self, auth_client, nearby_books):
        """Each book has expected fields."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        book = resp.data["results"][0]
        assert "id" in book
        assert "title" in book
        assert "author" in book
        assert "condition" in book
        assert "owner" in book
        assert "distance" in book
        owner = book["owner"]
        assert "id" in owner
        assert "username" in owner
        assert "neighborhood" in owner


# ═══════════════════════════════════════════════════════════════════════
# Radius Counts — GET /api/v1/books/browse/radius-counts/
# ═══════════════════════════════════════════════════════════════════════


class TestRadiusCounts:
    """GET /api/v1/books/browse/radius-counts/ — book count per bucket."""

    def test_returns_counts_per_bucket(self, auth_client, nearby_books):
        resp = auth_client.get("/api/v1/books/browse/radius-counts/")
        assert resp.status_code == 200
        counts = resp.data["counts"]
        assert "1000" in counts
        assert "3000" in counts
        assert "5000" in counts
        assert "10000" in counts
        assert "25000" in counts

    def test_counts_are_cumulative(self, auth_client, nearby_books):
        """Larger radius should have >= count of smaller radius."""
        resp = auth_client.get("/api/v1/books/browse/radius-counts/")
        counts = resp.data["counts"]
        prev = 0
        for r in ["1000", "3000", "5000", "10000", "25000"]:
            assert counts[r] >= prev
            prev = counts[r]

    def test_nearby_book_in_small_radius(self, auth_client, nearby_books):
        """The 2km-away book should be counted in the 3000m bucket."""
        resp = auth_client.get("/api/v1/books/browse/radius-counts/")
        counts = resp.data["counts"]
        assert counts["3000"] >= 1

    def test_400_when_user_has_no_location(self, api_client):
        user = UserFactory(is_active=True)
        api_client.force_authenticate(user=user)
        resp = api_client.get("/api/v1/books/browse/radius-counts/")
        assert resp.status_code == 400

    def test_401_for_unauthenticated(self, api_client):
        resp = api_client.get("/api/v1/books/browse/radius-counts/")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════
# Nearby Count — GET /api/v1/books/nearby-count/
# ═══════════════════════════════════════════════════════════════════════


class TestNearbyCount:
    """GET /api/v1/books/nearby-count/ — public book count."""

    def test_returns_count_for_valid_coords(self, api_client, nearby_books):
        resp = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=5000"
        )
        assert resp.status_code == 200
        assert "count" in resp.data
        assert isinstance(resp.data["count"], int)
        assert "radius" in resp.data

    def test_counts_books_within_radius(self, api_client, nearby_books):
        """Should count at least 1 book within 5km of Amsterdam center."""
        resp = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=5000"
        )
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_default_radius_is_5000(self, api_client, nearby_books):
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041")
        assert resp.status_code == 200
        assert resp.data["radius"] == 5000

    def test_allows_unauthenticated_access(self, api_client, nearby_books):
        """This endpoint is AllowAny for the landing page."""
        resp = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041"
        )
        assert resp.status_code == 200

    def test_400_when_missing_coords(self, api_client):
        resp = api_client.get("/api/v1/books/nearby-count/")
        assert resp.status_code == 400

    def test_400_when_invalid_coords(self, api_client):
        resp = api_client.get("/api/v1/books/nearby-count/?lat=999&lng=999")
        assert resp.status_code == 400

    def test_radius_clamped_to_bounds(self, api_client, nearby_books):
        """Radius below 500 is clamped to 500, above 50000 to 50000."""
        resp = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=100"
        )
        assert resp.status_code == 200
        assert resp.data["radius"] == 500

    def test_large_radius_returns_more_books(self, api_client, nearby_books):
        """50km radius finds more books than 1km."""
        resp_small = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=1000"
        )
        resp_large = api_client.get(
            "/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=50000"
        )
        assert resp_large.data["count"] >= resp_small.data["count"]
