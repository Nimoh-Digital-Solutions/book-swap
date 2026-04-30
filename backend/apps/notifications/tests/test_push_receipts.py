"""Tests for the push-receipt reconciliation pipeline.

Covers two halves of the system:

1. ``_push_to_devices`` — verifies a PushTicket row is persisted for every
   accepted Expo ticket so the poller has something to reconcile later.
2. ``check_push_receipts`` — verifies the periodic Celery task correctly
   transitions tickets between pending → ok / error / expired and
   deactivates devices on DeviceNotRegistered.
"""

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone

from apps.notifications.models import MobileDevice, PushTicket
from apps.notifications.tasks._helpers import _push_to_devices
from apps.notifications.tasks.push_receipts import (
    RECEIPT_READY_AFTER_SECONDS,
    RECEIPT_TTL_SECONDS,
    check_push_receipts,
)
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


VALID_EXPO_TOKEN_1 = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxa]"
VALID_EXPO_TOKEN_2 = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxb]"


def _fake_publish_response(ticket_id: str | None, *, raises: Exception | None = None):
    """Build a stand-in for the SDK's per-ticket response object."""
    response = mock.MagicMock()
    response.id = ticket_id
    response.status = "ok"
    response.details = None
    if raises is not None:
        response.validate_response.side_effect = raises
    else:
        response.validate_response.return_value = None
    return response


def _fake_receipt(ticket_id: str, *, status: str = "ok", details: dict | None = None, message: str = ""):
    """Build a stand-in for the SDK's PushReceipt object."""
    receipt = mock.MagicMock()
    receipt.id = ticket_id
    receipt.status = status
    receipt.details = details
    receipt.message = message
    receipt.is_success.return_value = status == "ok"

    def _validate():
        if status == "ok":
            return None
        from exponent_server_sdk import DeviceNotRegisteredError

        if (details or {}).get("error") == "DeviceNotRegistered":
            payload = mock.MagicMock()
            payload.message = message or "Device not registered"
            raise DeviceNotRegisteredError(payload)
        raise Exception(message or "push error")

    receipt.validate_response.side_effect = _validate
    return receipt


# ── _push_to_devices: ticket persistence ─────────────────────────────────────


class TestPushTicketPersistence:
    def test_creates_ticket_row_per_accepted_token(self):
        """Every accepted Expo ticket gets its own PushTicket row."""
        user = UserFactory()
        MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_1, platform="ios")
        MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_2, platform="android")

        responses = [
            _fake_publish_response("TICKET-A1"),
            _fake_publish_response("TICKET-B2"),
        ]

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.publish_multiple.return_value = responses
            _push_to_devices(user, "Hi", "Hello", {"type": "new_message"})

        tickets = PushTicket.objects.filter(user=user).order_by("ticket_id")
        assert tickets.count() == 2
        assert {t.ticket_id for t in tickets} == {"TICKET-A1", "TICKET-B2"}
        assert all(t.status == PushTicket.Status.PENDING for t in tickets)
        assert all(t.notification_type == "new_message" for t in tickets)
        assert {t.push_token for t in tickets} == {VALID_EXPO_TOKEN_1, VALID_EXPO_TOKEN_2}

    def test_no_ticket_when_publish_returns_empty_id(self):
        """If Expo doesn't return an id we can't reconcile later, so we skip."""
        user = UserFactory()
        MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_1, platform="ios")

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.publish_multiple.return_value = [_fake_publish_response(None)]
            _push_to_devices(user, "Hi", "Hello")

        assert PushTicket.objects.count() == 0

    def test_device_not_registered_at_ticket_time_deactivates_and_skips_ticket(self):
        """A DeviceNotRegisteredError at publish time deactivates the device row
        and does not create a PushTicket (there's no receipt to chase)."""
        from exponent_server_sdk import DeviceNotRegisteredError

        user = UserFactory()
        device = MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_1, platform="ios")

        # PushTicketError needs a push_response-like object with a .message attr.
        err_payload = mock.MagicMock()
        err_payload.message = "Device not registered"
        bad_response = _fake_publish_response(None, raises=DeviceNotRegisteredError(err_payload))

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.publish_multiple.return_value = [bad_response]
            _push_to_devices(user, "Hi", "Hello")

        device.refresh_from_db()
        assert device.is_active is False
        assert PushTicket.objects.count() == 0


# ── check_push_receipts: receipt reconciliation ──────────────────────────────


class TestCheckPushReceipts:
    @staticmethod
    def _make_pending_ticket(*, ticket_id: str, age_seconds: int, user=None, token: str = VALID_EXPO_TOKEN_1):
        """Create a PENDING PushTicket whose ``created_at`` is age_seconds in
        the past (auto_now_add forces an update afterwards)."""
        ticket = PushTicket.objects.create(
            user=user,
            push_token=token,
            ticket_id=ticket_id,
            status=PushTicket.Status.PENDING,
        )
        backdate = timezone.now() - timedelta(seconds=age_seconds)
        PushTicket.objects.filter(pk=ticket.pk).update(created_at=backdate)
        ticket.refresh_from_db()
        return ticket

    def test_returns_empty_summary_when_no_pending(self):
        result = check_push_receipts()
        assert result == {"checked": 0, "ok": 0, "errors": 0, "deactivated": 0, "expired": 0}

    def test_pending_younger_than_window_is_skipped(self):
        """Tickets less than ~15 minutes old are not polled — Expo's receipt
        may not be ready yet."""
        self._make_pending_ticket(ticket_id="FRESH", age_seconds=60)

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            result = check_push_receipts()
            PushClientMock.return_value.check_receipts_multiple.assert_not_called()

        assert result["checked"] == 0
        assert PushTicket.objects.get(ticket_id="FRESH").status == PushTicket.Status.PENDING

    def test_successful_receipt_marks_ticket_ok(self):
        ticket = self._make_pending_ticket(ticket_id="WINNER", age_seconds=RECEIPT_READY_AFTER_SECONDS + 10)

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.check_receipts_multiple.return_value = [_fake_receipt("WINNER")]
            result = check_push_receipts()

        ticket.refresh_from_db()
        assert ticket.status == PushTicket.Status.OK
        assert ticket.checked_at is not None
        assert result == {"checked": 1, "ok": 1, "errors": 0, "deactivated": 0, "expired": 0}

    def test_device_not_registered_receipt_deactivates_device(self):
        """The whole point of the poller — APNs/FCM rejected the token after
        Expo accepted the ticket, so we mark the device inactive."""
        user = UserFactory()
        device = MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_1, platform="ios")
        ticket = self._make_pending_ticket(
            ticket_id="DEAD",
            age_seconds=RECEIPT_READY_AFTER_SECONDS + 10,
            user=user,
            token=VALID_EXPO_TOKEN_1,
        )

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.check_receipts_multiple.return_value = [
                _fake_receipt(
                    "DEAD",
                    status="error",
                    details={"error": "DeviceNotRegistered"},
                    message="Device not registered",
                )
            ]
            result = check_push_receipts()

        ticket.refresh_from_db()
        device.refresh_from_db()
        assert ticket.status == PushTicket.Status.ERROR
        assert ticket.error_code == "DeviceNotRegistered"
        assert device.is_active is False
        assert result["deactivated"] == 1

    def test_other_error_records_but_does_not_deactivate(self):
        """A MessageRateExceeded error is informational — the token is still
        valid, we just need to back off."""
        user = UserFactory()
        device = MobileDevice.objects.create(user=user, push_token=VALID_EXPO_TOKEN_1, platform="ios")
        ticket = self._make_pending_ticket(
            ticket_id="THROTTLED",
            age_seconds=RECEIPT_READY_AFTER_SECONDS + 10,
            user=user,
            token=VALID_EXPO_TOKEN_1,
        )

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.check_receipts_multiple.return_value = [
                _fake_receipt(
                    "THROTTLED",
                    status="error",
                    details={"error": "MessageRateExceeded"},
                    message="Rate limit hit",
                )
            ]
            result = check_push_receipts()

        ticket.refresh_from_db()
        device.refresh_from_db()
        assert ticket.status == PushTicket.Status.ERROR
        assert ticket.error_code == "MessageRateExceeded"
        assert device.is_active is True
        assert result["deactivated"] == 0

    def test_tickets_older_than_24h_are_marked_expired(self):
        """Stop polling tickets Expo no longer keeps."""
        ticket = self._make_pending_ticket(
            ticket_id="ANCIENT",
            age_seconds=RECEIPT_TTL_SECONDS + 60,
        )

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            result = check_push_receipts()
            # Expired tickets should never be sent to Expo.
            PushClientMock.return_value.check_receipts_multiple.assert_not_called()

        ticket.refresh_from_db()
        assert ticket.status == PushTicket.Status.EXPIRED
        assert result["expired"] == 1
        assert result["checked"] == 0

    def test_expo_request_failure_leaves_tickets_pending(self):
        """A network blip should not flip ticket status — let the next tick
        retry."""
        ticket = self._make_pending_ticket(
            ticket_id="UNRESOLVED",
            age_seconds=RECEIPT_READY_AFTER_SECONDS + 10,
        )

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.check_receipts_multiple.side_effect = Exception("expo down")
            result = check_push_receipts()

        ticket.refresh_from_db()
        assert ticket.status == PushTicket.Status.PENDING
        assert result == {"checked": 0, "ok": 0, "errors": 0, "deactivated": 0, "expired": 0}

    def test_missing_receipt_marks_ticket_expired(self):
        """If Expo returns no receipt for a ticket id we asked about, we treat
        it as expired and stop chasing."""
        ticket = self._make_pending_ticket(
            ticket_id="GHOST",
            age_seconds=RECEIPT_READY_AFTER_SECONDS + 10,
        )

        with mock.patch("exponent_server_sdk.PushClient") as PushClientMock:
            PushClientMock.return_value.check_receipts_multiple.return_value = []
            result = check_push_receipts()

        ticket.refresh_from_db()
        assert ticket.status == PushTicket.Status.EXPIRED
        assert ticket.error_code == "receipt_not_found"
        # 'errors' counter intentionally counts every non-ok update including
        # the not-found-then-expired transition, so 'expired' here is 0
        # (aged_count is what populates 'expired' in the summary).
        assert result["checked"] == 1
        assert result["ok"] == 0
