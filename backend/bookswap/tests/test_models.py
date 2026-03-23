"""Tests for the BookSwap User model (Phase 1 — Data Layer)."""
import uuid
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField
from django.core.exceptions import ValidationError
from django.db import models as django_models

from apps.books.models import (
    Book,
    BookCondition,
    BookPhoto,
    BookStatus,
    WishlistItem,
)
from apps.books.tests.factories import (
    BookFactory,
    BookPhotoFactory,
    WishlistItemFactory,
)
from bookswap.models import (
    User,
)
from bookswap.tests.factories import (
    UserFactory,
)

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


# ══════════════════════════════════════════════════════════════════════════════
# Book Model Tests (Epic 3 — Phase 1)
# ══════════════════════════════════════════════════════════════════════════════


class TestBookFactory:
    def test_create_book_via_factory(self):
        book = BookFactory()
        assert book.pk is not None
        assert isinstance(book.pk, uuid.UUID)

    def test_book_has_owner(self):
        book = BookFactory()
        assert book.owner is not None
        assert isinstance(book.owner, User)

    def test_book_default_status_available(self):
        book = BookFactory()
        assert book.status == BookStatus.AVAILABLE

    def test_in_exchange_trait(self):
        book = BookFactory(in_exchange=True)
        assert book.status == BookStatus.IN_EXCHANGE

    def test_returned_trait(self):
        book = BookFactory(returned=True)
        assert book.status == BookStatus.RETURNED


class TestBookFields:
    @pytest.fixture()
    def fields(self):
        return {f.name: f for f in Book._meta.get_fields()}

    def test_isbn_field(self, fields):
        assert isinstance(fields['isbn'], django_models.CharField)
        assert fields['isbn'].max_length == 13
        assert fields['isbn'].db_index is True

    def test_title_field(self, fields):
        assert isinstance(fields['title'], django_models.CharField)
        assert fields['title'].max_length == 300

    def test_author_field(self, fields):
        assert isinstance(fields['author'], django_models.CharField)
        assert fields['author'].max_length == 200

    def test_description_field(self, fields):
        assert isinstance(fields['description'], django_models.TextField)
        assert fields['description'].blank is True

    def test_cover_url_field(self, fields):
        assert isinstance(fields['cover_url'], django_models.URLField)
        assert fields['cover_url'].blank is True

    def test_condition_choices(self, fields):
        assert isinstance(fields['condition'], django_models.CharField)
        assert len(BookCondition.choices) == 4

    def test_genres_is_array_field(self, fields):
        assert isinstance(fields['genres'], ArrayField)
        assert fields['genres'].size == 3

    def test_language_field(self, fields):
        assert isinstance(fields['language'], django_models.CharField)
        assert fields['language'].max_length == 10

    def test_status_field(self, fields):
        assert isinstance(fields['status'], django_models.CharField)
        assert fields['status'].db_index is True

    def test_notes_field(self, fields):
        assert isinstance(fields['notes'], django_models.CharField)
        assert fields['notes'].max_length == 200

    def test_page_count_field(self, fields):
        assert isinstance(fields['page_count'], django_models.PositiveIntegerField)
        assert fields['page_count'].null is True

    def test_publish_year_field(self, fields):
        assert isinstance(fields['publish_year'], django_models.PositiveIntegerField)
        assert fields['publish_year'].null is True

    def test_search_vector_field(self, fields):
        assert isinstance(fields['search_vector'], SearchVectorField)
        assert fields['search_vector'].null is True

    def test_created_at_field(self, fields):
        assert isinstance(fields['created_at'], django_models.DateTimeField)

    def test_updated_at_field(self, fields):
        assert isinstance(fields['updated_at'], django_models.DateTimeField)


class TestBookIndexes:
    def test_search_vector_gin_index(self):
        index_names = [idx.name for idx in Book._meta.indexes]
        assert 'book_search_vector_gin' in index_names

    def test_status_created_composite_index(self):
        index_names = [idx.name for idx in Book._meta.indexes]
        assert 'book_status_created' in index_names

    def test_genres_gin_index(self):
        index_names = [idx.name for idx in Book._meta.indexes]
        assert 'book_genres_gin' in index_names


class TestBookBehavior:
    def test_str_representation(self):
        book = BookFactory(title='The Hobbit', author='J.R.R. Tolkien')
        assert str(book) == 'The Hobbit by J.R.R. Tolkien'

    def test_ordering_newest_first(self):
        assert Book._meta.ordering == ['-created_at']

    def test_owner_cascade_delete(self):
        book = BookFactory()
        owner_pk = book.owner.pk
        User.objects.filter(pk=owner_pk).delete()
        assert not Book.objects.filter(pk=book.pk).exists()

    def test_search_vector_populated_on_save(self):
        book = BookFactory(title='Django Unleashed', author='Andrew Pinkham')
        book.refresh_from_db()
        assert book.search_vector is not None

    def test_condition_choices_all_present(self):
        values = [c[0] for c in BookCondition.choices]
        assert values == ['new', 'like_new', 'good', 'acceptable']

    def test_status_choices_all_present(self):
        values = [c[0] for c in BookStatus.choices]
        assert values == ['available', 'in_exchange', 'returned']


# ══════════════════════════════════════════════════════════════════════════════
# BookPhoto Model Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestBookPhotoFactory:
    def test_create_photo_via_factory(self):
        photo = BookPhotoFactory()
        assert photo.pk is not None
        assert isinstance(photo.pk, uuid.UUID)

    def test_photo_linked_to_book(self):
        photo = BookPhotoFactory()
        assert photo.book is not None


class TestBookPhotoFields:
    def test_image_upload_to(self):
        field = BookPhoto._meta.get_field('image')
        assert field.upload_to == 'book_photos/'

    def test_position_default_zero(self):
        photo = BookPhotoFactory(position=0)
        assert photo.position == 0

    def test_ordering_by_position(self):
        assert BookPhoto._meta.ordering == ['position', 'created_at']


class TestBookPhotoBehavior:
    def test_str_representation(self):
        book = BookFactory(title='Test Book')
        photo = BookPhotoFactory(book=book, position=1)
        assert str(photo) == 'Photo 1 for Test Book'

    def test_cascade_delete_on_book(self):
        photo = BookPhotoFactory()
        book_pk = photo.book.pk
        Book.objects.filter(pk=book_pk).delete()
        assert not BookPhoto.objects.filter(pk=photo.pk).exists()

    def test_multiple_photos_per_book(self):
        book = BookFactory()
        BookPhotoFactory(book=book, position=0)
        BookPhotoFactory(book=book, position=1)
        BookPhotoFactory(book=book, position=2)
        assert book.photos.count() == 3


# ══════════════════════════════════════════════════════════════════════════════
# WishlistItem Model Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestWishlistItemFactory:
    def test_create_wishlist_item_via_factory(self):
        item = WishlistItemFactory()
        assert item.pk is not None
        assert isinstance(item.pk, uuid.UUID)


class TestWishlistItemFields:
    @pytest.fixture()
    def fields(self):
        return {f.name: f for f in WishlistItem._meta.get_fields()}

    def test_isbn_field(self, fields):
        assert isinstance(fields['isbn'], django_models.CharField)
        assert fields['isbn'].max_length == 13
        assert fields['isbn'].blank is True

    def test_title_field(self, fields):
        assert isinstance(fields['title'], django_models.CharField)
        assert fields['title'].max_length == 300
        assert fields['title'].blank is True

    def test_author_field(self, fields):
        assert isinstance(fields['author'], django_models.CharField)
        assert fields['author'].blank is True

    def test_genre_field(self, fields):
        assert isinstance(fields['genre'], django_models.CharField)
        assert fields['genre'].max_length == 50
        assert fields['genre'].blank is True

    def test_cover_url_field(self, fields):
        assert isinstance(fields['cover_url'], django_models.URLField)
        assert fields['cover_url'].blank is True


class TestWishlistItemBehavior:
    def test_str_with_title(self):
        item = WishlistItemFactory(title='Dune')
        assert str(item) == 'Dune'

    def test_str_with_isbn_only(self):
        item = WishlistItemFactory(title='', isbn='9780441013593')
        assert str(item) == '9780441013593'

    def test_str_with_genre_only(self):
        item = WishlistItemFactory(title='', author='', isbn='', genre='sci-fi')
        assert str(item) == 'sci-fi'

    def test_ordering_newest_first(self):
        assert WishlistItem._meta.ordering == ['-created_at']

    def test_clean_raises_when_all_empty(self):
        item = WishlistItemFactory.build(title='', isbn='', genre='', author='')
        with pytest.raises(ValidationError, match='At least one of'):
            item.clean()

    def test_clean_passes_with_title(self):
        item = WishlistItemFactory.build(title='Dune', isbn='', genre='')
        item.clean()  # Should not raise

    def test_clean_passes_with_genre(self):
        item = WishlistItemFactory.build(title='', isbn='', genre='fiction')
        item.clean()  # Should not raise

    def test_cascade_delete_on_user(self):
        item = WishlistItemFactory()
        user_pk = item.user.pk
        User.objects.filter(pk=user_pk).delete()
        assert not WishlistItem.objects.filter(pk=item.pk).exists()
