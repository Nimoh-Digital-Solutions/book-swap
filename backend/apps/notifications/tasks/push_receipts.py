"""Celery task that polls Expo push receipts and reconciles delivery state.

When ``_push_to_devices`` submits a notification, Expo immediately returns
a *ticket* (acceptance). The actual delivery to APNs/FCM happens
asynchronously and the only way to know whether the device received the
notification is to call the receipts endpoint with each ticket id.

Expo recommends:
- Wait at least 15 minutes before polling so the receipt is ready.
- Receipts are kept for ~24 hours; after that the lookup returns nothing.
- Batch up to 1000 ticket ids per request (the SDK already chunks for us).

The task runs every 15 minutes via Celery Beat. On each run it picks all
``PushTicket`` rows still ``status='pending'`` whose ``created_at`` is
between 15 minutes and 24 hours ago, fetches the receipts in batches,
records the outcome, and on ``DeviceNotRegistered`` deactivates the
``MobileDevice`` so we stop pushing to a dead token.

Tickets older than 24 hours that never received a receipt are flipped to
``status='expired'`` so the queue stays bounded.
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)

# Expo recommends waiting ~15 min before polling — give it a 30s buffer to
# avoid edge-of-window 'receipt not ready' responses.
RECEIPT_READY_AFTER_SECONDS = 15 * 60 + 30
# Receipts are only stored by Expo for ~24h. After that there's no point
# polling, so we mark the ticket expired.
RECEIPT_TTL_SECONDS = 24 * 60 * 60
# Defensive cap on a single run: if a backlog ever forms, don't pull
# millions of rows in one go. The next beat tick will mop up the rest.
MAX_TICKETS_PER_RUN = 5000


@shared_task(name="notifications.check_push_receipts")
def check_push_receipts() -> dict:
    """Poll Expo for receipts on pending push tickets and reconcile state.

    Returns a small dict of counters so the result is useful in Flower / the
    Celery logs without leaking tokens or PII.
    """
    try:
        from exponent_server_sdk import (
            DeviceNotRegisteredError,
            PushClient,
        )
        from exponent_server_sdk import (
            PushTicket as ExpoPushTicket,
        )
    except ImportError:
        logger.debug("exponent_server_sdk not installed — skipping receipt poll.")
        return {"checked": 0, "ok": 0, "errors": 0, "deactivated": 0, "expired": 0}

    from ..models import MobileDevice, PushTicket

    now = timezone.now()
    ready_cutoff = now - timezone.timedelta(seconds=RECEIPT_READY_AFTER_SECONDS)
    expired_cutoff = now - timezone.timedelta(seconds=RECEIPT_TTL_SECONDS)

    # First, age out anything older than 24h that we never managed to check.
    # These receipts are gone from Expo's side, no value in keeping them
    # pending forever.
    aged_count = (
        PushTicket.objects.filter(
            status=PushTicket.Status.PENDING,
            created_at__lt=expired_cutoff,
        ).update(status=PushTicket.Status.EXPIRED, checked_at=now)
    )

    pending = list(
        PushTicket.objects.filter(
            status=PushTicket.Status.PENDING,
            created_at__lte=ready_cutoff,
            created_at__gte=expired_cutoff,
        )
        .order_by("created_at")[:MAX_TICKETS_PER_RUN]
    )

    if not pending:
        if aged_count:
            logger.info("check_push_receipts: %d ticket(s) aged-out as expired.", aged_count)
        return {"checked": 0, "ok": 0, "errors": 0, "deactivated": 0, "expired": aged_count}

    # The SDK's check_receipts_multiple expects objects with an ``id``
    # attribute and chunks them into batches of 1000 internally. The
    # PushTicket namedtuple has 5 positional fields; only ``id`` is read.
    expo_tickets = [
        ExpoPushTicket(push_message=None, status="ok", message="", details=None, id=t.ticket_id) for t in pending
    ]

    client = PushClient()
    try:
        receipts = client.check_receipts_multiple(expo_tickets)
    except Exception as exc:
        # Network blip or Expo outage — leave tickets pending and try again
        # next tick. We deliberately do NOT raise so Beat keeps scheduling.
        logger.warning("check_push_receipts: receipts request failed (%s) — will retry next tick.", exc)
        return {"checked": 0, "ok": 0, "errors": 0, "deactivated": 0, "expired": aged_count}

    receipts_by_id = {r.id: r for r in receipts}
    pending_by_id = {t.ticket_id: t for t in pending}

    ok_ids: list[str] = []
    error_updates: dict[str, dict[str, str]] = {}
    deactivated_tokens: set[str] = set()

    for ticket_id, ticket in pending_by_id.items():
        receipt = receipts_by_id.get(ticket_id)
        if receipt is None:
            # Expo no longer has the receipt (likely past 24h, but our cutoff
            # should normally catch that). Mark as expired so we stop trying.
            error_updates[ticket_id] = {
                "status": PushTicket.Status.EXPIRED,
                "error_code": "receipt_not_found",
                "error_message": "Expo no longer holds a receipt for this ticket.",
            }
            continue

        if receipt.is_success():
            ok_ids.append(ticket_id)
            continue

        # Receipt status == 'error'. Try to extract the structured error code
        # from receipt.details — Expo sets details.error to one of:
        # DeviceNotRegistered, MessageTooBig, MessageRateExceeded,
        # MismatchSenderId, InvalidCredentials, etc.
        details = receipt.details or {}
        error_code = (details.get("error") if isinstance(details, dict) else "") or ""
        error_message = (receipt.message or "")[:512]

        if error_code == "DeviceNotRegistered":
            deactivated_tokens.add(ticket.push_token)

        # Other transient/permanent errors are recorded but do not deactivate
        # the device — the next push will surface a fresh ticket-time error
        # via DeviceNotRegisteredError if the token is now dead.
        try:
            # Validate via SDK to log a useful error class even when we don't
            # branch on it. validate_response raises for non-success.
            receipt.validate_response()
        except DeviceNotRegisteredError:
            deactivated_tokens.add(ticket.push_token)
        except Exception as exc:
            logger.debug("Receipt %s validate raised %s", ticket_id[:8], exc)

        error_updates[ticket_id] = {
            "status": PushTicket.Status.ERROR,
            "error_code": error_code or "unknown",
            "error_message": error_message,
        }

    if ok_ids:
        PushTicket.objects.filter(ticket_id__in=ok_ids).update(
            status=PushTicket.Status.OK,
            checked_at=now,
        )

    for ticket_id, fields in error_updates.items():
        PushTicket.objects.filter(ticket_id=ticket_id).update(checked_at=now, **fields)

    if deactivated_tokens:
        deactivated_count = MobileDevice.objects.filter(
            push_token__in=deactivated_tokens,
            is_active=True,
        ).update(is_active=False)
    else:
        deactivated_count = 0

    summary = {
        "checked": len(pending),
        "ok": len(ok_ids),
        "errors": len(error_updates),
        "deactivated": deactivated_count,
        "expired": aged_count,
    }
    logger.info(
        "check_push_receipts: checked=%(checked)d ok=%(ok)d errors=%(errors)d "
        "deactivated=%(deactivated)d expired=%(expired)d",
        summary,
    )
    return summary
