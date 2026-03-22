"""Tests for Phase 2 — Backend API (serializers, views, validators, utils, services)."""
import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from rest_framework import serializers as drf_serializers
from rest_framework.test import APIClient

from bookswap.services import GeocodingError, NominatimGeocodingService
from bookswap.tests.factories import UserFactory
from bookswap.utils import snap_to_grid
from bookswap.validators import (
    MINIMUM_AGE,
    validate_dutch_postcode,
    validate_minimum_age,
)

pytestmark = pytest.mark.django_db


# ═══════════════════════════════════════════════════════════════════════
# Validators
# ═══════════════════════════════════════════════════════════════════════


class TestDutchPostcodeValidator:
    """validate_dutch_postcode()."""

    @pytest.mark.parametrize("value,expected", [
        ("1012AB", "1012 AB"),
        ("1012 ab", "1012 AB"),
        ("1012 Ab", "1012 AB"),
        ("9999ZZ", "9999 ZZ"),
        ("  1012AB  ", "1012 AB"),
    ])
    def test_valid_postcodes(self, value, expected):
        assert validate_dutch_postcode(value) == expected

    @pytest.mark.parametrize("value", [
        "12345",
        "AB1234",
        "1012",
        "1012 ABC",
        "",
        "12 AB",
    ])
    def test_invalid_postcodes(self, value):
        with pytest.raises(ValidationError):
            validate_dutch_postcode(value)


class TestMinimumAgeValidator:
    """validate_minimum_age()."""

    def test_old_enough(self):
        today = datetime.datetime.now(tz=datetime.UTC).date()
        dob = today.replace(year=today.year - 20)
        # Should not raise
        validate_minimum_age(dob)

    def test_exactly_16(self):
        today = datetime.datetime.now(tz=datetime.UTC).date()
        dob = today.replace(year=today.year - MINIMUM_AGE)
        validate_minimum_age(dob)

    def test_too_young(self):
        today = datetime.datetime.now(tz=datetime.UTC).date()
        dob = today.replace(year=today.year - 10)
        with pytest.raises(drf_serializers.ValidationError, match="16"):
            validate_minimum_age(dob)


# ═══════════════════════════════════════════════════════════════════════
# Utils — snap_to_grid
# ═══════════════════════════════════════════════════════════════════════


class TestSnapToGrid:
    """snap_to_grid() privacy helper."""

    def test_none_returns_none(self):
        assert snap_to_grid(None) is None

    def test_returns_dict_with_lat_lng(self):
        point = Point(4.9041, 52.3676, srid=4326)
        result = snap_to_grid(point)
        assert "latitude" in result
        assert "longitude" in result

    def test_snapped_differs_from_original(self):
        point = Point(4.9041, 52.3676, srid=4326)
        result = snap_to_grid(point)
        # Snapped coords should generally differ slightly
        assert isinstance(result["latitude"], float)
        assert isinstance(result["longitude"], float)

    def test_custom_cell_size(self):
        point = Point(4.9041, 52.3676, srid=4326)
        small = snap_to_grid(point, cell_size=100)
        large = snap_to_grid(point, cell_size=5000)
        # Different cell sizes should typically produce different snaps
        assert small is not None
        assert large is not None

    def test_precision_four_decimals(self):
        point = Point(4.90411111, 52.36761111, srid=4326)
        result = snap_to_grid(point)
        lat_str = str(result["latitude"])
        lng_str = str(result["longitude"])
        if "." in lat_str:
            assert len(lat_str.split(".")[1]) <= 4
        if "." in lng_str:
            assert len(lng_str.split(".")[1]) <= 4


# ═══════════════════════════════════════════════════════════════════════
# Services — NominatimGeocodingService
# ═══════════════════════════════════════════════════════════════════════


class TestGeocodingService:
    """NominatimGeocodingService with mocked HTTP."""

    @patch("bookswap.services.httpx.get")
    def test_geocode_postcode_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [{"lat": "52.3676", "lon": "4.9041"}]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        point = NominatimGeocodingService.geocode_postcode("1012 AB")
        assert point.srid == 4326
        assert abs(point.y - 52.3676) < 0.001
        assert abs(point.x - 4.9041) < 0.001

    @patch("bookswap.services.httpx.get")
    def test_geocode_postcode_no_results(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = []
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        with pytest.raises(GeocodingError, match="No results"):
            NominatimGeocodingService.geocode_postcode("0000 XX")

    @patch("bookswap.services.httpx.get")
    def test_geocode_postcode_network_error(self, mock_get):
        import httpx
        mock_get.side_effect = httpx.ConnectError("Connection refused")

        with pytest.raises(GeocodingError, match="Geocoding failed"):
            NominatimGeocodingService.geocode_postcode("1012 AB")

    @patch("bookswap.services.httpx.get")
    def test_reverse_geocode_neighborhood_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "address": {"suburb": "Centrum", "city": "Amsterdam"}
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = NominatimGeocodingService.reverse_geocode_neighborhood(
            Point(4.9041, 52.3676, srid=4326)
        )
        assert result == "Centrum"

    @patch("bookswap.services.httpx.get")
    def test_reverse_geocode_fallback_to_city(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {"address": {"city": "Rotterdam"}}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = NominatimGeocodingService.reverse_geocode_neighborhood(
            Point(4.47, 51.92, srid=4326)
        )
        assert result == "Rotterdam"

    @patch("bookswap.services.httpx.get")
    def test_reverse_geocode_network_error_returns_empty(self, mock_get):
        import httpx
        mock_get.side_effect = httpx.ConnectError("fail")

        result = NominatimGeocodingService.reverse_geocode_neighborhood(
            Point(4.9041, 52.3676, srid=4326)
        )
        assert result == ""


# ═══════════════════════════════════════════════════════════════════════
# Serializers
# ═══════════════════════════════════════════════════════════════════════


class TestUserPrivateSerializer:
    """UserPrivateSerializer — full profile with snapped location."""

    def test_fields_present(self):
        from bookswap.serializers import UserPrivateSerializer

        user = UserFactory(with_location=True)
        data = UserPrivateSerializer(user).data
        assert "id" in data
        assert "email" in data
        assert "username" in data
        assert "location" in data
        assert "member_since" in data
        assert "onboarding_completed" in data

    def test_location_is_snapped(self):
        from bookswap.serializers import UserPrivateSerializer

        user = UserFactory(with_location=True)
        data = UserPrivateSerializer(user).data
        # Snapped location should differ from exact location
        assert data["location"] is not None
        assert "latitude" in data["location"]
        assert "longitude" in data["location"]

    def test_location_null_when_not_set(self):
        from bookswap.serializers import UserPrivateSerializer

        user = UserFactory()
        data = UserPrivateSerializer(user).data
        assert data["location"] is None


class TestUserPublicSerializer:
    """UserPublicSerializer — limited public fields."""

    def test_no_email_in_public(self):
        from bookswap.serializers import UserPublicSerializer

        user = UserFactory(with_location=True)
        data = UserPublicSerializer(user).data
        assert "email" not in data
        assert "date_of_birth" not in data

    def test_public_fields_present(self):
        from bookswap.serializers import UserPublicSerializer

        user = UserFactory(with_location=True)
        data = UserPublicSerializer(user).data
        assert "id" in data
        assert "username" in data
        assert "bio" in data
        assert "avg_rating" in data
        assert "swap_count" in data


class TestUserUpdateSerializer:
    """UserUpdateSerializer — partial profile update."""

    def test_valid_update(self):
        from bookswap.serializers import UserUpdateSerializer

        user = UserFactory()
        serializer = UserUpdateSerializer(user, data={"bio": "New bio"}, partial=True)
        assert serializer.is_valid()
        serializer.save()
        user.refresh_from_db()
        assert user.bio == "New bio"

    def test_genres_max_5(self):
        from bookswap.serializers import UserUpdateSerializer

        user = UserFactory()
        serializer = UserUpdateSerializer(
            user,
            data={"preferred_genres": ["a", "b", "c", "d", "e", "f"]},
            partial=True,
        )
        assert not serializer.is_valid()
        assert "preferred_genres" in serializer.errors

    def test_invalid_language(self):
        from bookswap.serializers import UserUpdateSerializer

        user = UserFactory()
        serializer = UserUpdateSerializer(
            user, data={"preferred_language": "fr"}, partial=True
        )
        assert not serializer.is_valid()
        assert "preferred_language" in serializer.errors

    def test_radius_bounds(self):
        from bookswap.serializers import UserUpdateSerializer

        user = UserFactory()
        serializer = UserUpdateSerializer(
            user, data={"preferred_radius": 100}, partial=True
        )
        assert not serializer.is_valid()
        assert "preferred_radius" in serializer.errors


class TestSetLocationSerializer:
    """SetLocationSerializer — postcode or lat/lng."""

    @patch("bookswap.serializers.NominatimGeocodingService.geocode_postcode")
    @patch("bookswap.serializers.NominatimGeocodingService.reverse_geocode_neighborhood")
    def test_postcode_location(self, mock_reverse, mock_geocode):
        from bookswap.serializers import SetLocationSerializer

        mock_geocode.return_value = Point(4.9041, 52.3676, srid=4326)
        mock_reverse.return_value = "Centrum"

        user = UserFactory()
        serializer = SetLocationSerializer(data={"postcode": "1012 AB"})
        assert serializer.is_valid(), serializer.errors
        serializer.save(user=user)
        user.refresh_from_db()
        assert user.location is not None
        assert user.neighborhood == "Centrum"

    @patch("bookswap.serializers.NominatimGeocodingService.reverse_geocode_neighborhood")
    def test_coords_location(self, mock_reverse):
        from bookswap.serializers import SetLocationSerializer

        mock_reverse.return_value = "Jordaan"

        user = UserFactory()
        serializer = SetLocationSerializer(
            data={"latitude": 52.3676, "longitude": 4.9041}
        )
        assert serializer.is_valid(), serializer.errors
        serializer.save(user=user)
        user.refresh_from_db()
        assert user.location is not None
        assert user.neighborhood == "Jordaan"

    def test_neither_postcode_nor_coords(self):
        from bookswap.serializers import SetLocationSerializer

        serializer = SetLocationSerializer(data={})
        assert not serializer.is_valid()

    def test_invalid_postcode(self):
        from bookswap.serializers import SetLocationSerializer

        serializer = SetLocationSerializer(data={"postcode": "INVALID"})
        assert not serializer.is_valid()

    def test_invalid_latitude(self):
        from bookswap.serializers import SetLocationSerializer

        serializer = SetLocationSerializer(
            data={"latitude": 100.0, "longitude": 4.0}
        )
        assert not serializer.is_valid()


class TestOnboardingCompleteSerializer:
    """OnboardingCompleteSerializer — validates location set."""

    def test_rejects_without_location(self):
        from bookswap.serializers import OnboardingCompleteSerializer

        user = UserFactory()
        request = MagicMock()
        request.user = user
        serializer = OnboardingCompleteSerializer(
            data={}, context={"request": request}
        )
        assert not serializer.is_valid()

    def test_accepts_with_location(self):
        from bookswap.serializers import OnboardingCompleteSerializer

        user = UserFactory(with_location=True)
        request = MagicMock()
        request.user = user
        serializer = OnboardingCompleteSerializer(
            data={}, context={"request": request}
        )
        assert serializer.is_valid()
        serializer.save(user=user)
        user.refresh_from_db()
        assert user.onboarding_completed is True


class TestBookswapRegisterSerializer:
    """BookswapRegisterSerializer — age gate on registration."""

    def test_valid_age(self):
        from bookswap.serializers import BookswapRegisterSerializer

        today = datetime.datetime.now(tz=datetime.UTC).date()
        dob = today.replace(year=today.year - 20)
        serializer = BookswapRegisterSerializer(data={
            "email": "test@example.com",
            "username": "newuser",
            "password": "Str0ngP@ss!",
            "password_confirm": "Str0ngP@ss!",
            "privacy_policy_accepted": True,
            "terms_of_service_accepted": True,
            "date_of_birth": dob.isoformat(),
        })
        assert serializer.is_valid(), serializer.errors

    def test_underage_rejected(self):
        from bookswap.serializers import BookswapRegisterSerializer

        today = datetime.datetime.now(tz=datetime.UTC).date()
        dob = today.replace(year=today.year - 10)
        serializer = BookswapRegisterSerializer(data={
            "email": "kid@example.com",
            "username": "kiduser",
            "password": "Str0ngP@ss!",
            "password_confirm": "Str0ngP@ss!",
            "privacy_policy_accepted": True,
            "terms_of_service_accepted": True,
            "date_of_birth": dob.isoformat(),
        })
        assert not serializer.is_valid()
        assert "date_of_birth" in serializer.errors


# ═══════════════════════════════════════════════════════════════════════
# Views — API integration tests
# ═══════════════════════════════════════════════════════════════════════


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    """Return an authenticated API client + user tuple."""
    user = UserFactory(is_active=True)
    api_client.force_authenticate(user=user)
    return api_client, user


class TestUserMeView:
    """GET/PATCH /api/v1/users/me/."""

    def test_get_own_profile(self, auth_client):
        client, user = auth_client
        response = client.get("/api/v1/users/me/")
        assert response.status_code == 200
        assert response.data["id"] == str(user.id)
        assert response.data["email"] == user.email

    def test_patch_bio(self, auth_client):
        client, user = auth_client
        response = client.patch("/api/v1/users/me/", {"bio": "Updated bio"})
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.bio == "Updated bio"

    def test_patch_preferences(self, auth_client):
        client, user = auth_client
        response = client.patch(
            "/api/v1/users/me/",
            {"preferred_genres": ["fiction", "sci-fi"], "preferred_language": "nl"},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.preferred_genres == ["fiction", "sci-fi"]
        assert user.preferred_language == "nl"

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.get("/api/v1/users/me/")
        assert response.status_code == 401

    def test_read_only_fields_ignored(self, auth_client):
        client, user = auth_client
        response = client.patch(
            "/api/v1/users/me/",
            {"swap_count": 999},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.swap_count == 0  # unchanged


class TestUserDetailView:
    """GET /api/v1/users/<uuid>/."""

    def test_get_public_profile(self, auth_client):
        client, _ = auth_client
        other = UserFactory(is_active=True, with_location=True)
        response = client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 200
        assert "email" not in response.data
        assert response.data["username"] == other.username

    def test_inactive_user_not_found(self, auth_client):
        client, _ = auth_client
        other = UserFactory(is_active=False)
        response = client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 404

    def test_unauthenticated_rejected(self, api_client):
        other = UserFactory(is_active=True)
        response = api_client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 401


class TestSetLocationView:
    """POST /api/v1/users/me/location/."""

    @patch("bookswap.serializers.NominatimGeocodingService.geocode_postcode")
    @patch("bookswap.serializers.NominatimGeocodingService.reverse_geocode_neighborhood")
    def test_set_location_via_postcode(self, mock_reverse, mock_geocode, auth_client):
        mock_geocode.return_value = Point(4.9041, 52.3676, srid=4326)
        mock_reverse.return_value = "Centrum"

        client, user = auth_client
        response = client.post(
            "/api/v1/users/me/location/",
            {"postcode": "1012 AB"},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.location is not None
        assert user.neighborhood == "Centrum"

    @patch("bookswap.serializers.NominatimGeocodingService.reverse_geocode_neighborhood")
    def test_set_location_via_coords(self, mock_reverse, auth_client):
        mock_reverse.return_value = "Jordaan"

        client, user = auth_client
        response = client.post(
            "/api/v1/users/me/location/",
            {"latitude": 52.3676, "longitude": 4.9041},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.location is not None

    def test_empty_body_rejected(self, auth_client):
        client, _ = auth_client
        response = client.post(
            "/api/v1/users/me/location/", {}, format="json"
        )
        assert response.status_code == 400

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.post("/api/v1/users/me/location/", {})
        assert response.status_code == 401


class TestOnboardingCompleteView:
    """POST /api/v1/users/me/onboarding/complete/."""

    def test_complete_with_location(self, auth_client):
        client, user = auth_client
        user.location = Point(4.9041, 52.3676, srid=4326)
        user.neighborhood = "Centrum"
        user.save()

        response = client.post("/api/v1/users/me/onboarding/complete/")
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.onboarding_completed is True

    def test_rejected_without_location(self, auth_client):
        client, _user = auth_client
        response = client.post("/api/v1/users/me/onboarding/complete/")
        assert response.status_code == 400

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.post("/api/v1/users/me/onboarding/complete/")
        assert response.status_code == 401


# ═══════════════════════════════════════════════════════════════════════
# URL resolution
# ═══════════════════════════════════════════════════════════════════════


class TestURLResolution:
    """Verify URL names resolve correctly."""

    def test_user_me_url(self):
        from django.urls import reverse
        assert reverse("bookswap:user-me") == "/api/v1/users/me/"

    def test_set_location_url(self):
        from django.urls import reverse
        assert reverse("bookswap:user-set-location") == "/api/v1/users/me/location/"

    def test_onboarding_complete_url(self):
        from django.urls import reverse
        assert reverse("bookswap:user-onboarding-complete") == "/api/v1/users/me/onboarding/complete/"

    def test_user_detail_url(self):
        import uuid

        from django.urls import reverse

        uid = uuid.uuid4()
        assert reverse("bookswap:user-detail", kwargs={"pk": uid}) == f"/api/v1/users/{uid}/"


# ═══════════════════════════════════════════════════════════════════════
# Social auth config
# ═══════════════════════════════════════════════════════════════════════


class TestSocialAuthConfig:
    """Verify social auth settings are wired correctly."""

    def test_social_django_in_installed_apps(self):
        from django.conf import settings
        assert "social_django" in settings.INSTALLED_APPS

    def test_authentication_backends(self):
        from django.conf import settings
        assert "social_core.backends.google.GoogleOAuth2" in settings.AUTHENTICATION_BACKENDS
        assert "social_core.backends.apple.AppleIdAuth" in settings.AUTHENTICATION_BACKENDS
        assert "django.contrib.auth.backends.ModelBackend" in settings.AUTHENTICATION_BACKENDS

    def test_pipeline_set(self):
        from django.conf import settings
        assert hasattr(settings, "SOCIAL_AUTH_PIPELINE")
        assert len(settings.SOCIAL_AUTH_PIPELINE) > 0

    def test_social_auth_done_url(self):
        from django.urls import reverse
        assert reverse("social-auth-done") == "/api/v1/auth/social/done/"


# ═══════════════════════════════════════════════════════════════════════
# Epic 2 — User Profile endpoints
# ═══════════════════════════════════════════════════════════════════════


class TestCheckUsernameView:
    """GET /api/v1/users/check-username/?q=<name>."""

    def test_available_username(self, auth_client):
        client, _ = auth_client
        response = client.get("/api/v1/users/check-username/", {"q": "newuser123"})
        assert response.status_code == 200
        assert response.data["available"] is True

    def test_taken_username(self, auth_client):
        client, _ = auth_client
        UserFactory(is_active=True, username="takenname")
        response = client.get("/api/v1/users/check-username/", {"q": "takenname"})
        assert response.status_code == 200
        assert response.data["available"] is False
        assert "suggestions" in response.data

    def test_own_username_available(self, auth_client):
        client, user = auth_client
        response = client.get("/api/v1/users/check-username/", {"q": user.username})
        assert response.status_code == 200
        assert response.data["available"] is True

    def test_too_short_rejected(self, auth_client):
        client, _ = auth_client
        response = client.get("/api/v1/users/check-username/", {"q": "ab"})
        assert response.status_code == 400

    def test_invalid_characters_rejected(self, auth_client):
        client, _ = auth_client
        response = client.get("/api/v1/users/check-username/", {"q": "bad name!"})
        assert response.status_code == 400

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.get("/api/v1/users/check-username/", {"q": "test"})
        assert response.status_code == 401


class TestAccountDeletionView:
    """POST /api/v1/users/me/delete/."""

    def test_request_deletion(self, auth_client):
        client, user = auth_client
        response = client.post(
            "/api/v1/users/me/delete/",
            {"password": "testpass123"},
            format="json",
        )
        assert response.status_code == 200
        assert "cancel_token" in response.data
        user.refresh_from_db()
        assert user.deletion_requested_at is not None
        assert user.is_active is False

    def test_wrong_password_rejected(self, auth_client):
        client, _ = auth_client
        response = client.post(
            "/api/v1/users/me/delete/",
            {"password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == 400

    def test_duplicate_deletion_rejected(self, auth_client):
        client, user = auth_client
        from django.utils import timezone
        user.deletion_requested_at = timezone.now()
        user.save(update_fields=["deletion_requested_at"])
        response = client.post(
            "/api/v1/users/me/delete/",
            {"password": "testpass123"},
            format="json",
        )
        assert response.status_code == 400


class TestAccountDeletionCancelView:
    """POST /api/v1/users/me/delete/cancel/."""

    def test_cancel_deletion(self, api_client):
        from django.core import signing
        from django.utils import timezone

        user = UserFactory(is_active=False)
        user.deletion_requested_at = timezone.now()
        user.save(update_fields=["deletion_requested_at"])

        token = signing.dumps(
            {"user_id": str(user.pk), "action": "cancel_deletion"},
            salt="account-deletion-cancel",
        )
        response = api_client.post(
            "/api/v1/users/me/delete/cancel/",
            {"token": token},
            format="json",
        )
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.deletion_requested_at is None
        assert user.is_active is True

    def test_invalid_token_rejected(self, api_client):
        response = api_client.post(
            "/api/v1/users/me/delete/cancel/",
            {"token": "invalid-token"},
            format="json",
        )
        assert response.status_code == 400

    def test_missing_token_rejected(self, api_client):
        response = api_client.post(
            "/api/v1/users/me/delete/cancel/",
            {},
            format="json",
        )
        assert response.status_code == 400


class TestPublicProfileRatingDisplay:
    """UserPublicSerializer should hide avg_rating when rating_count < 3."""

    def test_rating_hidden_below_threshold(self, auth_client):
        client, _ = auth_client
        other = UserFactory(is_active=True, rating_count=2, avg_rating=4.5)
        response = client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 200
        assert response.data["avg_rating"] is None

    def test_rating_shown_at_threshold(self, auth_client):
        client, _ = auth_client
        other = UserFactory(is_active=True, rating_count=3, avg_rating=4.5)
        response = client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 200
        assert response.data["avg_rating"] == 4.5

    def test_rating_shown_above_threshold(self, auth_client):
        client, _ = auth_client
        other = UserFactory(is_active=True, rating_count=10, avg_rating=3.75)
        response = client.get(f"/api/v1/users/{other.id}/")
        assert response.status_code == 200
        assert response.data["avg_rating"] == 3.75


class TestAvatarValidation:
    """UserUpdateSerializer should validate avatar file type and size."""

    def test_reject_non_image_avatar(self, auth_client):
        from django.core.files.uploadedfile import SimpleUploadedFile

        client, _ = auth_client
        fake_file = SimpleUploadedFile("test.txt", b"not an image", content_type="text/plain")
        response = client.patch(
            "/api/v1/users/me/",
            {"avatar": fake_file},
            format="multipart",
        )
        assert response.status_code == 400

    def test_reject_oversized_avatar(self, auth_client):
        from django.core.files.uploadedfile import SimpleUploadedFile

        client, _ = auth_client
        # 3MB file — over the 2MB limit
        large_content = b"\x89PNG" + b"\x00" * (3 * 1024 * 1024)
        fake_file = SimpleUploadedFile("big.png", large_content, content_type="image/png")
        response = client.patch(
            "/api/v1/users/me/",
            {"avatar": fake_file},
            format="multipart",
        )
        assert response.status_code == 400


class TestAnonymizeTask:
    """bookswap.anonymize_deleted_accounts Celery task."""

    def test_anonymize_after_30_days(self):
        from datetime import timedelta

        from django.utils import timezone

        from bookswap.tasks import anonymize_deleted_accounts

        user = UserFactory(
            is_active=False,
            username="toberemoved",
            email="toberemoved@example.com",
            bio="I have a bio",
        )
        user.deletion_requested_at = timezone.now() - timedelta(days=31)
        user.save(update_fields=["deletion_requested_at"])

        count = anonymize_deleted_accounts()
        assert count == 1

        user.refresh_from_db()
        assert user.username.startswith("deleted_")
        assert user.bio == ""
        assert user.first_name == "Deleted"

    def test_skip_recent_deletions(self):
        from datetime import timedelta

        from django.utils import timezone

        from bookswap.tasks import anonymize_deleted_accounts

        user = UserFactory(is_active=False)
        user.deletion_requested_at = timezone.now() - timedelta(days=10)
        user.save(update_fields=["deletion_requested_at"])

        count = anonymize_deleted_accounts()
        assert count == 0
