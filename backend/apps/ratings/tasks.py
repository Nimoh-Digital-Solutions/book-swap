"""Celery tasks for the ratings app."""

import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count

logger = logging.getLogger(__name__)

User = get_user_model()


@shared_task(ignore_result=True, max_retries=3, default_retry_delay=10)
def update_user_rating_stats(rated_user_id: str) -> None:
    """Recalculate avg_rating and rating_count for a user."""
    from .models import Rating

    try:
        user = User.objects.get(pk=rated_user_id)
    except User.DoesNotExist:
        logger.warning("User %s not found for rating stats update.", rated_user_id)
        return

    stats = Rating.objects.filter(
        rated=user,
        is_flagged=False,
    ).aggregate(
        avg=Avg("score"),
        count=Count("id"),
    )

    user.avg_rating = stats["avg"] or 0
    user.rating_count = stats["count"]
    user.save(update_fields=["avg_rating", "rating_count"])

    logger.info(
        "Updated rating stats for user %s: avg=%.2f, count=%d",
        user.pk,
        user.avg_rating,
        user.rating_count,
    )
