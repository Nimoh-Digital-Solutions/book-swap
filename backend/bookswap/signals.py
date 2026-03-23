"""Signals for the bookswap app."""
from django.contrib.postgres.search import SearchVector
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Book, Report


@receiver(post_save, sender=Book)
def update_book_search_vector(sender, instance, **kwargs):
    """Update full-text search vector after every Book save."""
    Book.objects.filter(pk=instance.pk).update(
        search_vector=SearchVector('title', weight='A')
        + SearchVector('author', weight='B'),
    )


@receiver(post_save, sender=Report)
def notify_admin_on_report(sender, instance, created, **kwargs):
    """Fire a Celery task to email admin when a new report is created."""
    if created:
        from .tasks import send_report_notification_email
        send_report_notification_email.delay(str(instance.pk))
