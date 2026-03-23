"""Signals for the trust_safety app."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Report


@receiver(post_save, sender=Report)
def notify_admin_on_report(sender, instance, created, **kwargs):
    """Fire a Celery task to email admin when a new report is created."""
    if created:
        from .tasks import send_report_notification_email

        send_report_notification_email.delay(str(instance.pk))
