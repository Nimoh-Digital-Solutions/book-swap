import factory
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile

from bookswap.models import Book, BookCondition, BookPhoto, BookStatus, User, WishlistItem


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for BookSwap User model."""

    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@bookswap.test")
    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')

    # Domain fields with sensible defaults
    date_of_birth = factory.Faker('date_of_birth', minimum_age=16, maximum_age=80)
    bio = factory.Faker('sentence', nb_words=10)
    preferred_language = 'en'
    preferred_radius = 5000
    onboarding_completed = False

    class Params:
        with_location = factory.Trait(
            location=factory.LazyFunction(lambda: Point(4.9041, 52.3676, srid=4326)),
            neighborhood='Amsterdam Centrum',
        )
        onboarded = factory.Trait(
            onboarding_completed=True,
            bio=factory.Faker('sentence', nb_words=10),
            preferred_genres=['fiction', 'mystery'],
        )


def _tiny_jpeg():
    """Return the smallest valid JPEG file (2x2 red square)."""
    import io
    from PIL import Image
    buf = io.BytesIO()
    Image.new('RGB', (2, 2), color='red').save(buf, format='JPEG')
    buf.seek(0)
    return buf.read()


class BookFactory(factory.django.DjangoModelFactory):
    """Factory for Book model."""

    class Meta:
        model = Book

    owner = factory.SubFactory(UserFactory)
    isbn = factory.Sequence(lambda n: f'978000000{n:04d}')
    title = factory.Faker('sentence', nb_words=4)
    author = factory.Faker('name')
    description = factory.Faker('paragraph')
    condition = BookCondition.GOOD
    genres = factory.LazyFunction(lambda: ['fiction'])
    language = 'en'
    status = BookStatus.AVAILABLE
    notes = ''

    class Params:
        in_exchange = factory.Trait(status=BookStatus.IN_EXCHANGE)
        returned = factory.Trait(status=BookStatus.RETURNED)


class BookPhotoFactory(factory.django.DjangoModelFactory):
    """Factory for BookPhoto model."""

    class Meta:
        model = BookPhoto

    book = factory.SubFactory(BookFactory)
    image = factory.LazyFunction(
        lambda: SimpleUploadedFile('test.jpg', _tiny_jpeg(), content_type='image/jpeg')
    )
    position = factory.Sequence(lambda n: n)


class WishlistItemFactory(factory.django.DjangoModelFactory):
    """Factory for WishlistItem model."""

    class Meta:
        model = WishlistItem

    user = factory.SubFactory(UserFactory)
    title = factory.Faker('sentence', nb_words=3)
    author = factory.Faker('name')
