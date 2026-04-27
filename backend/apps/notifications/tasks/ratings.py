"""Notification task fired when a user receives a new rating."""

import logging

from celery import shared_task

from ._helpers import (
    _create_notification,
    _frontend_url,
    _maybe_send_email,
    _notification_payload,
    _push_to_devices,
    _push_to_ws,
)

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_rating_received")
def send_rating_received_notification(rating_id: str) -> None:
    """Notify a user that they received a new rating."""
    from apps.ratings.models import Rating

    from ..models import NotificationType

    try:
        rating = Rating.objects.select_related("rater", "rated").get(pk=rating_id)
    except Rating.DoesNotExist:
        logger.warning("send_rating_received: rating %s not found.", rating_id)
        return

    recipient = rating.rated
    rater_name = rating.rater.username
    score = rating.score
    link = f"/profile/{rater_name}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.RATING_RECEIVED,
        title=f"You received a {score}★ rating",
        body=f"{rater_name} rated your exchange {score} out of 5.",
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "rating_received"})
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: {rater_name} left you a {score}\u2605 rating",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f"{rater_name} has rated your exchange {score} out of 5.\n\n"
            f"View your profile: {_frontend_url()}{link}"
        ),
        prefs_field="email_rating_received",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Your Profile",
        body_html=f"{rater_name} has rated your exchange <strong>{score} out of 5</strong>.",
    )
    logger.info("rating_received notification → user %s (rating %s).", recipient.pk, rating_id)
