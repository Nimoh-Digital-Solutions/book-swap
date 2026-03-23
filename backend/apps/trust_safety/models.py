"""Trust & Safety models — Block and Report."""
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from nimoh_base.core.models import TimeStampedModel


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
        ordering = ['-created_at']  # noqa: RUF012

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
        'books.Book',
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
        ordering = ['-created_at']  # noqa: RUF012

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
