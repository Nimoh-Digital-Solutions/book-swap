"""Book domain models — Book, BookPhoto, WishlistItem."""

import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.core.exceptions import ValidationError
from django.db import models
from nimoh_base.core.models import TimeStampedModel


class BookCondition(models.TextChoices):
    NEW = "new", "New"
    LIKE_NEW = "like_new", "Like New"
    GOOD = "good", "Good"
    ACCEPTABLE = "acceptable", "Acceptable"


class BookStatus(models.TextChoices):
    AVAILABLE = "available", "Available"
    IN_EXCHANGE = "in_exchange", "In Exchange"
    RETURNED = "returned", "Returned"


class SwapType(models.TextChoices):
    TEMPORARY = "temporary", "Temporary (with return)"
    PERMANENT = "permanent", "Permanent (no return)"


BOOK_LANGUAGE_CHOICES = [
    ("en", "English"),
    ("nl", "Dutch"),
    ("de", "German"),
    ("fr", "French"),
    ("es", "Spanish"),
    ("other", "Other"),
]


class Book(TimeStampedModel):
    """A book listed for exchange by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="books",
    )

    # ── Book metadata ─────────────────────────────────────────────────
    isbn = models.CharField(max_length=13, blank=True, db_index=True)
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover_url = models.URLField(blank=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    publish_year = models.PositiveIntegerField(null=True, blank=True)

    # ── Listing details ───────────────────────────────────────────────
    condition = models.CharField(max_length=20, choices=BookCondition.choices)
    genres = ArrayField(
        models.CharField(max_length=50),
        size=3,
        default=list,
        blank=True,
    )
    language = models.CharField(max_length=10, choices=BOOK_LANGUAGE_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=BookStatus.choices,
        default=BookStatus.AVAILABLE,
        db_index=True,
    )
    notes = models.CharField(max_length=200, blank=True)
    swap_type = models.CharField(
        max_length=10,
        choices=SwapType.choices,
        default=SwapType.TEMPORARY,
        help_text="Whether the book must be returned after a swap or is given away permanently.",
    )

    # ── Seed / demo data ─────────────────────────────────────────────
    is_seed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Seed/demo book — always shown in browse regardless of the requesting user's location.",
    )

    # ── Full-text search ──────────────────────────────────────────────
    search_vector = SearchVectorField(null=True)

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        indexes = [  # noqa: RUF012
            GinIndex(fields=["search_vector"], name="book_search_vector_gin"),
            models.Index(fields=["status", "created_at"], name="book_status_created"),
            GinIndex(fields=["genres"], name="book_genres_gin"),
        ]

    def __str__(self):
        return f"{self.title} by {self.author}"


class BookPhoto(TimeStampedModel):
    """A photo attached to a book listing. Max 3 per book (enforced in serializer)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    image = models.ImageField(upload_to="book_photos/")
    position = models.PositiveSmallIntegerField(
        default=0,
        help_text="Display order. 0 = primary thumbnail.",
    )

    class Meta:
        ordering = ["position", "created_at"]  # noqa: RUF012

    def __str__(self):
        return f"Photo {self.position} for {self.book.title}"


class WishlistItem(TimeStampedModel):
    """A book a user is looking for.

    When created from a book detail page, ``book`` links directly to the listing.
    Manual wishlist entries (no specific listing) leave ``book`` NULL and must
    supply at least one of isbn/title/genre.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="wishlist_entries",
    )
    isbn = models.CharField(max_length=13, blank=True)
    title = models.CharField(max_length=300, blank=True)
    author = models.CharField(max_length=200, blank=True)
    genre = models.CharField(max_length=50, blank=True)
    cover_url = models.URLField(blank=True)

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=["user", "book"],
                condition=models.Q(book__isnull=False),
                name="unique_user_book_wishlist",
            ),
        ]

    def clean(self):
        super().clean()
        if not self.book and not any([self.isbn, self.title, self.genre]):
            raise ValidationError("At least one of isbn, title, or genre must be provided.")

    def __str__(self):
        return self.title or self.isbn or self.genre
