"""Celery tasks for the bookswap app."""

import hashlib
import logging
from datetime import timedelta

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="bookswap.anonymize_deleted_accounts")
def anonymize_deleted_accounts():
    """Anonymize accounts where deletion was requested 30+ days ago.

    Runs daily via Celery Beat. Irreversible — clears all personal data
    while preserving exchange history rows with anonymized references.
    """
    User = get_user_model()
    cutoff = timezone.now() - timedelta(days=30)

    users_to_anonymize = User.objects.filter(
        deletion_requested_at__lte=cutoff,
        is_active=False,
    ).exclude(username__startswith="deleted_")

    count = 0
    for user in users_to_anonymize.iterator():
        email_hash = hashlib.sha256(user.email.encode()).hexdigest()[:8]

        user.username = f"deleted_{email_hash}"
        user.email = f"{email_hash}@deleted.bookswap.local"
        user.first_name = "Deleted"
        user.last_name = "User"
        user.bio = ""
        user.date_of_birth = None
        user.location = None
        user.neighborhood = ""
        user.preferred_genres = []
        user.avatar = None

        user.save(
            update_fields=[
                "username",
                "email",
                "first_name",
                "last_name",
                "bio",
                "date_of_birth",
                "location",
                "neighborhood",
                "preferred_genres",
                "avatar",
            ]
        )
        count += 1

    if count:
        logger.info("Anonymized %d deleted accounts.", count)

    return count


# send_report_notification_email has been moved to apps/trust_safety/tasks.py
