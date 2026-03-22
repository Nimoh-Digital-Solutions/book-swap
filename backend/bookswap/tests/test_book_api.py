"""Tests for Epic 3 Phase 2 — Book, Photo, ISBN, and Wishlist API endpoints."""
import io
import uuid
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from bookswap.models import Book, BookCondition, BookPhoto, BookStatus, WishlistItem
from bookswap.services import ISBNLookupError, ISBNLookupService
from bookswap.tests.factories import (
    BookFactory,
    BookPhotoFactory,
    UserFactory,
    WishlistItemFactory,
    _tiny_jpeg,
)
from bookswap.validators import validate_book_photo

pytestmark = pytest.mark.django_db


# ── Fixtures ─────────────────────────────────────────────────────────


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    user = UserFactory(is_active=True)
    api_client.force_authenticate(user=user)
    return api_client, user


def _make_image(fmt="JPEG", size=(100, 100), color="red"):
    """Return a valid in-memory image file."""
    buf = io.BytesIO()
    Image.new("RGB", size, color=color).save(buf, format=fmt)
    buf.seek(0)
    return buf


# ═══════════════════════════════════════════════════════════════════════
# ISBN Lookup Service (unit tests with mocked HTTP)
# ═══════════════════════════════════════════════════════════════════════


class TestISBNLookupService:
    """ISBNLookupService with mocked external APIs."""

    @patch("bookswap.services.httpx.get")
    def test_lookup_isbn_open_library_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "title": "Test Book",
            "authors": [{"name": "Author One"}],
            "isbn_13": ["9781234567890"],
            "covers": [12345],
            "number_of_pages": 200,
            "publish_date": "2020-01-15",
            "description": "A great book.",
        }
        mock_get.return_value = mock_resp

        result = ISBNLookupService.lookup_isbn("9781234567890")
        assert result["title"] == "Test Book"
        assert result["author"] == "Author One"
        assert result["isbn"] == "9781234567890"
        assert result["page_count"] == 200
        assert result["publish_year"] == 2020
        assert "covers.openlibrary.org" in result["cover_url"]

    @patch("bookswap.services.httpx.get")
    def test_lookup_isbn_falls_back_to_google(self, mock_get):
        """When Open Library returns 404, fall back to Google Books."""
        ol_resp = MagicMock()
        ol_resp.status_code = 404

        gb_resp = MagicMock()
        gb_resp.status_code = 200
        gb_resp.raise_for_status.return_value = None
        gb_resp.json.return_value = {
            "items": [{
                "volumeInfo": {
                    "title": "Fallback Book",
                    "authors": ["FB Author"],
                    "industryIdentifiers": [
                        {"type": "ISBN_13", "identifier": "9780000000001"},
                    ],
                    "publishedDate": "2019",
                    "pageCount": 150,
                }
            }]
        }
        mock_get.side_effect = [ol_resp, gb_resp]

        result = ISBNLookupService.lookup_isbn("9780000000001")
        assert result["title"] == "Fallback Book"
        assert result["author"] == "FB Author"
        assert result["publish_year"] == 2019

    @patch("bookswap.services.httpx.get")
    def test_lookup_isbn_both_fail_raises(self, mock_get):
        ol_resp = MagicMock()
        ol_resp.status_code = 404
        gb_resp = MagicMock()
        gb_resp.status_code = 200
        gb_resp.raise_for_status.return_value = None
        gb_resp.json.return_value = {"items": []}
        mock_get.side_effect = [ol_resp, gb_resp]

        with pytest.raises(ISBNLookupError, match="No metadata found"):
            ISBNLookupService.lookup_isbn("0000000000")

    @patch("bookswap.services.httpx.get")
    def test_search_external_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {
            "docs": [
                {
                    "title": "Harry Potter",
                    "author_name": ["J.K. Rowling"],
                    "isbn": ["9780439554930"],
                    "cover_i": 999,
                    "first_publish_year": 1997,
                },
                {
                    "title": "Another Book",
                    "author_name": ["Author Two"],
                    "isbn": [],
                },
            ]
        }
        mock_get.return_value = mock_resp

        results = ISBNLookupService.search_external("harry potter")
        assert len(results) == 2
        assert results[0]["title"] == "Harry Potter"
        assert results[0]["isbn"] == "9780439554930"
        assert results[1]["isbn"] == ""

    @patch("bookswap.services.httpx.get")
    def test_search_external_network_error_returns_empty(self, mock_get):
        import httpx
        mock_get.side_effect = httpx.ConnectError("fail")
        results = ISBNLookupService.search_external("anything")
        assert results == []


# ═══════════════════════════════════════════════════════════════════════
# Photo Validator (unit tests)
# ═══════════════════════════════════════════════════════════════════════


class TestBookPhotoValidator:

    def test_valid_jpeg(self):
        img_bytes = _make_image("JPEG").read()
        uploaded = SimpleUploadedFile("test.jpg", img_bytes, content_type="image/jpeg")
        result = validate_book_photo(uploaded)
        assert result.content_type == "image/jpeg"
        assert result.size > 0

    def test_valid_png(self):
        img_bytes = _make_image("PNG").read()
        uploaded = SimpleUploadedFile("test.png", img_bytes, content_type="image/png")
        result = validate_book_photo(uploaded)
        assert result.content_type == "image/jpeg"  # always re-saved as JPEG

    def test_rejects_non_image(self):
        from rest_framework import serializers
        uploaded = SimpleUploadedFile("test.txt", b"not an image", content_type="text/plain")
        with pytest.raises(serializers.ValidationError, match="JPEG and PNG"):
            validate_book_photo(uploaded)

    def test_rejects_oversized_file(self):
        from rest_framework import serializers
        big_bytes = b"\xff\xd8\xff" + b"\x00" * (6 * 1024 * 1024)
        uploaded = SimpleUploadedFile("big.jpg", big_bytes, content_type="image/jpeg")
        with pytest.raises(serializers.ValidationError, match="5 MB"):
            validate_book_photo(uploaded)

    def test_resizes_large_image(self):
        img_bytes = _make_image("JPEG", size=(3000, 2000)).read()
        uploaded = SimpleUploadedFile("big.jpg", img_bytes, content_type="image/jpeg")
        result = validate_book_photo(uploaded)
        # Re-open to check dimensions
        img = Image.open(io.BytesIO(result.read()))
        assert max(img.size) <= 1200


# ═══════════════════════════════════════════════════════════════════════
# Book CRUD API
# ═══════════════════════════════════════════════════════════════════════


class TestBookListView:
    """GET /api/v1/books/ — list available books."""

    def test_lists_available_books(self, auth_client):
        client, user = auth_client
        BookFactory(status=BookStatus.AVAILABLE)
        BookFactory(status=BookStatus.IN_EXCHANGE)
        response = client.get("/api/v1/books/")
        assert response.status_code == 200
        assert len(response.data["results"]) == 1

    def test_owner_me_filter(self, auth_client):
        client, user = auth_client
        BookFactory(owner=user)
        BookFactory()  # different owner
        response = client.get("/api/v1/books/?owner=me")
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["owner"]["id"] == str(user.id)

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.get("/api/v1/books/")
        assert response.status_code == 401


class TestBookCreateView:
    """POST /api/v1/books/ — create a listing."""

    def test_create_book(self, auth_client):
        client, user = auth_client
        data = {
            "title": "Test Book",
            "author": "Test Author",
            "condition": "good",
            "language": "en",
            "genres": ["fiction"],
        }
        response = client.post("/api/v1/books/", data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "Test Book"
        assert response.data["owner"]["id"] == str(user.id)
        assert Book.objects.filter(owner=user).count() == 1

    def test_create_book_with_isbn(self, auth_client):
        client, user = auth_client
        data = {
            "isbn": "9781234567890",
            "title": "ISBN Book",
            "author": "Author",
            "condition": "new",
            "language": "nl",
        }
        response = client.post("/api/v1/books/", data, format="json")
        assert response.status_code == 201
        assert response.data["isbn"] == "9781234567890"

    def test_create_missing_required_fields(self, auth_client):
        client, user = auth_client
        response = client.post("/api/v1/books/", {}, format="json")
        assert response.status_code == 400

    def test_create_too_many_genres(self, auth_client):
        client, user = auth_client
        data = {
            "title": "Book",
            "author": "Author",
            "condition": "good",
            "language": "en",
            "genres": ["a", "b", "c", "d"],
        }
        response = client.post("/api/v1/books/", data, format="json")
        assert response.status_code == 400


class TestBookDetailView:
    """GET /api/v1/books/{id}/ — book detail."""

    def test_get_book_detail(self, auth_client):
        client, _ = auth_client
        book = BookFactory(status=BookStatus.AVAILABLE)
        response = client.get(f"/api/v1/books/{book.id}/")
        assert response.status_code == 200
        assert response.data["id"] == str(book.id)
        assert "photos" in response.data
        assert "owner" in response.data

    def test_get_unavailable_book_not_found(self, auth_client):
        """Non-available books not in default queryset."""
        client, _ = auth_client
        book = BookFactory(status=BookStatus.IN_EXCHANGE)
        response = client.get(f"/api/v1/books/{book.id}/")
        assert response.status_code == 404


class TestBookUpdateView:
    """PATCH /api/v1/books/{id}/ — update (owner only)."""

    def test_owner_can_update(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        response = client.patch(
            f"/api/v1/books/{book.id}/",
            {"notes": "Updated notes"},
            format="json",
        )
        assert response.status_code == 200
        book.refresh_from_db()
        assert book.notes == "Updated notes"

    def test_non_owner_cannot_update(self, auth_client):
        client, _ = auth_client
        book = BookFactory()  # different owner
        response = client.patch(
            f"/api/v1/books/{book.id}/",
            {"notes": "Hacked"},
            format="json",
        )
        assert response.status_code in (403, 404)


class TestBookDeleteView:
    """DELETE /api/v1/books/{id}/ — delete (owner only, not if in_exchange)."""

    def test_owner_can_delete(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        response = client.delete(f"/api/v1/books/{book.id}/")
        assert response.status_code == 204
        assert not Book.objects.filter(pk=book.id).exists()

    def test_non_owner_cannot_delete(self, auth_client):
        client, _ = auth_client
        book = BookFactory()
        response = client.delete(f"/api/v1/books/{book.id}/")
        assert response.status_code in (403, 404)

    def test_cannot_delete_in_exchange_book(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user, in_exchange=True)
        response = client.delete(f"/api/v1/books/{book.id}/")
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# Book Photo API
# ═══════════════════════════════════════════════════════════════════════


class TestBookPhotoUpload:
    """POST /api/v1/books/{id}/photos/ — upload photo."""

    def test_upload_photo(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        img_bytes = _make_image("JPEG").read()
        img_file = SimpleUploadedFile("photo.jpg", img_bytes, content_type="image/jpeg")
        response = client.post(
            f"/api/v1/books/{book.id}/photos/",
            {"image": img_file},
            format="multipart",
        )
        assert response.status_code == 201
        assert book.photos.count() == 1

    def test_max_3_photos(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        for i in range(3):
            BookPhotoFactory(book=book, position=i)
        img_bytes = _make_image("JPEG").read()
        img_file = SimpleUploadedFile("photo.jpg", img_bytes, content_type="image/jpeg")
        response = client.post(
            f"/api/v1/books/{book.id}/photos/",
            {"image": img_file},
            format="multipart",
        )
        assert response.status_code == 400
        assert "3 photos" in response.data["detail"]

    def test_non_owner_cannot_upload(self, auth_client):
        client, _ = auth_client
        book = BookFactory()
        img_bytes = _make_image("JPEG").read()
        img_file = SimpleUploadedFile("photo.jpg", img_bytes, content_type="image/jpeg")
        response = client.post(
            f"/api/v1/books/{book.id}/photos/",
            {"image": img_file},
            format="multipart",
        )
        assert response.status_code == 403


class TestBookPhotoDelete:
    """DELETE /api/v1/books/{id}/photos/{photo_id}/."""

    def test_delete_photo(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        photo = BookPhotoFactory(book=book)
        response = client.delete(f"/api/v1/books/{book.id}/photos/{photo.id}/")
        assert response.status_code == 204
        assert book.photos.count() == 0

    def test_non_owner_cannot_delete_photo(self, auth_client):
        client, _ = auth_client
        book = BookFactory()
        photo = BookPhotoFactory(book=book)
        response = client.delete(f"/api/v1/books/{book.id}/photos/{photo.id}/")
        assert response.status_code == 403


class TestBookPhotoReorder:
    """PATCH /api/v1/books/{id}/photos/reorder/."""

    def test_reorder_photos(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        p0 = BookPhotoFactory(book=book, position=0)
        p1 = BookPhotoFactory(book=book, position=1)
        response = client.patch(
            f"/api/v1/books/{book.id}/photos/reorder/",
            {"photo_ids": [str(p1.id), str(p0.id)]},
            format="json",
        )
        assert response.status_code == 200
        p0.refresh_from_db()
        p1.refresh_from_db()
        assert p1.position == 0
        assert p0.position == 1

    def test_reorder_wrong_ids_rejected(self, auth_client):
        client, user = auth_client
        book = BookFactory(owner=user)
        BookPhotoFactory(book=book, position=0)
        response = client.patch(
            f"/api/v1/books/{book.id}/photos/reorder/",
            {"photo_ids": [str(uuid.uuid4())]},
            format="json",
        )
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# ISBN Lookup & External Search API
# ═══════════════════════════════════════════════════════════════════════


class TestISBNLookupView:
    """GET /api/v1/books/isbn-lookup/?isbn=<isbn>."""

    @patch.object(ISBNLookupService, "lookup_isbn")
    def test_isbn_lookup_success(self, mock_lookup, auth_client):
        client, _ = auth_client
        mock_lookup.return_value = {
            "isbn": "9781234567890",
            "title": "Test Book",
            "author": "Author",
            "description": "",
            "cover_url": "",
            "page_count": 100,
            "publish_year": 2020,
        }
        response = client.get("/api/v1/books/isbn-lookup/?isbn=9781234567890")
        assert response.status_code == 200
        assert response.data["title"] == "Test Book"

    @patch.object(ISBNLookupService, "lookup_isbn")
    def test_isbn_lookup_not_found(self, mock_lookup, auth_client):
        client, _ = auth_client
        mock_lookup.side_effect = ISBNLookupError("Not found")
        response = client.get("/api/v1/books/isbn-lookup/?isbn=9780000000000")
        assert response.status_code == 404

    def test_isbn_lookup_invalid_isbn(self, auth_client):
        client, _ = auth_client
        response = client.get("/api/v1/books/isbn-lookup/?isbn=abc")
        assert response.status_code == 400

    def test_isbn_lookup_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/books/isbn-lookup/?isbn=9781234567890")
        assert response.status_code == 401


class TestExternalSearchView:
    """GET /api/v1/books/search-external/?q=<query>."""

    @patch.object(ISBNLookupService, "search_external")
    def test_search_returns_results(self, mock_search, auth_client):
        client, _ = auth_client
        mock_search.return_value = [
            {"isbn": "123", "title": "Result", "author": "A", "description": "",
             "cover_url": "", "page_count": None, "publish_year": None},
        ]
        response = client.get("/api/v1/books/search-external/?q=test+query")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_search_missing_query(self, auth_client):
        client, _ = auth_client
        response = client.get("/api/v1/books/search-external/")
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# Wishlist API
# ═══════════════════════════════════════════════════════════════════════


class TestWishlistListView:
    """GET /api/v1/wishlist/ — list user's wishlist items."""

    def test_list_own_wishlist(self, auth_client):
        client, user = auth_client
        WishlistItemFactory(user=user)
        WishlistItemFactory()  # different user
        response = client.get("/api/v1/wishlist/")
        assert response.status_code == 200
        assert len(response.data["results"]) == 1


class TestWishlistCreateView:
    """POST /api/v1/wishlist/ — add wishlist item."""

    def test_create_wishlist_item(self, auth_client):
        client, user = auth_client
        data = {"title": "Wanted Book", "author": "Some Author"}
        response = client.post("/api/v1/wishlist/", data, format="json")
        assert response.status_code == 201
        assert WishlistItem.objects.filter(user=user).count() == 1

    def test_create_with_isbn(self, auth_client):
        client, user = auth_client
        data = {"isbn": "9781234567890"}
        response = client.post("/api/v1/wishlist/", data, format="json")
        assert response.status_code == 201

    def test_create_with_genre(self, auth_client):
        client, user = auth_client
        data = {"genre": "mystery"}
        response = client.post("/api/v1/wishlist/", data, format="json")
        assert response.status_code == 201

    def test_create_requires_at_least_one_field(self, auth_client):
        client, user = auth_client
        data = {"author": "Only Author"}  # no isbn, title, or genre
        response = client.post("/api/v1/wishlist/", data, format="json")
        assert response.status_code == 400

    def test_max_20_items(self, auth_client):
        client, user = auth_client
        for _ in range(20):
            WishlistItemFactory(user=user)
        data = {"title": "One Too Many"}
        response = client.post("/api/v1/wishlist/", data, format="json")
        assert response.status_code == 400


class TestWishlistDeleteView:
    """DELETE /api/v1/wishlist/{id}/ — remove wishlist item."""

    def test_delete_own_item(self, auth_client):
        client, user = auth_client
        item = WishlistItemFactory(user=user)
        response = client.delete(f"/api/v1/wishlist/{item.id}/")
        assert response.status_code == 204

    def test_cannot_delete_other_users_item(self, auth_client):
        client, _ = auth_client
        item = WishlistItemFactory()  # different user
        response = client.delete(f"/api/v1/wishlist/{item.id}/")
        assert response.status_code == 404  # queryset filtered to own items


# ═══════════════════════════════════════════════════════════════════════
# Serializer Unit Tests
# ═══════════════════════════════════════════════════════════════════════


class TestBookCreateSerializer:

    def test_valid_data(self):
        from bookswap.serializers import BookCreateSerializer
        from rest_framework.test import APIRequestFactory

        user = UserFactory()
        factory = APIRequestFactory()
        request = factory.post("/api/v1/books/")
        request.user = user

        data = {
            "title": "Test",
            "author": "Author",
            "condition": "good",
            "language": "en",
        }
        s = BookCreateSerializer(data=data, context={"request": request})
        assert s.is_valid(), s.errors
        book = s.save()
        assert book.owner == user

    def test_genres_max_3(self):
        from bookswap.serializers import BookCreateSerializer
        from rest_framework.test import APIRequestFactory

        user = UserFactory()
        factory = APIRequestFactory()
        request = factory.post("/api/v1/books/")
        request.user = user

        data = {
            "title": "Test",
            "author": "Author",
            "condition": "good",
            "language": "en",
            "genres": ["a", "b", "c", "d"],
        }
        s = BookCreateSerializer(data=data, context={"request": request})
        assert not s.is_valid()
        assert "genres" in s.errors


class TestISBNLookupSerializer:

    def test_valid_isbn13(self):
        from bookswap.serializers import ISBNLookupSerializer
        s = ISBNLookupSerializer(data={"isbn": "9781234567890"})
        assert s.is_valid()

    def test_valid_isbn10(self):
        from bookswap.serializers import ISBNLookupSerializer
        s = ISBNLookupSerializer(data={"isbn": "0123456789"})
        assert s.is_valid()

    def test_invalid_isbn(self):
        from bookswap.serializers import ISBNLookupSerializer
        s = ISBNLookupSerializer(data={"isbn": "abc"})
        assert not s.is_valid()

    def test_strips_dashes(self):
        from bookswap.serializers import ISBNLookupSerializer
        s = ISBNLookupSerializer(data={"isbn": "978-1-234-56789-0"})
        assert s.is_valid()
        assert s.validated_data["isbn"] == "9781234567890"


class TestWishlistItemSerializer:

    def test_requires_at_least_one_field(self):
        from bookswap.serializers import WishlistItemSerializer
        from rest_framework.test import APIRequestFactory

        user = UserFactory()
        factory = APIRequestFactory()
        request = factory.post("/api/v1/wishlist/")
        request.user = user

        s = WishlistItemSerializer(data={"author": "Only Author"}, context={"request": request})
        assert not s.is_valid()

    def test_valid_with_title(self):
        from bookswap.serializers import WishlistItemSerializer
        from rest_framework.test import APIRequestFactory

        user = UserFactory()
        factory = APIRequestFactory()
        request = factory.post("/api/v1/wishlist/")
        request.user = user

        s = WishlistItemSerializer(data={"title": "Wanted"}, context={"request": request})
        assert s.is_valid(), s.errors


class TestPermissionIsBookOwner:

    def test_owner_has_permission(self):
        from bookswap.permissions import IsBookOwner
        user = UserFactory()
        book = BookFactory(owner=user)
        perm = IsBookOwner()
        request = MagicMock()
        request.user = user
        assert perm.has_object_permission(request, None, book)

    def test_non_owner_denied(self):
        from bookswap.permissions import IsBookOwner
        user = UserFactory()
        other = UserFactory()
        book = BookFactory(owner=other)
        perm = IsBookOwner()
        request = MagicMock()
        request.user = user
        assert not perm.has_object_permission(request, None, book)
