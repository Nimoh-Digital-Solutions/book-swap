"""
Notifications models — in-app notifications and email preferences (US-901/902).

Notification:
  Stores every in-app bell notification for a user.  The ``link`` field
  contains the relative front-end URL the user should be taken to when
  they click the notification.

NotificationPreferences:
  Per-user opt-in/out toggles for transactional email categories, plus a
  stable (non-expiring) ``unsubscribe_token`` used for one-click unsubscribe
  links that work without authentication.
"""

import secrets
import uuid

from django.conf import settings
from django.db import models
from nimoh_base.core.models import TimeStampedModel


class NotificationType(models.TextChoices):
    NEW_REQUEST = "new_request", "New Partner Request"
    REQUEST_ACCEPTED = "request_accepted", "Request Accepted"
    REQUEST_DECLINED = "request_declined", "Request Declined"
    REQUEST_EXPIRED = "request_expired", "Request Expired"
    REQUEST_CANCELLED = "request_cancelled", "Request Cancelled"
    COUNTER_PROPOSED = "counter_proposed", "Counter Proposed"
    COUNTER_APPROVED = "counter_approved", "Counter Approved"
    SWAP_CONFIRMED = "swap_confirmed", "Swap Confirmed"
    EXCHANGE_COMPLETED = "exchange_completed", "Exchange Completed"
    RETURN_REQUESTED = "return_requested", "Return Requested"
    EXCHANGE_RETURNED = "exchange_returned", "Exchange Returned"
    NEW_MESSAGE = "new_message", "New Message"
    RATING_RECEIVED = "rating_received", "Rating Received"


class Notification(TimeStampedModel):
    """A single in-app notification entry for a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(
        max_length=32,
        choices=NotificationType.choices,
        db_index=True,
    )
    title = models.CharField(max_length=150)
    body = models.CharField(max_length=512)
    link = models.CharField(max_length=512, blank=True, default="")
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        indexes = [  # noqa: RUF012
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.notification_type} → {self.user_id} ({self.pk})"

    @property
    def is_read(self) -> bool:
        return self.read_at is not None


def _default_unsubscribe_token() -> str:
    return secrets.token_urlsafe(32)


class NotificationPreferences(models.Model):
    """Per-user email notification opt-in settings and unsubscribe token."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        primary_key=True,
    )

    # ── Email preferences ────────────────────────────────────────────────────
    email_new_request = models.BooleanField(default=True)
    email_request_accepted = models.BooleanField(default=True)
    email_request_declined = models.BooleanField(default=True)
    email_new_message = models.BooleanField(default=True)
    email_exchange_completed = models.BooleanField(default=True)
    email_rating_received = models.BooleanField(default=True)

    # ── Unsubscribe ──────────────────────────────────────────────────────────
    # Stable token used in email footers — never changes unless manually
    # regenerated so old emails stay valid.
    unsubscribe_token = models.CharField(
        max_length=64,
        unique=True,
        default=_default_unsubscribe_token,
        editable=False,
    )

    class Meta:
        verbose_name = "Notification Preferences"
        verbose_name_plural = "Notification Preferences"

    def __str__(self) -> str:
        return f"NotificationPreferences({self.user_id})"


class MobileDevice(models.Model):
    """Registered mobile device for push notifications via Expo."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mobile_devices",
    )
    push_token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(
        max_length=10,
        choices=[("ios", "iOS"), ("android", "Android")],
    )
    device_name = models.CharField(max_length=150, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        indexes = [  # noqa: RUF012
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.platform} — {self.user_id} ({self.push_token[:20]}…)"
