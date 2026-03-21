"""Tests for the BookSwap User model (Phase 1 — Data Layer)."""
import uuid
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db import models as django_models

from bookswap.models import User
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


# ── AUTH_USER_MODEL resolution ───────────────────────────────────────────────

class TestAuthUserModel:
    def test_get_user_model_returns_bookswap_user(self):
        assert get_user_model() is User

    def test_auth_user_model_setting(self, settings):
        assert settings.AUTH_USER_MODEL == 'bookswap.User'


# ── Factory smoke test ───────────────────────────────────────────────────────

class TestUserFactory:
    def test_create_user_via_factory(self):
        user = UserFactory()
        assert user.pk is not None
        assert isinstance(user.pk, uuid.UUID)

    def test_create_user_with_location(self):
        user = UserFactory(with_location=True)
        assert user.location is not None
        assert user.neighborhood == 'Amsterdam Centrum'

    def test_create_onboarded_user(self):
        user = UserFactory(onboarded=True)
        assert user.onboarding_completed is True
        assert len(user.preferred_genres) == 2


# ── Field existence and types ────────────────────────────────────────────────

class TestFieldExistence:
    """Verify all 15 domain fields exist with correct types."""

    @pytest.fixture()
    def fields(self):
        return {f.name: f for f in User._meta.get_fields()}

    def test_date_of_birth_is_date_field(self, fields):
        assert isinstance(fields['date_of_birth'], django_models.DateField)

    def test_bio_is_char_field(self, fields):
        assert isinstance(fields['bio'], django_models.CharField)

    def test_avatar_is_image_field(self, fields):
        assert isinstance(fields['avatar'], django_models.ImageField)

    def test_location_is_point_field(self, fields):
        from django.contrib.gis.db import models as gis_models
        assert isinstance(fields['location'], gis_models.PointField)

    def test_neighborhood_is_char_field(self, fields):
        assert isinstance(fields['neighborhood'], django_models.CharField)

    def test_preferred_genres_is_array_field(self, fields):
        from django.contrib.postgres.fields import ArrayField
        assert isinstance(fields['preferred_genres'], ArrayField)

    def test_preferred_language_is_char_field(self, fields):
        assert isinstance(fields['preferred_language'], django_models.CharField)

    def test_preferred_radius_is_positive_integer_field(self, fields):
        assert isinstance(fields['preferred_radius'], django_models.PositiveIntegerField)

    def test_avg_rating_is_decimal_field(self, fields):
        assert isinstance(fields['avg_rating'], django_models.DecimalField)

    def test_swap_count_is_positive_integer_field(self, fields):
        assert isinstance(fields['swap_count'], django_models.PositiveIntegerField)

    def test_rating_count_is_positive_integer_field(self, fields):
        assert isinstance(fields['rating_count'], django_models.PositiveIntegerField)

    def test_coc_accepted_at_is_datetime_field(self, fields):
        assert isinstance(fields['coc_accepted_at'], django_models.DateTimeField)

    def test_coc_version_is_char_field(self, fields):
        assert isinstance(fields['coc_version'], django_models.CharField)

    def test_auth_provider_is_char_field(self, fields):
        assert isinstance(fields['auth_provider'], django_models.CharField)

    def test_onboarding_completed_is_boolean_field(self, fields):
        assert isinstance(fields['onboarding_completed'], django_models.BooleanField)


# ── Default values ───────────────────────────────────────────────────────────

class TestDefaults:
    def test_preferred_language_default(self):
        user = UserFactory()
        assert user.preferred_language == 'en'

    def test_preferred_radius_default(self):
        user = UserFactory()
        assert user.preferred_radius == 5000

    def test_avg_rating_default(self):
        user = UserFactory()
        assert user.avg_rating == Decimal('0')

    def test_swap_count_default(self):
        user = UserFactory()
        assert user.swap_count == 0

    def test_rating_count_default(self):
        user = UserFactory()
        assert user.rating_count == 0

    def test_onboarding_completed_default(self):
        user = UserFactory()
        assert user.onboarding_completed is False

    def test_preferred_genres_default_empty_list(self):
        user = UserFactory()
        assert user.preferred_genres == []

    def test_bio_default_blank(self):
        user = User()
        assert user.bio == ''

    def test_auth_provider_default_blank(self):
        user = User()
        assert user.auth_provider == ''

    def test_coc_version_default_blank(self):
        user = User()
        assert user.coc_version == ''


# ── Field constraints ────────────────────────────────────────────────────────

class TestConstraints:
    def test_bio_max_length(self):
        field = User._meta.get_field('bio')
        assert field.max_length == 300

    def test_neighborhood_max_length(self):
        field = User._meta.get_field('neighborhood')
        assert field.max_length == 100

    def test_preferred_language_max_length(self):
        field = User._meta.get_field('preferred_language')
        assert field.max_length == 20

    def test_coc_version_max_length(self):
        field = User._meta.get_field('coc_version')
        assert field.max_length == 10

    def test_auth_provider_max_length(self):
        field = User._meta.get_field('auth_provider')
        assert field.max_length == 20

    def test_preferred_genres_max_size(self):
        field = User._meta.get_field('preferred_genres')
        assert field.size == 5

    def test_avg_rating_decimal_places(self):
        field = User._meta.get_field('avg_rating')
        assert field.max_digits == 3
        assert field.decimal_places == 2

    def test_date_of_birth_nullable(self):
        field = User._meta.get_field('date_of_birth')
        assert field.null is True
        assert field.blank is True

    def test_location_nullable(self):
        field = User._meta.get_field('location')
        assert field.null is True
        assert field.blank is True

    def test_avatar_nullable(self):
        field = User._meta.get_field('avatar')
        assert field.null is True
        assert field.blank is True

    def test_coc_accepted_at_nullable(self):
        field = User._meta.get_field('coc_accepted_at')
        assert field.null is True
        assert field.blank is True

    def test_avatar_upload_to(self):
        field = User._meta.get_field('avatar')
        assert field.upload_to == 'avatars/'


# ── Spatial field ────────────────────────────────────────────────────────────

class TestSpatialField:
    def test_location_srid(self):
        field = User._meta.get_field('location')
        assert field.srid == 4326

    def test_location_stores_and_retrieves_point(self):
        point = Point(4.9041, 52.3676, srid=4326)
        user = UserFactory(location=point)
        user.refresh_from_db()
        assert user.location.x == pytest.approx(4.9041, abs=1e-4)
        assert user.location.y == pytest.approx(52.3676, abs=1e-4)
        assert user.location.srid == 4326


# ── Meta options ─────────────────────────────────────────────────────────────

class TestMeta:
    def test_db_table(self):
        assert User._meta.db_table == 'bookswap_user'

    def test_swappable(self):
        assert User._meta.swappable == 'AUTH_USER_MODEL'

    def test_onboarding_index_exists(self):
        index_fields = [
            idx.fields for idx in User._meta.indexes
        ]
        assert ['onboarding_completed'] in index_fields


# ── Model str ────────────────────────────────────────────────────────────────

class TestStr:
    def test_str_returns_email(self):
        user = UserFactory(email='alice@bookswap.test')
        assert str(user) == 'alice@bookswap.test'
