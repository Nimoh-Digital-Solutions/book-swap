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


def _push_to_devices(user, title: str, body: str, data: dict | None = None) -> None:
    """Send Expo push notifications to all of a user's registered devices."""
    try:
        from exponent_server_sdk import (
            DeviceNotRegisteredError,
            PushClient,
            PushMessage,
        )

        from .models import MobileDevice

        tokens = list(MobileDevice.objects.filter(user=user, is_active=True).values_list("push_token", flat=True))
        if not tokens:
            return

        client = PushClient()
        messages = [PushMessage(to=token, title=title, body=body, data=data or {}, sound="default") for token in tokens]
        responses = client.publish_multiple(messages)
        for token, response in zip(tokens, responses, strict=False):
            try:
                response.validate_response()
            except DeviceNotRegisteredError:
                MobileDevice.objects.filter(push_token=token).update(is_active=False)
                logger.info("Deactivated stale push token: %s", token[:20])
            except Exception as exc:
                logger.warning("Push error for token %s: %s", token[:20], exc)
    except ImportError:
        logger.debug("exponent_server_sdk not installed — skipping device push.")
    except Exception as exc:
        logger.warning("Device push failed for user %s: %s", user.pk, exc)


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


def _maybe_send_email(
    user,
    subject: str,
    body_text: str,
    prefs_field: str,
    *,
    cta_url: str = "",
    cta_text: str = "",
    body_html: str = "",
) -> None:
    """Send a branded HTML + plain-text email if the user has opted in."""
    from django.conf import settings
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string

    from .models import NotificationPreferences

    prefs, _ = NotificationPreferences.objects.get_or_create(user=user)
    if not getattr(prefs, prefs_field, True):
        logger.debug("Email suppressed for %s (user %s opted out).", prefs_field, user.pk)
        return

    fe_url = _frontend_url()
    unsub_url = f"{fe_url}/notifications/unsubscribe/{prefs.unsubscribe_token}"
    plain_body = f"{body_text}\n\n---\nManage your email preferences: {unsub_url}"

    html_body = render_to_string(
        "emails/notifications/notification.html",
        {
            "subject": subject,
            "recipient_name": user.get_full_name() or user.username,
            "body_text": body_text,
            "body_html": body_html or body_text,
            "cta_url": cta_url,
            "cta_text": cta_text,
            "unsubscribe_url": unsub_url,
            "frontend_url": fe_url,
        },
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
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
    _push_to_devices(recipient, notif.title, notif.body, {"type": "new_request", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: {requester_name} wants to swap with you",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{requester_name} has sent you a swap request for "{book_title}".\n\n'
            f"View the request: {_frontend_url()}{link}"
        ),
        prefs_field="email_new_request",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Request",
        body_html=f'{requester_name} has sent you a swap request for "<strong>{book_title}</strong>".',
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
    _push_to_devices(recipient, notif.title, notif.body, {"type": "request_accepted", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: Your request was accepted by {owner_name}",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'Great news! {owner_name} has accepted your swap request for "{book_title}".\n\n'
            f"Continue the exchange: {_frontend_url()}{link}"
        ),
        prefs_field="email_request_accepted",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="Continue Exchange",
        body_html=f'Great news! {owner_name} has accepted your swap request for "<strong>{book_title}</strong>".',
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
    _push_to_devices(recipient, notif.title, notif.body, {"type": "request_declined", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject="BookSwap: Your request was declined",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'Unfortunately, {owner_name} has declined your swap request for "{book_title}".\n\n'
            f"Discover more books: {_frontend_url()}{link}"
        ),
        prefs_field="email_request_declined",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="Discover More Books",
        body_html=(
            f"Unfortunately, {owner_name} has declined your swap request for "
            f'"<strong>{book_title}</strong>". Don\'t worry — there are plenty more books to discover!'
        ),
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
        _push_to_devices(recipient, notif.title, notif.body, {"type": "exchange_completed", "exchange_id": exchange_id})
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
            cta_url=f"{_frontend_url()}{link}",
            cta_text="Leave a Rating",
            body_html=(
                f'Your exchange for "<strong>{book_title}</strong>" is now complete. '
                f"Share your experience by leaving a rating!"
            ),
        )
    logger.info("exchange_completed notifications sent (exchange %s).", exchange_id)


@shared_task(name="notifications.send_swap_confirmed")
def send_swap_confirmed_notification(exchange_id: str, confirmed_by_user_id: str = "") -> None:
    """Notify the other party (or both for auto-confirm) when the swap is confirmed."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_swap_confirmed: exchange %s not found.", exchange_id)
        return

    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    if confirmed_by_user_id and str(exchange.requester_id) == confirmed_by_user_id:
        recipients = [exchange.owner]
    elif confirmed_by_user_id and str(exchange.owner_id) == confirmed_by_user_id:
        recipients = [exchange.requester]
    else:
        recipients = [exchange.requester, exchange.owner]

    for recipient in recipients:
        notif = _create_notification(
            user=recipient,
            notification_type=NotificationType.SWAP_CONFIRMED,
            title="Swap confirmed!",
            body=f'The physical swap for "{book_title}" has been confirmed by both parties.',
            link=link,
        )
        _push_to_ws(str(recipient.pk), _notification_payload(notif))
        _push_to_devices(recipient, notif.title, notif.body, {"type": "swap_confirmed", "exchange_id": exchange_id})
        _maybe_send_email(
            user=recipient,
            subject="BookSwap: Swap confirmed!",
            body_text=(
                f"Hi {recipient.username},\n\n"
                f'Great news! The physical swap for "{book_title}" has been confirmed.\n\n'
                f"View the exchange: {_frontend_url()}{link}"
            ),
            prefs_field="email_exchange_completed",
            cta_url=f"{_frontend_url()}{link}",
            cta_text="View Exchange",
            body_html=(
                f'Great news! The physical swap for "<strong>{book_title}</strong>" has been confirmed by both parties.'
            ),
        )
    logger.info("swap_confirmed notification(s) sent (exchange %s).", exchange_id)


@shared_task(name="notifications.send_request_expired")
def send_request_expired_notification(exchange_id: str) -> None:
    """Notify both parties when an exchange request expires."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_request_expired: exchange %s not found.", exchange_id)
        return

    book_title = exchange.requested_book.title
    link = "/discover/"

    for recipient in (exchange.requester, exchange.owner):
        notif = _create_notification(
            user=recipient,
            notification_type=NotificationType.REQUEST_EXPIRED,
            title="Swap request expired",
            body=f'The swap request for "{book_title}" has expired.',
            link=link,
        )
        _push_to_ws(str(recipient.pk), _notification_payload(notif))
        _push_to_devices(recipient, notif.title, notif.body, {"type": "request_expired", "exchange_id": exchange_id})
        _maybe_send_email(
            user=recipient,
            subject="BookSwap: Swap request expired",
            body_text=(
                f"Hi {recipient.username},\n\n"
                f'The swap request for "{book_title}" has expired because it wasn\'t responded to in time.\n\n'
                f"Discover more books: {_frontend_url()}{link}"
            ),
            prefs_field="email_new_request",
            cta_url=f"{_frontend_url()}{link}",
            cta_text="Discover More Books",
            body_html=(
                f'The swap request for "<strong>{book_title}</strong>" has expired '
                f"because it wasn't responded to in time."
            ),
        )
    logger.info("request_expired notifications sent (exchange %s).", exchange_id)


@shared_task(name="notifications.send_request_cancelled")
def send_request_cancelled_notification(exchange_id: str) -> None:
    """Notify the book owner when the requester cancels their request."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_request_cancelled: exchange %s not found.", exchange_id)
        return

    recipient = exchange.owner
    requester_name = exchange.requester.username
    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.REQUEST_CANCELLED,
        title="Swap request cancelled",
        body=f'{requester_name} cancelled their swap request for "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "request_cancelled", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject="BookSwap: Swap request cancelled",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{requester_name} cancelled their swap request for "{book_title}".\n\n'
            f"View the exchange: {_frontend_url()}{link}"
        ),
        prefs_field="email_new_request",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Details",
        body_html=f'{requester_name} cancelled their swap request for "<strong>{book_title}</strong>".',
    )
    logger.info("request_cancelled notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_return_requested")
def send_return_requested_notification(exchange_id: str, requested_by_user_id: str) -> None:
    """Notify the other party when a book return is requested."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_return_requested: exchange %s not found.", exchange_id)
        return

    if str(exchange.requester_id) == requested_by_user_id:
        recipient = exchange.owner
    else:
        recipient = exchange.requester

    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.RETURN_REQUESTED,
        title="Return requested",
        body=f'A return has been requested for the exchange of "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "return_requested", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject="BookSwap: Return requested",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'A return has been requested for the exchange of "{book_title}".\n\n'
            f"View the exchange: {_frontend_url()}{link}"
        ),
        prefs_field="email_exchange_completed",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Exchange",
        body_html=f'A return has been requested for the exchange of "<strong>{book_title}</strong>".',
    )
    logger.info("return_requested notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_exchange_returned")
def send_exchange_returned_notification(exchange_id: str) -> None:
    """Notify both parties when books have been returned."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_exchange_returned: exchange %s not found.", exchange_id)
        return

    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    for recipient in (exchange.requester, exchange.owner):
        notif = _create_notification(
            user=recipient,
            notification_type=NotificationType.EXCHANGE_RETURNED,
            title="Books returned!",
            body=f'The books from the exchange of "{book_title}" have been returned.',
            link=link,
        )
        _push_to_ws(str(recipient.pk), _notification_payload(notif))
        _push_to_devices(recipient, notif.title, notif.body, {"type": "exchange_returned", "exchange_id": exchange_id})
        _maybe_send_email(
            user=recipient,
            subject="BookSwap: Books have been returned",
            body_text=(
                f"Hi {recipient.username},\n\n"
                f'The books from the exchange of "{book_title}" have been returned successfully.\n\n'
                f"View the exchange: {_frontend_url()}{link}"
            ),
            prefs_field="email_exchange_completed",
            cta_url=f"{_frontend_url()}{link}",
            cta_text="View Exchange",
            body_html=(
                f'The books from the exchange of "<strong>{book_title}</strong>" have been returned successfully.'
            ),
        )
    logger.info("exchange_returned notifications sent (exchange %s).", exchange_id)


@shared_task(name="notifications.send_counter_proposed")
def send_counter_proposed_notification(exchange_id: str, counter_by_user_id: str) -> None:
    """Notify the other party when a counter-offer is proposed."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
            "offered_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_counter_proposed: exchange %s not found.", exchange_id)
        return

    if str(exchange.requester_id) == counter_by_user_id:
        recipient = exchange.owner
        proposer = exchange.requester
    else:
        recipient = exchange.requester
        proposer = exchange.owner

    book_title = exchange.offered_book.title if exchange.offered_book else "a different book"
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.COUNTER_PROPOSED,
        title="Counter-offer received",
        body=f'{proposer.username} proposed swapping "{book_title}" instead.',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "counter_proposed", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject=f"BookSwap: {proposer.username} sent a counter-offer",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{proposer.username} has proposed a different book for your exchange: "{book_title}".\n\n'
            f"Review the counter-offer: {_frontend_url()}{link}"
        ),
        prefs_field="email_new_request",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="Review Counter-Offer",
        body_html=(
            f'{proposer.username} has proposed a different book for your exchange: "<strong>{book_title}</strong>".'
        ),
    )
    logger.info("counter_proposed notification → user %s (exchange %s).", recipient.pk, exchange_id)


@shared_task(name="notifications.send_counter_approved")
def send_counter_approved_notification(exchange_id: str, approved_by_user_id: str) -> None:
    """Notify the counter-proposer that their counter-offer was approved."""
    from apps.exchanges.models import ExchangeRequest

    from .models import NotificationType

    try:
        exchange = ExchangeRequest.objects.select_related(
            "requester",
            "owner",
            "requested_book",
        ).get(pk=exchange_id)
    except ExchangeRequest.DoesNotExist:
        logger.warning("send_counter_approved: exchange %s not found.", exchange_id)
        return

    if str(exchange.requester_id) == approved_by_user_id:
        recipient = exchange.owner
    else:
        recipient = exchange.requester

    is_requester = str(exchange.requester_id) == approved_by_user_id
    approver_name = exchange.requester.username if is_requester else exchange.owner.username
    book_title = exchange.requested_book.title
    link = f"/exchanges/{exchange_id}/"

    notif = _create_notification(
        user=recipient,
        notification_type=NotificationType.COUNTER_APPROVED,
        title="Counter-offer approved!",
        body=f'{approver_name} approved your counter-offer for "{book_title}".',
        link=link,
    )
    _push_to_ws(str(recipient.pk), _notification_payload(notif))
    _push_to_devices(recipient, notif.title, notif.body, {"type": "counter_approved", "exchange_id": exchange_id})
    _maybe_send_email(
        user=recipient,
        subject="BookSwap: Your counter-offer was approved",
        body_text=(
            f"Hi {recipient.username},\n\n"
            f'{approver_name} has approved your counter-offer for the exchange of "{book_title}".\n\n'
            f"View the exchange: {_frontend_url()}{link}"
        ),
        prefs_field="email_request_accepted",
        cta_url=f"{_frontend_url()}{link}",
        cta_text="View Exchange",
        body_html=(
            f'{approver_name} has approved your counter-offer for the exchange of "<strong>{book_title}</strong>".'
        ),
    )
    logger.info("counter_approved notification → user %s (exchange %s).", recipient.pk, exchange_id)


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


# ---------------------------------------------------------------------------
# Account deletion task
# ---------------------------------------------------------------------------


@shared_task(name="notifications.send_account_deletion_email")
def send_account_deletion_email(user_id: str, cancel_token: str) -> None:
    """Send a confirmation email when account deletion is requested."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.warning("send_account_deletion_email: user %s not found.", user_id)
        return

    fe_url = _frontend_url()
    cancel_url = f"{fe_url}/account/cancel-deletion?token={cancel_token}"

    _send_direct_email(
        user=user,
        subject="BookSwap: Your account is scheduled for deletion",
        body_text=(
            f"Hi {user.username},\n\n"
            "We received your request to delete your BookSwap account. "
            "Your account has been deactivated and will be permanently deleted in 30 days.\n\n"
            "During this period, you can cancel the deletion by visiting:\n"
            f"{cancel_url}\n\n"
            "What will be deleted:\n"
            "- Your profile information (name, email, location)\n"
            "- All your book listings\n"
            "- Exchange history and messages\n"
            "- Ratings and reviews\n"
            "- Push notification tokens and preferences\n\n"
            "If you did not request this, please cancel immediately using the link above "
            "and change your password.\n\n"
            "The BookSwap Team"
        ),
        cta_url=cancel_url,
        cta_text="Cancel Deletion",
        body_html=(
            "We received your request to delete your BookSwap account. "
            "Your account has been deactivated and will be <strong>permanently deleted in 30 days</strong>."
            "<br><br>"
            "During this period, you can cancel the deletion at any time."
            '<br><br><strong style="color:#1a2f23;">What will be deleted:</strong>'
            "<br>&#8226; Your profile information (name, email, location)"
            "<br>&#8226; All your book listings"
            "<br>&#8226; Exchange history and messages"
            "<br>&#8226; Ratings and reviews"
            "<br>&#8226; Push notification tokens and preferences"
            "<br><br>"
            '<span style="color:#c0392b;">If you did not request this, please cancel immediately '
            "and change your password.</span>"
        ),
    )
    logger.info("Account deletion confirmation email sent to user %s.", user_id)


def _send_direct_email(
    user,
    subject: str,
    body_text: str,
    *,
    cta_url: str = "",
    cta_text: str = "",
    body_html: str = "",
) -> None:
    """Send a branded email directly (no preference check — always sent)."""
    from django.conf import settings
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string

    fe_url = _frontend_url()
    html_body = render_to_string(
        "emails/notifications/notification.html",
        {
            "subject": subject,
            "recipient_name": user.get_full_name() or user.username,
            "body_text": body_text,
            "body_html": body_html or body_text,
            "cta_url": cta_url,
            "cta_text": cta_text,
            "frontend_url": fe_url,
        },
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        logger.info("Direct email sent to %s: %s", user.email, subject)
    except Exception as exc:
        logger.warning("Direct email send failed (%s): %s", user.email, exc)
