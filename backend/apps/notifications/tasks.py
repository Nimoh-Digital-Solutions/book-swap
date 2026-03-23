"""
Celery tasks for notification delivery (US-901/902).

Each task:
  1. Creates an in-app Notification record in the database.
  2. Pushes the notification to the user's WebSocket group for real-time bell updates.
  3. Sends a transactional email (if the user has not opted out).

New-message notifications are de-duplicated via a 15-minute cache key per
(exchange, recipient) pair so a burst of messages produces at most one email
per window.
"""

import logging

from asgiref.sync import async_to_sync
from celery import shared_task

logger = logging.getLogger(__name__)

# Default window for new-message email batching (seconds).
_MSG_BATCH_TTL = 60 * 15  # 15 minutes


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _frontend_url() -> str:
    from django.conf import settings

    return getattr(settings, "FRONTEND_URL", "https://bookswap.app").rstrip("/")


def _push_to_ws(user_id: str, payload: dict) -> None:
    """Fire-and-forget push to the user's notification WS group."""
    try:
        from channels.layers import get_channel_layer

        layer = get_channel_layer()
        if layer is None:
            return
        async_to_sync(layer.group_send)(
            f"notifications_{user_id}",
            {"type": "notification.push", "notification": payload},
        )
    except Exception as exc:
        logger.warning("WS push failed for user %s: %s", user_id, exc)


def _create_notification(user, notification_type: str, title: str, body: str, link: str = ""):
    """Persist an in-app notification and return it."""
    from .models import Notification

    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        link=link,
    )


def _maybe_send_email(user, subject: str, body_text: str, prefs_field: str) -> None:
    """Send a transactional email if the user has opted in for that type."""
    from django.conf import settings
    from django.core.mail import send_mail

    from .models import NotificationPreferences

    prefs, _ = NotificationPreferences.objects.get_or_create(user=user)
    if not getattr(prefs, prefs_field, True):
        logger.debug("Email suppressed for %s (user %s opted out).", prefs_field, user.pk)
        return

    unsub_url = f"{_frontend_url()}/notifications/unsubscribe/{prefs.unsubscribe_token}"
    full_body = f"{body_text}\n\n---\nManage your email preferences: {unsub_url}"

    try:
        send_mail(
            subject=subject,
            message=full_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Notification email (%s) sent to %s.", prefs_field, user.email)
    except Exception as exc:
        logger.warning("Email send failed (%s → %s): %s", prefs_field, user.email, exc)


def _notification_payload(notification) -> dict:
    return {
        "id": str(notification.pk),
        "notification_type": notification.notification_type,
        "title": notification.title,
        "body": notification.body,
        "link": notification.link,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# Exchange-related tasks
# ---------------------------------------------------------------------------


@shared_task(name="notifications.send_new_request")
def send_new_request_notification(exchange_id: str) -> None:
    """Notify the book owner when a new swap request arrives."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_new_request: exchange %s not found.", exchange_id)
        return

    recipient = exchange.owner
    book_title = exchange.requested_book.title
    requester_name = exchange.requester.username
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.NEW_REQUEST,
        title="New swap request",
        body=f'{requester_name} wants to swap for your book "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: {requester_name} wants to swap with you",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{requester_name} has sent you a swap request for "{book_title}".\n\n'
            f"View the request: {_frontend_url()}{link}"
        ),
        prefs_field="email_new_request",
    )
    logger.info("new_request notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_request_accepted")
def send_request_accepted_notification(exchange_id: str) -> None:
    """Notify the requester that their swap request was accepted."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_request_accepted: exchange %s not found.", exchange_id)
        return

    recipient = exchange.requester
    owner_name = exchange.owner.username
    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.REQUEST_ACCEPTED,
        title="Swap request accepted!",
        body=f'{owner_name} accepted your swap request for "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: Your request was accepted by {owner_name}",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'Great news! {owner_name} has accepted your swap request for "{book_title}".\n\n'
            f"Continue the exchange: {_frontend_url()}{link}"
        ),
        prefs_field="email_request_accepted",
    )
    logger.info("request_accepted notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_request_declined")
def send_request_declined_notification(exchange_id: str) -> None:
    """Notify the requester that their swap request was declined."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_request_declined: exchange %s not found.", exchange_id)
        return

    recipient = exchange.requester
    owner_name = exchange.owner.username
    book_title = exchange.requested_book.title
    link = "/discover/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.REQUEST_DECLINED,
        title="Swap request declined",
        body=f'{owner_name} declined your swap request for "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _maybe_send_email(
        user=recipient,
        subject="BookSwap: Your request was declined",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'Unfortunately, {owner_name} has declined your swap request for "{book_title}".\n\n'
            f"Discover more books: {_frontend_url()}{link}"
        ),
        prefs_field="email_request_declined",
    )
    logger.info("request_declined notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_exchange_completed")
def send_exchange_completed_notification(exchange_id: str) -> None:
    """Notify both parties when an exchange is marked completed."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_exchange_completed: exchange %s not found.", exchange_id)
        return

    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    for recipient in (exchange.requester, exchange.owner):
        notif = _create_notification(
            user=recipient,
            notification_type=NotificationType.EXCHANGE_COMPLETED,
            title="Exchange completed!",
            body=f'Your exchange for "{book_title}" has been completed. Leave a rating!',
            link=link,
        )
        _push_to_ws(str(recipient.pk), _notification_payload(notif))
        _maybe_send_email(
            user=recipient,
            subject="BookSwap: Exchange completed — leave a rating!",
            body_text=(
                f"Hi {recipient.username},\n\n"
                f'Your exchange for "{book_title}" is now complete. '
                f"Share your experience by leaving a rating.\n\n"
                f"View the exchange: {_frontend_url()}{link}"
            ),
            prefs_field="email_exchange_completed",
        )
    logger.info("exchange_completed notifications sent (exchange %s).", exchange_id)


# ---------------------------------------------------------------------------
# Message task (with 15-min de-duplication)
# ---------------------------------------------------------------------------


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

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_new_message: exchange %s not found.", exchange_id)
        return

    # Resolve recipient from either participant.
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

    # Always create the in-app notification and push to WS.
    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.NEW_MESSAGE,
        title="New message",
        body=f'{sender.username} sent you a message about "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))

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
    )
    logger.info("new_message notification → user %s (exchange %s).", recipient_user_id, exchange_id)


# ---------------------------------------------------------------------------
# Rating task
# ---------------------------------------------------------------------------


@shared_task(name="notifications.send_rating_received")
def send_rating_received_notification(rating_id: str) -> None:
    """Notify a user that they received a new rating."""
    from apps.ratings.models import Rating

    from .models import NotificationType

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
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: {rater_name} left you a {score}★ rating",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f"{rater_name} has rated your exchange {score} out of 5.\n\n"
            f"View your profile: {_frontend_url()}{link}"
        ),
        prefs_field="email_rating_received",
    )
    logger.info("rating_received notification → user %s (rating %s).", recipient.pk, rating_id)
