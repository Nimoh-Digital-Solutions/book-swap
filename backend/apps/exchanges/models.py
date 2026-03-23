"""
Exchange models — ExchangeRequest and ConditionsAcceptance.

Tracks the full swap lifecycle from initial request through to completion
or return, including two-phase confirmations and state machine transitions.
"""
import uuid

from django.conf import settings
from django.db import models
from nimoh_base.core.models import TimeStampedModel


class ExchangeStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACCEPTED = 'accepted', 'Accepted'
    CONDITIONS_PENDING = 'conditions_pending', 'Conditions Pending'
    ACTIVE = 'active', 'Active'
    SWAP_CONFIRMED = 'swap_confirmed', 'Swap Confirmed'
    COMPLETED = 'completed', 'Completed'
    DECLINED = 'declined', 'Declined'
    CANCELLED = 'cancelled', 'Cancelled'
    EXPIRED = 'expired', 'Expired'
    RETURN_REQUESTED = 'return_requested', 'Return Requested'
    RETURNED = 'returned', 'Returned'


class DeclineReason(models.TextChoices):
    NOT_INTERESTED = 'not_interested', 'Not interested in offered book'
    RESERVED = 'reserved', 'Book is reserved for someone else'
    COUNTER_PROPOSED = 'counter_proposed', 'Counter-proposed a different book'
    OTHER = 'other', 'Other'


# Valid state transitions — used by the API to guard status changes.
VALID_TRANSITIONS: dict[str, list[str]] = {
    ExchangeStatus.PENDING: [
        ExchangeStatus.ACCEPTED,
        ExchangeStatus.DECLINED,
        ExchangeStatus.CANCELLED,
        ExchangeStatus.EXPIRED,
    ],
    ExchangeStatus.ACCEPTED: [
        ExchangeStatus.CONDITIONS_PENDING,
        ExchangeStatus.CANCELLED,
        ExchangeStatus.EXPIRED,
    ],
    ExchangeStatus.CONDITIONS_PENDING: [
        ExchangeStatus.ACTIVE,
        ExchangeStatus.CANCELLED,
        ExchangeStatus.EXPIRED,
    ],
    ExchangeStatus.ACTIVE: [
        ExchangeStatus.SWAP_CONFIRMED,
        ExchangeStatus.CANCELLED,
    ],
    ExchangeStatus.SWAP_CONFIRMED: [
        ExchangeStatus.COMPLETED,
        ExchangeStatus.RETURN_REQUESTED,
    ],
    ExchangeStatus.RETURN_REQUESTED: [
        ExchangeStatus.RETURNED,
    ],
    # Terminal states — no transitions out.
    ExchangeStatus.DECLINED: [],
    ExchangeStatus.CANCELLED: [],
    ExchangeStatus.EXPIRED: [],
    ExchangeStatus.COMPLETED: [],
    ExchangeStatus.RETURNED: [],
}


class ExchangeRequest(TimeStampedModel):
    """A swap request between two users, tracking the full exchange lifecycle."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_exchanges',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_exchanges',
    )
    requested_book = models.ForeignKey(
        'bookswap.Book',
        on_delete=models.CASCADE,
        related_name='incoming_requests',
        help_text="The owner's book the requester wants.",
    )
    offered_book = models.ForeignKey(
        'bookswap.Book',
        on_delete=models.CASCADE,
        related_name='outgoing_requests',
        help_text="The requester's book offered in exchange.",
    )

    status = models.CharField(
        max_length=30,
        choices=ExchangeStatus.choices,
        default=ExchangeStatus.PENDING,
        db_index=True,
    )
    message = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional personal note from the requester.',
    )
    decline_reason = models.CharField(
        max_length=30,
        choices=DeclineReason.choices,
        blank=True,
    )
    counter_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='counter_requests',
        help_text='References the original request when counter-proposed.',
    )

    # Two-phase swap confirmation (US-504)
    requester_confirmed_at = models.DateTimeField(null=True, blank=True)
    owner_confirmed_at = models.DateTimeField(null=True, blank=True)

    # Return flow (US-505, P1)
    return_requested_at = models.DateTimeField(null=True, blank=True)
    return_confirmed_requester = models.DateTimeField(null=True, blank=True)
    return_confirmed_owner = models.DateTimeField(null=True, blank=True)

    # Auto-expiry tracking
    expired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=['requester', 'requested_book'],
                condition=models.Q(status='pending'),
                name='unique_pending_request_per_book',
            ),
        ]
        indexes = [  # noqa: RUF012
            models.Index(
                fields=['status', 'created_at'],
                name='exchange_status_created',
            ),
            models.Index(
                fields=['requester', 'status'],
                name='exchange_requester_status',
            ),
            models.Index(
                fields=['owner', 'status'],
                name='exchange_owner_status',
            ),
        ]

    def __str__(self):
        return (
            f'Exchange {self.id!s:.8} — '
            f'{self.requester} → {self.owner} '
            f'({self.get_status_display()})'
        )

    # ── Helpers ────────────────────────────────────────────────────────

    @property
    def is_swap_confirmed(self) -> bool:
        return (
            self.requester_confirmed_at is not None
            and self.owner_confirmed_at is not None
        )

    @property
    def is_return_confirmed(self) -> bool:
        return (
            self.return_confirmed_requester is not None
            and self.return_confirmed_owner is not None
        )

    def both_conditions_accepted(self) -> bool:
        return self.conditions_acceptances.count() == 2

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status: str) -> None:
        """Transition to *new_status*, raising ValueError on invalid transition."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f'Cannot transition from {self.status!r} to {new_status!r}.'
            )
        self.status = new_status


class ConditionsAcceptance(TimeStampedModel):
    """Records a user's acceptance of the exchange conditions for a specific exchange."""

    CURRENT_VERSION = '1.0'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exchange = models.ForeignKey(
        ExchangeRequest,
        on_delete=models.CASCADE,
        related_name='conditions_acceptances',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conditions_acceptances',
    )
    accepted_at = models.DateTimeField(auto_now_add=True)
    conditions_version = models.CharField(
        max_length=10,
        default=CURRENT_VERSION,
        help_text='Version of the conditions the user accepted.',
    )

    class Meta:
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=['exchange', 'user'],
                name='unique_conditions_per_user_per_exchange',
            ),
        ]

    def __str__(self):
        return f'{self.user} accepted conditions v{self.conditions_version} for {self.exchange_id!s:.8}'
