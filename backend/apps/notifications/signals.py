"""
Signals for the notifications app (US-901/902).

Connects three event sources to async Celery notification tasks:

  ExchangeRequest  — new / accepted / declined / expired / completed
  Message          — new chat message (batched, see tasks.py)
  Rating           — rating received
"""

import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.exchanges.models import ExchangeRequest, ExchangeStatus
from apps.messaging.models import Message
from apps.ratings.models import Rating

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# ExchangeRequest — track previous status before save
# ---------------------------------------------------------------------------


@receiver(pre_save, sender=ExchangeRequest)
def _cache_exchange_previous_status(sender, instance, **kwargs):
    """Stash the current DB status on the instance before saving."""
    if instance.pk:
        try:
            instance._previous_status = (
                ExchangeRequest.objects.filter(pk=instance.pk).values_list("status", flat=True).get()
            )
        except ExchangeRequest.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=ExchangeRequest)
def on_exchange_saved(sender, instance, created, **kwargs):
    """Dispatch notification tasks when an exchange changes state."""
    from .tasks import (
        send_exchange_completed_notification,
        send_new_request_notification,
        send_request_accepted_notification,
        send_request_declined_notification,
    )

    exchange_id = str(instance.pk)
    prev = getattr(instance, "_previous_status", None)
    current = instance.status

    if created and current == ExchangeStatus.PENDING:
        logger.debug("Exchange %s created → dispatching new_request task.", exchange_id)
        send_new_request_notification.delay(exchange_id)
        return

    if created or prev == current:
        return

    if current == ExchangeStatus.ACCEPTED:
        send_request_accepted_notification.delay(exchange_id)

    elif current == ExchangeStatus.DECLINED:
        send_request_declined_notification.delay(exchange_id)

    elif current == ExchangeStatus.COMPLETED:
        send_exchange_completed_notification.delay(exchange_id)

    logger.debug(
        "Exchange %s: %s → %s (notification task dispatched if applicable).",
        exchange_id,
        prev,
        current,
    )


# ---------------------------------------------------------------------------
# Message — new chat message
# ---------------------------------------------------------------------------


@receiver(post_save, sender=Message)
def on_message_created(sender, instance, created, **kwargs):
    """Notify the other participant in the exchange when a new message is sent."""
    if not created:
        return

    from .tasks import send_new_message_notification

    exchange = instance.exchange
    sender_id = instance.sender_id

    # Determine the recipient (the other participant).
    if str(sender_id) == str(exchange.requester_id):
        recipient_id = str(exchange.owner_id)
    else:
        recipient_id = str(exchange.requester_id)

    send_new_message_notification.delay(str(exchange.pk), recipient_id)
    logger.debug(
        "Message in exchange %s: notifying user %s.",
        exchange.pk,
        recipient_id,
    )


# ---------------------------------------------------------------------------
# Rating — rating received
# ---------------------------------------------------------------------------


@receiver(post_save, sender=Rating)
def on_rating_created(sender, instance, created, **kwargs):
    """Notify the rated user when they receive a new rating."""
    if not created:
        return

    from .tasks import send_rating_received_notification

    send_rating_received_notification.delay(str(instance.pk))
    logger.debug("Rating %s created → dispatching rating_received task.", instance.pk)
