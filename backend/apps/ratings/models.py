"""
Rating model — post-exchange partner ratings (US-701).

Allows exchange participants to rate their swap partner with a 1-5 star score
and an optional 300-character text review within 30 days of exchange completion.
"""

import uuid
from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from nimoh_base.core.models import TimeStampedModel

RATING_WINDOW_DAYS = 30

RATABLE_STATUSES = frozenset({"completed", "returned"})


class Rating(TimeStampedModel):
    """A swap-partner rating submitted after exchange completion."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    exchange = models.ForeignKey(
        "exchanges.ExchangeRequest",
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_given",
    )
    rated = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_received",
    )
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Star rating from 1 (poor) to 5 (excellent).",
    )
    comment = models.CharField(
        max_length=300,
        blank=True,
        help_text="Optional text review (max 300 characters).",
    )
    is_flagged = models.BooleanField(
        default=False,
        help_text="Set by profanity filter; hidden from public until admin review.",
    )

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=["exchange", "rater"],
                name="unique_rating_per_exchange_per_rater",
            ),
        ]
        indexes = [  # noqa: RUF012
            models.Index(fields=["rated", "created_at"], name="rating_rated_created"),
            models.Index(fields=["exchange"], name="rating_exchange"),
        ]

    def __str__(self):
        return f"{self.rater} → {self.rated}: {self.score}★"

    def clean(self):
        super().clean()
        errors = {}
        exchange = self.exchange

        # Rater must be a participant
        if self.rater_id not in (exchange.requester_id, exchange.owner_id):
            errors["rater"] = "Rater must be a participant of this exchange."

        # Rated must be the other participant
        expected_rated = exchange.owner_id if self.rater_id == exchange.requester_id else exchange.requester_id
        if self.rated_id != expected_rated:
            errors["rated"] = "Rated user must be the other exchange participant."

        # Exchange must be in a ratable status
        if exchange.status not in RATABLE_STATUSES:
            errors["exchange"] = (
                f"Ratings are only allowed for exchanges with status: {', '.join(sorted(RATABLE_STATUSES))}."
            )

        # 30-day window check
        if exchange.status in RATABLE_STATUSES:
            deadline = exchange.updated_at + timedelta(days=RATING_WINDOW_DAYS)
            if timezone.now() > deadline:
                errors["exchange"] = "The 30-day rating window has expired."

        if errors:
            raise ValidationError(errors)
