"""Celery tasks for the bookswap app."""

import hashlib
import json
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


# ── GDPR data export ─────────────────────────────────────────────────────────
# AUD-B-704: build the export off the request thread and email it as an
# attachment. The HTTP endpoint just enqueues this task and returns 202; the
# user gets the file as soon as the worker picks it up.


@shared_task(
    name="bookswap.send_data_export_email",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_data_export_email(self, user_id: str) -> str:
    """Build the GDPR JSON export for *user_id* and email it as an attachment.

    Returns the user PK on success so Celery's result backend can record it.
    Re-raises after the configured retries — the operator can inspect failed
    tasks in the result backend / Sentry.
    """
    from django.conf import settings
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string

    from bookswap.services import build_data_export

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.warning("send_data_export_email: user %s not found.", user_id)
        return ""

    try:
        export = build_data_export(user)
    except Exception as exc:
        logger.exception("Data export build failed for user %s.", user.pk)
        raise self.retry(exc=exc) from exc

    payload = json.dumps(export, indent=2, default=str).encode("utf-8")
    filename = f"bookswap-data-export-{timezone.now():%Y%m%d-%H%M}.json"

    fe_url = getattr(settings, "FRONTEND_URL", "https://bookswap.app").rstrip("/")
    subject = "Your BookSwap data export is ready"
    body_text = (
        f"Hi {user.username},\n\n"
        "Your BookSwap data export is attached as a JSON file. It contains "
        "your profile, books, exchanges, messages, ratings, blocks and reports.\n\n"
        "If you didn't request this, please change your password and contact "
        "us immediately.\n\n"
        "The BookSwap Team"
    )
    body_html_inner = (
        "Your BookSwap data export is attached as a JSON file. It contains "
        "your profile, books, exchanges, messages, ratings, blocks and reports."
        "<br><br>"
        '<span style="color:#c0392b;">If you didn\'t request this, please '
        "change your password and contact us immediately.</span>"
    )

    try:
        html_body = render_to_string(
            "emails/notifications/notification.html",
            {
                "subject": subject,
                "recipient_name": user.get_full_name() or user.username,
                "body_text": body_text,
                "body_html": body_html_inner,
                "cta_url": fe_url,
                "cta_text": "Open BookSwap",
                "frontend_url": fe_url,
            },
        )
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.attach(filename, payload, "application/json")
        msg.send(fail_silently=False)
        # AUD-B-603: log user PK rather than raw email.
        logger.info("Data export email sent to user %s (%s bytes).", user.pk, len(payload))
    except Exception as exc:
        logger.exception("Data export email send failed for user %s.", user.pk)
        raise self.retry(exc=exc) from exc

    return str(user.pk)
