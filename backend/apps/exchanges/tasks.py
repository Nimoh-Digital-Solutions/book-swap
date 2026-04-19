"""Celery tasks for the exchanges app."""

import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import F
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="exchanges.expire_stale_requests")
def expire_stale_requests():
    """Expire pending exchange requests older than 14 days.

    Runs daily via Celery Beat. Sets status → 'expired' and records
    the expiry timestamp.
    """
    from .models import ExchangeRequest, ExchangeStatus

    cutoff = timezone.now() - timedelta(days=14)
    expired = ExchangeRequest.objects.filter(
        status=ExchangeStatus.PENDING,
        created_at__lte=cutoff,
    ).update(
        status=ExchangeStatus.EXPIRED,
        expired_at=timezone.now(),
    )

    if expired:
        logger.info("Expired %d stale exchange requests.", expired)
    return expired


@shared_task(name="exchanges.expire_stale_conditions")
def expire_stale_conditions():
    """Expire exchanges stuck in accepted/conditions_pending for 14+ days.

    Runs daily via Celery Beat. Gives both users 14 days to accept
    conditions after the owner accepts the request.
    Books are released back to AVAILABLE since they were locked at accept time.
    """
    from apps.books.models import BookStatus

    from .models import ExchangeRequest, ExchangeStatus

    cutoff = timezone.now() - timedelta(days=14)
    now = timezone.now()
    stale = list(
        ExchangeRequest.objects.filter(
            status__in=[ExchangeStatus.ACCEPTED, ExchangeStatus.CONDITIONS_PENDING],
            updated_at__lte=cutoff,
        ).select_related("requested_book", "offered_book")
    )
    for exchange in stale:
        exchange.status = ExchangeStatus.EXPIRED
        exchange.expired_at = now
        exchange.save(update_fields=["status", "expired_at", "updated_at"])

        exchange.requested_book.status = BookStatus.AVAILABLE
        exchange.requested_book.save(update_fields=["status"])
        exchange.offered_book.status = BookStatus.AVAILABLE
        exchange.offered_book.save(update_fields=["status"])

    if stale:
        logger.info("Expired %d exchanges with stale conditions.", len(stale))
    return len(stale)


@shared_task(name="exchanges.auto_confirm_stale_swaps")
def auto_confirm_stale_swaps():
    """Auto-confirm swaps where one party confirmed 60+ days ago.

    Runs weekly via Celery Beat. If one user confirmed the swap but
    the other hasn't after 60 days, auto-fill the missing confirmation
    and advance to swap_confirmed.
    """
    from django.contrib.auth import get_user_model

    from .models import ExchangeRequest, ExchangeStatus

    UserModel = get_user_model()
    cutoff = timezone.now() - timedelta(days=60)
    now = timezone.now()
    affected_user_ids: set[int] = set()
    total = 0

    # Requester confirmed but owner hasn't
    requester_only = list(
        ExchangeRequest.objects.filter(
            status=ExchangeStatus.ACTIVE,
            requester_confirmed_at__lte=cutoff,
            owner_confirmed_at__isnull=True,
        ).select_related("requested_book", "offered_book")
    )
    for exchange in requester_only:
        exchange.owner_confirmed_at = now
        exchange.transition_to(ExchangeStatus.SWAP_CONFIRMED)
        exchange.save(
            update_fields=[
                "owner_confirmed_at",
                "status",
                "updated_at",
            ]
        )
        affected_user_ids.add(exchange.requester_id)
        affected_user_ids.add(exchange.owner_id)
        total += 1

    # Owner confirmed but requester hasn't
    owner_only = list(
        ExchangeRequest.objects.filter(
            status=ExchangeStatus.ACTIVE,
            owner_confirmed_at__lte=cutoff,
            requester_confirmed_at__isnull=True,
        ).select_related("requested_book", "offered_book")
    )
    for exchange in owner_only:
        exchange.requester_confirmed_at = now
        exchange.transition_to(ExchangeStatus.SWAP_CONFIRMED)
        exchange.save(
            update_fields=[
                "requester_confirmed_at",
                "status",
                "updated_at",
            ]
        )
        affected_user_ids.add(exchange.requester_id)
        affected_user_ids.add(exchange.owner_id)
        total += 1

    if affected_user_ids:
        UserModel.objects.filter(pk__in=affected_user_ids).update(
            swap_count=F("swap_count") + 1,
        )

    if total:
        logger.info("Auto-confirmed %d stale swaps.", total)

    return total
