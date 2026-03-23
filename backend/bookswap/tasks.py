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

        user.save(update_fields=[
            "username", "email", "first_name", "last_name",
            "bio", "date_of_birth", "location", "neighborhood",
            "preferred_genres", "avatar",
        ])
        count += 1

    if count:
        logger.info("Anonymized %d deleted accounts.", count)

    return count


@shared_task(name="bookswap.send_report_notification_email")
def send_report_notification_email(report_id: str):
    """Send an email notification to admin when a new report is filed.

    Uses Django's mail framework (SendGrid in production).
    """
    from django.conf import settings
    from django.core.mail import send_mail

    from .models import Report

    try:
        report = Report.objects.select_related(
            'reporter', 'reported_user',
        ).get(pk=report_id)
    except Report.DoesNotExist:
        logger.warning("Report %s not found for notification.", report_id)
        return

    subject = f"[BookSwap] New report: {report.get_category_display()}"
    body = (
        f"Reporter: {report.reporter.username}\n"
        f"Reported user: {report.reported_user.username}\n"
        f"Category: {report.get_category_display()}\n"
        f"Description: {report.description or '(none)'}\n"
        f"Created: {report.created_at}\n"
        f"Admin link: /admin/bookswap/report/{report.pk}/change/"
    )

    admin_email = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', None)
    if not admin_email:
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@bookswap.example')
        admin_email = default_from

    send_mail(
        subject=subject,
        message=body,
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[admin_email],
        fail_silently=True,
    )
    logger.info("Report notification sent for report %s.", report_id)
