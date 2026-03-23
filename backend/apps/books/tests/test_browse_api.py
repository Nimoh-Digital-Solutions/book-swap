"""Tests for Epic 4 — Browse, Search, Filters, Radius Counts, and Nearby Count endpoints."""

import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from apps.books.models import BookCondition, BookStatus
from apps.books.tests.factories import BookFactory
from bookswap.tests.factories import UserFactory

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
        """Returns 400 if the user hasn't set their location and no lat/lng provided."""
        user = UserFactory(is_active=True)  # no location
        api_client.force_authenticate(user=user)
        resp = api_client.get("/api/v1/books/browse/")
        assert resp.status_code == 400
        assert "lat" in resp.data["detail"].lower() or "location" in resp.data["detail"].lower()

    def test_400_for_unauthenticated_without_coords(self, api_client):
        """Anonymous users without lat/lng get 400, not 401."""
        resp = api_client.get("/api/v1/books/browse/")
        assert resp.status_code == 400

    def test_anonymous_browse_with_lat_lng(self, api_client, nearby_books):
        """Anonymous users CAN browse when lat/lng query params are supplied."""
        resp = api_client.get("/api/v1/books/browse/?lat=52.3676&lng=4.9041")
        assert resp.status_code == 200
        assert "results" in resp.data

    def test_anonymous_browse_returns_available_books(self, api_client, nearby_books):
        """Anonymous browse results contain available books near the given coords."""
        resp = api_client.get("/api/v1/books/browse/?lat=52.3676&lng=4.9041&radius=50000")
        assert resp.status_code == 200
        for book in resp.data["results"]:
            assert book["status"] == "available"

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

    def test_400_for_unauthenticated_without_coords(self, api_client):
        """Anonymous users without lat/lng get 400 from radius-counts."""
        resp = api_client.get("/api/v1/books/browse/radius-counts/")
        assert resp.status_code == 400

    def test_anonymous_radius_counts_with_coords(self, api_client, nearby_books):
        """Anonymous users CAN use radius-counts when lat/lng are supplied."""
        resp = api_client.get("/api/v1/books/browse/radius-counts/?lat=52.3676&lng=4.9041")
        assert resp.status_code == 200
        assert "counts" in resp.data


# ═══════════════════════════════════════════════════════════════════════
# Nearby Count — GET /api/v1/books/nearby-count/
# ═══════════════════════════════════════════════════════════════════════


class TestNearbyCount:
    """GET /api/v1/books/nearby-count/ — public book count."""

    def test_returns_count_for_valid_coords(self, api_client, nearby_books):
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=5000")
        assert resp.status_code == 200
        assert "count" in resp.data
        assert isinstance(resp.data["count"], int)
        assert "radius" in resp.data

    def test_counts_books_within_radius(self, api_client, nearby_books):
        """Should count at least 1 book within 5km of Amsterdam center."""
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=5000")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_default_radius_is_5000(self, api_client, nearby_books):
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041")
        assert resp.status_code == 200
        assert resp.data["radius"] == 5000

    def test_allows_unauthenticated_access(self, api_client, nearby_books):
        """This endpoint is AllowAny for the landing page."""
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041")
        assert resp.status_code == 200

    def test_400_when_missing_coords(self, api_client):
        resp = api_client.get("/api/v1/books/nearby-count/")
        assert resp.status_code == 400

    def test_400_when_invalid_coords(self, api_client):
        resp = api_client.get("/api/v1/books/nearby-count/?lat=999&lng=999")
        assert resp.status_code == 400

    def test_radius_clamped_to_bounds(self, api_client, nearby_books):
        """Radius below 500 is clamped to 500, above 50000 to 50000."""
        resp = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=100")
        assert resp.status_code == 200
        assert resp.data["radius"] == 500

    def test_large_radius_returns_more_books(self, api_client, nearby_books):
        """50km radius finds more books than 1km."""
        resp_small = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=1000")
        resp_large = api_client.get("/api/v1/books/nearby-count/?lat=52.3676&lng=4.9041&radius=50000")
        assert resp_large.data["count"] >= resp_small.data["count"]


# ═══════════════════════════════════════════════════════════════════════
# Full-Text Search — GET /api/v1/books/browse/?search=
# ═══════════════════════════════════════════════════════════════════════


@pytest.fixture
def searchable_books(user_with_location):
    """Books with known titles/authors for FTS testing. All within 50km."""
    owner = UserFactory(is_active=True, location=NEARBY_2KM)

    fiction = BookFactory(
        owner=owner,
        title="Harry Potter and the Sorcerer's Stone",
        author="J.K. Rowling",
        genres=["fiction", "fantasy"],
        language="en",
        condition=BookCondition.GOOD,
    )
    nonfiction = BookFactory(
        owner=owner,
        title="Sapiens A Brief History",
        author="Yuval Noah Harari",
        genres=["nonfiction", "history"],
        language="en",
        condition=BookCondition.LIKE_NEW,
    )
    dutch_book = BookFactory(
        owner=owner,
        title="De Ontdekking van de Hemel",
        author="Harry Mulisch",
        genres=["fiction"],
        language="nl",
        condition=BookCondition.ACCEPTABLE,
    )
    isbn_book = BookFactory(
        owner=owner,
        title="Thinking Fast and Slow",
        author="Daniel Kahneman",
        isbn="9780374533557",
        language="en",
        condition=BookCondition.NEW,
    )

    # Force search_vector update (signal runs on save, but we need a re-save)
    for book in [fiction, nonfiction, dutch_book, isbn_book]:
        book.save()

    return {
        "fiction": fiction,
        "nonfiction": nonfiction,
        "dutch": dutch_book,
        "isbn": isbn_book,
    }


class TestBrowseSearch:
    """GET /api/v1/books/browse/?search= — full-text search."""

    def test_search_by_title(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=Potter")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Potter" in t for t in titles)

    def test_search_by_author(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=Rowling")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Potter" in t for t in titles)

    def test_search_no_results(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=nonexistentxyz123")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 0

    def test_isbn_exact_match(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=978-0374533557")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert "Thinking Fast and Slow" in titles

    def test_isbn_without_hyphens(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=9780374533557")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1

    def test_empty_search_returns_all(self, auth_client, searchable_books):
        """Empty search string returns all books (no FTS filter)."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 4


# ═══════════════════════════════════════════════════════════════════════
# Filters — genre, language, condition
# ═══════════════════════════════════════════════════════════════════════


class TestBrowseFilters:
    """GET /api/v1/books/browse/?genre=&language=&condition= — multi-value filters."""

    def test_filter_by_single_genre(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&genre=fantasy")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Potter" in t for t in titles)

    def test_filter_by_multiple_genres(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&genre=fantasy,history")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 2

    def test_filter_by_language(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&language=nl")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Hemel" in t for t in titles)
        assert not any("Potter" in t for t in titles)

    def test_filter_by_multiple_languages(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&language=en,nl")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 3

    def test_filter_by_condition(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&condition=new")
        assert resp.status_code == 200
        for book in resp.data["results"]:
            assert book["condition"] == "new"

    def test_filter_by_multiple_conditions(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&condition=good,like_new")
        assert resp.status_code == 200
        for book in resp.data["results"]:
            assert book["condition"] in ("good", "like_new")

    def test_combined_filters(self, auth_client, searchable_books):
        """Genre + language combined narrows results."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&genre=fiction&language=nl")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Hemel" in t for t in titles)
        assert not any("Potter" in t for t in titles)

    def test_search_with_filters(self, auth_client, searchable_books):
        """Search + filter combined."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=Harry&language=en")
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]]
        assert any("Potter" in t for t in titles)
        assert not any("Hemel" in t for t in titles)

    def test_no_genre_match_returns_empty(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&genre=romance")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 0


# ═══════════════════════════════════════════════════════════════════════
# Ordering — distance, -created_at, relevance
# ═══════════════════════════════════════════════════════════════════════


class TestBrowseOrdering:
    """GET /api/v1/books/browse/?ordering= — sort options."""

    def test_default_ordering_is_distance(self, auth_client, nearby_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000")
        assert resp.status_code == 200
        distances = [b["distance"] for b in resp.data["results"]]
        assert distances == sorted(distances)

    def test_ordering_by_created_at(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&ordering=-created_at")
        assert resp.status_code == 200
        dates = [b["created_at"] for b in resp.data["results"]]
        assert dates == sorted(dates, reverse=True)

    def test_ordering_by_relevance_with_search(self, auth_client, searchable_books):
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&search=Harry&ordering=relevance")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1

    def test_relevance_without_search_falls_back_to_distance(self, auth_client, nearby_books):
        """When ordering=relevance but no search term, falls back to distance."""
        resp = auth_client.get("/api/v1/books/browse/?radius=50000&ordering=relevance")
        assert resp.status_code == 200
        distances = [b["distance"] for b in resp.data["results"]]
        assert distances == sorted(distances)
