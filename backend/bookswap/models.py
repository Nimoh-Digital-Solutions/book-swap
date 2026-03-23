"""
Custom User model and domain models for bookswap.

Subclasses ``AbstractNimohUser`` and adds all BookSwap-specific fields
for profile, location, preferences, reputation, and onboarding state.

Also contains Book, BookPhoto, and WishlistItem models for Epic 3.
"""
import uuid

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.core.exceptions import ValidationError
from django.db import models
from nimoh_base.auth.models import AbstractNimohUser
from nimoh_base.core.models import TimeStampedModel


class User(AbstractNimohUser):
    """BookSwap user — extends nimoh-base with domain-specific fields.

    Inherits from ``AbstractNimohUser``: UUID pk, email-first auth,
    email_verified, failed_login_attempts, locked_until, is_social_account,
    social_provider, created_at, updated_at.

    ``AUTH_USER_MODEL = 'bookswap.User'`` in config/settings/base.py.
    """

    # ── Age gate (US-102) ─────────────────────────────────────────────
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Required at registration for 16+ age gate.",
    )

    # ── Profile (US-201, US-202) ──────────────────────────────────────
    bio = models.CharField(
        max_length=300,
        blank=True,
        help_text="Short bio shown on the public profile.",
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text="Profile photo. Validated for size and content in Phase 2.",
    )

    # ── Location (US-105) ─────────────────────────────────────────────
    location = gis_models.PointField(
        srid=4326,
        null=True,
        blank=True,
        help_text="Exact lat/lng stored on write; snapped to 500 m grid on read.",
    )
    neighborhood = models.CharField(
        max_length=100,
        blank=True,
        help_text="Derived from reverse geocoding (Nominatim).",
    )

    # ── Preferences ───────────────────────────────────────────────────
    preferred_genres = ArrayField(
        models.CharField(max_length=50),
        size=5,
        default=list,
        blank=True,
        help_text="Up to 5 genre tags for discovery matching.",
    )
    preferred_language = models.CharField(
        max_length=20,
        default='en',
        help_text="Preferred book language: en, nl, both.",
    )
    preferred_radius = models.PositiveIntegerField(
        default=5000,
        help_text="Search radius in metres for nearby books.",
    )

    # ── Reputation (US-701) ───────────────────────────────────────────
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        help_text="Computed average from swap partner ratings.",
    )
    swap_count = models.PositiveIntegerField(
        default=0,
        help_text="Total completed swaps.",
    )
    rating_count = models.PositiveIntegerField(
        default=0,
        help_text="Total ratings received.",
    )

    # ── Community Code of Conduct ─────────────────────────────────────
    coc_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the user accepted the Community Code of Conduct.",
    )
    coc_version = models.CharField(
        max_length=10,
        blank=True,
        help_text="Version of the CoC the user accepted.",
    )

    # ── Auth metadata ─────────────────────────────────────────────────
    auth_provider = models.CharField(
        max_length=20,
        blank=True,
        help_text="Simplified auth origin: 'email', 'google', or 'apple'.",
    )

    # ── Onboarding ────────────────────────────────────────────────────
    onboarding_completed = models.BooleanField(
        default=False,
        help_text="True after the user completes the location-setup onboarding.",
    )

    # ── GDPR account deletion (US-203) ────────────────────────────────
    deletion_requested_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set when user requests account deletion; cleared on cancellation. "
                  "Accounts are anonymized 30 days after this timestamp.",
    )

    class Meta(AbstractNimohUser.Meta):
        db_table = 'bookswap_user'
        swappable = 'AUTH_USER_MODEL'
        indexes = [  # noqa: RUF012
            *AbstractNimohUser.Meta.indexes,
            models.Index(fields=['onboarding_completed']),
            models.Index(fields=['location'], name='user_location_gist'),
        ]


# ══════════════════════════════════════════════════════════════════════════════
# Book Listing & Management (Epic 3)
# ══════════════════════════════════════════════════════════════════════════════


class BookCondition(models.TextChoices):
    NEW = 'new', 'New'
    LIKE_NEW = 'like_new', 'Like New'
    GOOD = 'good', 'Good'
    ACCEPTABLE = 'acceptable', 'Acceptable'


class BookStatus(models.TextChoices):
    AVAILABLE = 'available', 'Available'
    IN_EXCHANGE = 'in_exchange', 'In Exchange'
    RETURNED = 'returned', 'Returned'


BOOK_LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('nl', 'Dutch'),
    ('de', 'German'),
    ('fr', 'French'),
    ('es', 'Spanish'),
    ('other', 'Other'),
]


class Book(TimeStampedModel):
    """A book listed for exchange by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='books',
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

    # ── Full-text search ──────────────────────────────────────────────
    search_vector = SearchVectorField(null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [  # noqa: RUF012
            GinIndex(fields=['search_vector'], name='book_search_vector_gin'),
            models.Index(fields=['status', 'created_at'], name='book_status_created'),
            GinIndex(fields=['genres'], name='book_genres_gin'),
        ]

    def __str__(self):
        return f'{self.title} by {self.author}'


class BookPhoto(TimeStampedModel):
    """A photo attached to a book listing. Max 3 per book (enforced in serializer)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='photos',
    )
    image = models.ImageField(upload_to='book_photos/')
    position = models.PositiveSmallIntegerField(
        default=0,
        help_text='Display order. 0 = primary thumbnail.',
    )

    class Meta:
        ordering = ['position', 'created_at']

    def __str__(self):
        return f'Photo {self.position} for {self.book.title}'


class WishlistItem(TimeStampedModel):
    """A book a user is looking for. At least one of isbn/title/genre is required."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
    )
    isbn = models.CharField(max_length=13, blank=True)
    title = models.CharField(max_length=300, blank=True)
    author = models.CharField(max_length=200, blank=True)
    genre = models.CharField(max_length=50, blank=True)
    cover_url = models.URLField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        super().clean()
        if not any([self.isbn, self.title, self.genre]):
            raise ValidationError(
                'At least one of isbn, title, or genre must be provided.'
            )

    def __str__(self):
        return self.title or self.isbn or self.genre


# ══════════════════════════════════════════════════════════════════════════════
# Trust & Safety (Epic 8)
# ══════════════════════════════════════════════════════════════════════════════


class Block(TimeStampedModel):
    """A directional user block — blocker blocks blocked_user.

    Blocking is bidirectional in effect: neither party can see the other's
    profile, books, or exchanges, and no new messages/requests are allowed.
    However, the record is one-way; un-blocking only removes that direction.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blocks_given',
    )
    blocked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blocks_received',
    )

    class Meta:
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=['blocker', 'blocked_user'],
                name='unique_block',
            ),
        ]
        ordering = ['-created_at']

    def clean(self):
        super().clean()
        if self.blocker_id == self.blocked_user_id:
            raise ValidationError('You cannot block yourself.')

    def __str__(self):
        return f'{self.blocker} blocked {self.blocked_user}'


class ReportCategory(models.TextChoices):
    INAPPROPRIATE = 'inappropriate', 'Inappropriate Content'
    FAKE_LISTING = 'fake_listing', 'Fake Listing'
    NO_SHOW = 'no_show', 'No-Show'
    MISREPRESENTED = 'misrepresented', 'Misrepresented Book Condition'
    HARASSMENT = 'harassment', 'Harassment'
    SPAM = 'spam', 'Spam'
    OTHER = 'other', 'Other'


class ReportStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    REVIEWED = 'reviewed', 'Under Review'
    RESOLVED = 'resolved', 'Resolved'
    DISMISSED = 'dismissed', 'Dismissed'


class Report(TimeStampedModel):
    """A user-submitted report about another user, listing, or exchange."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_filed',
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_received',
    )
    reported_book = models.ForeignKey(
        Book,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports',
    )
    reported_exchange = models.ForeignKey(
        'exchanges.ExchangeRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports',
    )
    category = models.CharField(
        max_length=30,
        choices=ReportCategory.choices,
    )
    description = models.CharField(
        max_length=500,
        blank=True,
        help_text='Required when category is "other".',
    )
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.OPEN,
    )
    admin_notes = models.TextField(
        blank=True,
        help_text='Internal notes for admin review.',
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        super().clean()
        if self.reporter_id == self.reported_user_id:
            raise ValidationError('You cannot report yourself.')
        if self.category == ReportCategory.OTHER and not self.description.strip():
            raise ValidationError(
                {'description': 'Description is required when category is "other".'}
            )

    def __str__(self):
        return f'Report by {self.reporter} against {self.reported_user} ({self.category})'
