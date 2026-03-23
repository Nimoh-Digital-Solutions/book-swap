import factory
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.books.models import Book, BookCondition, BookPhoto, BookStatus, WishlistItem
from bookswap.tests.factories import UserFactory


def _tiny_jpeg():
    """Return the smallest valid JPEG file (2x2 red square)."""
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (2, 2), color="red").save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


class BookFactory(factory.django.DjangoModelFactory):
    """Factory for Book model."""

    class Meta:
        model = Book

    owner = factory.SubFactory(UserFactory)
    isbn = factory.Sequence(lambda n: f"978000000{n:04d}")
    title = factory.Faker("sentence", nb_words=4)
    author = factory.Faker("name")
    description = factory.Faker("paragraph")
    condition = BookCondition.GOOD
    genres = factory.LazyFunction(lambda: ["fiction"])
    language = "en"
    status = BookStatus.AVAILABLE
    notes = ""

    class Params:
        in_exchange = factory.Trait(status=BookStatus.IN_EXCHANGE)
        returned = factory.Trait(status=BookStatus.RETURNED)


class BookPhotoFactory(factory.django.DjangoModelFactory):
    """Factory for BookPhoto model."""

    class Meta:
        model = BookPhoto

    book = factory.SubFactory(BookFactory)
    image = factory.LazyFunction(lambda: SimpleUploadedFile("test.jpg", _tiny_jpeg(), content_type="image/jpeg"))
    position = factory.Sequence(lambda n: n)


class WishlistItemFactory(factory.django.DjangoModelFactory):
    """Factory for WishlistItem model."""

    class Meta:
        model = WishlistItem

    user = factory.SubFactory(UserFactory)
    title = factory.Faker("sentence", nb_words=3)
    author = factory.Faker("name")
