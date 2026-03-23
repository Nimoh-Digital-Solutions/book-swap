"""
Signals for the ratings app.

Recalculates user aggregate stats (avg_rating, rating_count) when a rating
is created. Dispatches the Celery task asynchronously.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Rating

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Rating)
def on_rating_created(sender, instance, created, **kwargs):
    """Trigger aggregate recalculation when a new rating is saved."""
    if not created:
        return

    from .tasks import update_user_rating_stats

    update_user_rating_stats.delay(str(instance.rated_id))
    logger.info(
        'Rating %s created: %s → %s (%d★). Stats update dispatched.',
        instance.pk, instance.rater_id, instance.rated_id, instance.score,
    )
