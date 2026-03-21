"""
Custom User model for bookswap.

Subclasses ``AbstractNimohUser`` and adds all BookSwap-specific fields
for profile, location, preferences, reputation, and onboarding state.
"""
from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.fields import ArrayField
from django.db import models
from nimoh_base.auth.models import AbstractNimohUser


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

    class Meta(AbstractNimohUser.Meta):
        db_table = 'bookswap_user'
        swappable = 'AUTH_USER_MODEL'
        indexes = [  # noqa: RUF012
            *AbstractNimohUser.Meta.indexes,
            models.Index(fields=['onboarding_completed']),
        ]
