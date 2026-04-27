"""Security regression tests: ADV-202 & ADV-203.

ADV-202: confirm_swap race condition — without SELECT FOR UPDATE two
concurrent confirmations could clobber each other's timestamp, leaving the
exchange stuck in ACTIVE with a lost confirmation. The fix wraps the whole
action in ``transaction.atomic()`` + ``select_for_update()``.

ADV-203: Bulk decline on accept skips notifications — when a request is
accepted, all other pending requests involving either book are bulk-declined
via ``QuerySet.update()``, which bypasses ``post_save`` signals. The fix
collects PKs and dispatches ``send_request_declined_notification`` per row.
"""

from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.exchanges.models import ExchangeRequest, ExchangeStatus
from apps.exchanges.tests.factories import ExchangeRequestFactory
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def _confirm_url(pk):
    return f"/api/v1/exchanges/{pk}/confirm-swap/"


def _accept_url(pk):
    return f"/api/v1/exchanges/{pk}/accept/"


# ═══════════════════════════════════════════════════════════════════════════
# ADV-202 — confirm_swap uses row locking
# ═══════════════════════════════════════════════════════════════════════════


class TestADV202ConfirmSwapRowLocking:
    def _make_active_exchange(self):
        exchange = ExchangeRequestFactory(active=True)
        return exchange

    def test_requester_confirm_sets_timestamp(self):
        exchange = self._make_active_exchange()
        client = APIClient()
        client.force_authenticate(exchange.requester)

        resp = client.post(_confirm_url(exchange.pk))

        assert resp.status_code == 200
        exchange.refresh_from_db()
        assert exchange.requester_confirmed_at is not None

    def test_owner_confirm_sets_timestamp(self):
        exchange = self._make_active_exchange()
        client = APIClient()
        client.force_authenticate(exchange.owner)

        resp = client.post(_confirm_url(exchange.pk))

        assert resp.status_code == 200
        exchange.refresh_from_db()
        assert exchange.owner_confirmed_at is not None

    def test_both_confirmations_transitions_to_swap_confirmed(self):
        """After both sides confirm the exchange transitions correctly."""
        exchange = self._make_active_exchange()
        exchange.requester_confirmed_at = timezone.now()
        exchange.save(update_fields=["requester_confirmed_at"])

        client = APIClient()
        client.force_authenticate(exchange.owner)

        resp = client.post(_confirm_url(exchange.pk))

        assert resp.status_code == 200
        exchange.refresh_from_db()
        assert exchange.status == ExchangeStatus.SWAP_CONFIRMED

    def test_double_confirm_rejected(self):
        """Same user confirming twice returns 400."""
        exchange = self._make_active_exchange()
        exchange.requester_confirmed_at = timezone.now()
        exchange.save(update_fields=["requester_confirmed_at"])

        client = APIClient()
        client.force_authenticate(exchange.requester)

        resp = client.post(_confirm_url(exchange.pk))

        assert resp.status_code == 400
        assert "already confirmed" in resp.data["detail"]

    def test_confirm_uses_select_for_update(self):
        """Verify select_for_update is called (regression guard)."""
        exchange = self._make_active_exchange()
        client = APIClient()
        client.force_authenticate(exchange.requester)

        with patch.object(
            ExchangeRequest.objects,
            "select_for_update",
            wraps=ExchangeRequest.objects.select_for_update,
        ) as mock_sfu:
            client.post(_confirm_url(exchange.pk))
            mock_sfu.assert_called_once()


# ═══════════════════════════════════════════════════════════════════════════
# ADV-203 — Bulk decline dispatches notifications
# ═══════════════════════════════════════════════════════════════════════════


class TestADV203BulkDeclineNotifications:
    def test_accept_auto_declines_competing_requests(self):
        """Accepting one request bulk-declines others on the same book."""
        exchange = ExchangeRequestFactory(status=ExchangeStatus.PENDING)
        competing = ExchangeRequestFactory(
            requested_book=exchange.requested_book,
            owner=exchange.owner,
            status=ExchangeStatus.PENDING,
        )

        client = APIClient()
        client.force_authenticate(exchange.owner)

        resp = client.post(_accept_url(exchange.pk))

        assert resp.status_code == 200
        competing.refresh_from_db()
        assert competing.status == ExchangeStatus.DECLINED

    @patch("apps.notifications.tasks.send_request_declined_notification")
    def test_accept_sends_decline_notifications(self, mock_notify):
        """Each auto-declined request triggers a decline notification task."""
        exchange = ExchangeRequestFactory(status=ExchangeStatus.PENDING)
        other_requester = UserFactory(is_active=True, email_verified=True)
        competing = ExchangeRequestFactory(
            requested_book=exchange.requested_book,
            owner=exchange.owner,
            requester=other_requester,
            status=ExchangeStatus.PENDING,
        )

        client = APIClient()
        client.force_authenticate(exchange.owner)

        client.post(_accept_url(exchange.pk))

        mock_notify.delay.assert_any_call(str(competing.pk))

    @patch("apps.notifications.tasks.send_request_declined_notification")
    def test_no_notifications_when_no_competing(self, mock_notify):
        """No spurious notifications when there are no competing requests."""
        exchange = ExchangeRequestFactory(status=ExchangeStatus.PENDING)

        client = APIClient()
        client.force_authenticate(exchange.owner)

        client.post(_accept_url(exchange.pk))

        mock_notify.delay.assert_not_called()
