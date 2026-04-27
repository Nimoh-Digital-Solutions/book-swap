"""Notification task for new chat messages (with 15-min email de-duplication)."""

import logging

from celery import shared_task

from ._helpers import (
    _MSG_BATCH_TTL,
    _create_notification,
    _frontend_url,
    _maybe_send_email,
    _notification_payload,
    _push_to_devices,
    _push_to_ws,
)

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_new_message")
def send_new_message_notification(exchange_id: str, recipient_user_id: str) -> None:
    """
    Notify a user about a new chat message.

    Creates an in-app notification and pushes to WebSocket immediately.
    Email is suppressed for 15 minutes after the first one to prevent spam
    when a conversation is active (cache key per exchange+recipient).
    """
    from django.core.cache import cache

    from apps.exchanges.models import ExchangeRequest

    from ..models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_new_message: exchange %s not found.", exchange_id)
        return

    if str(exchange.requester_id) == recipient_user_id:
        recipient = exchange.requester
        sender = exchange.owner
    elif str(exchange.owner_id) == recipient_user_id:
        recipient = exchange.owner
        sender = exchange.requester
    else:
        logger.warning(
            "send_new_message: user %s is not a participant in exchange %s.",
            recipient_user_id,
            exchange_id,
        )
        return

    link = f"/exchanges/{exchange_id}/"
    book_title = exchange.requested_book.title

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.NEW_MESSAGE,
        title="New message",
        body=f'{sender.username} sent you a message about "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "new_message", "exchange_id": exchange_id})

    # Email: only once per 15-minute window to avoid spam.
    cache_key = f"notif_msg_email_{exchange_id}_{recipient_user_id}"
    if cache.get(cache_key):
        logger.debug("Message email suppressed (within batch window) for user %s.", recipient_user_id)
        return

    cache.set(cache_key, True, timeout=_MSG_BATCH_TTL)
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: New message from {sender.username}",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{sender.username} sent you a message about "{book_title}".\n\n'
            f"View the conversation: {_frontend_url()}{link}"
        ),
        prefs_field="email_new_message",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Conversation",
        body_html=f'{sender.username} sent you a message about "<strong>{book_title}</strong>".',
    )
    logger.info("new_message notification → user %s (exchange %s).", recipient_user_id, exchange_id)
