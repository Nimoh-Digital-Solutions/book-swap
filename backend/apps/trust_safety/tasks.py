"""Celery tasks for the trust_safety app."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="trust_safety.send_report_notification_email")
def send_report_notification_email(report_id: str):
    """Send an email notification to admin when a new report is filed."""
    from django.conf import settings
    from django.core.mail import send_mail

    from .models import Report

    try:
        report = Report.objects.select_related(
            "reporter",
            "reported_user",
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
        f"Admin link: /admin/trust_safety/report/{report.pk}/change/"
    )

    admin_email = getattr(settings, "ADMIN_NOTIFICATION_EMAIL", None)
    if not admin_email:
        default_from = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bookswap.example")
        admin_email = default_from

    send_mail(
        subject=subject,
        message=body,
        from_email=None,
        recipient_list=[admin_email],
        fail_silently=True,
    )
    logger.info("Report notification sent for report %s.", report_id)
