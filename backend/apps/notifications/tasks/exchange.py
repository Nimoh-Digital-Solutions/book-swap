"""Notification tasks for exchange lifecycle events (request, accept, decline, complete, ...)."""

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


@shared_task(name="notifications.send_new_request")
def send_new_request_notification(exchange_id: str) -> None:
    """Notify the book owner when a new swap request arrives."""
    from apps.exchanges.models import ExchangeRequest

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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

    from ..models import NotificationType

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
