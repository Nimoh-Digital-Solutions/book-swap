"""Signals for the bookswap app."""
from django.contrib.postgres.search import SearchVector
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Book


@receiver(post_save, sender=Book)
def update_book_search_vector(sender, instance, **kwargs):
    """Update full-text search vector after every Book save."""
    Book.objects.filter(pk=instance.pk).update(
        search_vector=SearchVector('title', weight='A')
        + SearchVector('author', weight='B'),
    )
