"""Tests for bookswap.services — geocoding and data export."""

from unittest.mock import MagicMock, patch

import httpx
import pytest
from django.contrib.gis.geos import Point

from bookswap.services import GeocodingError, NominatimGeocodingService, build_data_export
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestNominatimReverseGeocode:
    """Cover reverse_geocode_neighborhood paths not already tested."""

    def test_returns_suburb(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"address": {"suburb": "De Pijp"}}
        mock_response.raise_for_status = MagicMock()

        with patch("bookswap.services.httpx.get", return_value=mock_response):
            result = NominatimGeocodingService.reverse_geocode_neighborhood(Point(4.89, 52.35, srid=4326))
        assert result == "De Pijp"

    def test_falls_back_to_city(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"address": {"city": "Amsterdam"}}
        mock_response.raise_for_status = MagicMock()

        with patch("bookswap.services.httpx.get", return_value=mock_response):
            result = NominatimGeocodingService.reverse_geocode_neighborhood(Point(4.89, 52.35, srid=4326))
        assert result == "Amsterdam"

    def test_empty_on_network_error(self):
        with patch("bookswap.services.httpx.get", side_effect=httpx.ConnectError("fail")):
            result = NominatimGeocodingService.reverse_geocode_neighborhood(Point(4.89, 52.35, srid=4326))
        assert result == ""

    def test_empty_on_no_address(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()

        with patch("bookswap.services.httpx.get", return_value=mock_response):
            result = NominatimGeocodingService.reverse_geocode_neighborhood(Point(4.89, 52.35, srid=4326))
        assert result == ""


class TestBuildDataExport:
    """Cover build_data_export which serializes all user data for GDPR."""

    def test_returns_expected_keys(self):
        user = UserFactory(with_location=True)
        export = build_data_export(user)
        assert set(export.keys()) == {
            "profile",
            "books",
            "exchanges",
            "messages_sent",
            "ratings_given",
            "ratings_received",
            "blocks",
            "reports_filed",
        }

    def test_profile_contains_user_fields(self):
        user = UserFactory(with_location=True)
        export = build_data_export(user)
        profile = export["profile"]
        assert profile["email"] == user.email
        assert profile["username"] == user.username
        assert "created_at" in profile

    def test_empty_collections_by_default(self):
        user = UserFactory()
        export = build_data_export(user)
        assert export["books"] == []
        assert export["exchanges"] == []
        assert export["messages_sent"] == []
        assert export["ratings_given"] == []
        assert export["ratings_received"] == []
        assert export["blocks"] == []
        assert export["reports_filed"] == []
