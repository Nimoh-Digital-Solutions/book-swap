"""apps.notifications.tasks package — split by domain (AUD-B-303).

Public API is preserved: every Celery task that used to live in
``apps.notifications.tasks`` is re-exported here so imports such as
``from apps.notifications.tasks import send_request_declined_notification``
and ``mock.patch`` paths like
``apps.notifications.tasks.send_request_declined_notification`` keep
working without any caller-side change.
"""

from .account import send_account_deletion_email
from .exchange import (
    send_counter_approved_notification,
    send_counter_proposed_notification,
    send_exchange_completed_notification,
    send_exchange_returned_notification,
    send_new_request_notification,
    send_request_accepted_notification,
    send_request_cancelled_notification,
    send_request_declined_notification,
    send_request_expired_notification,
    send_return_requested_notification,
    send_swap_confirmed_notification,
)
from .messaging import send_new_message_notification
from .ratings import send_rating_received_notification

__all__ = [
    "send_account_deletion_email",
    "send_counter_approved_notification",
    "send_counter_proposed_notification",
    "send_exchange_completed_notification",
    "send_exchange_returned_notification",
    "send_new_message_notification",
    "send_new_request_notification",
    "send_rating_received_notification",
    "send_request_accepted_notification",
    "send_request_cancelled_notification",
    "send_request_declined_notification",
    "send_request_expired_notification",
    "send_return_requested_notification",
    "send_swap_confirmed_notification",
]
