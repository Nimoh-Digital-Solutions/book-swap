"""Tests for the exchanges API — Epic 5 Phase 2."""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.exchanges.models import (
    ConditionsAcceptance,
    DeclineReason,
    ExchangeRequest,
    ExchangeStatus,
    VALID_TRANSITIONS,
)
from bookswap.models import BookStatus
from bookswap.tests.factories import BookFactory, UserFactory

from .factories import ConditionsAcceptanceFactory, ExchangeRequestFactory

pytestmark = pytest.mark.django_db


# ── Helpers ───────────────────────────────────────────────────────────────────


def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def exchange_url(pk=None, action=None):
    """Build exchange URL. Uses router-generated names."""
    if pk and action:
        return reverse(f'exchanges:exchange-{action}', kwargs={'pk': pk})
    if pk:
        return reverse('exchanges:exchange-detail', kwargs={'pk': pk})
    return reverse('exchanges:exchange-list')


# ══════════════════════════════════════════════════════════════════════════════
# Model Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestExchangeRequestModel:
    def test_valid_transitions(self):
        assert ExchangeStatus.ACCEPTED in VALID_TRANSITIONS[ExchangeStatus.PENDING]
        assert VALID_TRANSITIONS[ExchangeStatus.COMPLETED] == []

    def test_can_transition_to(self):
        exchange = ExchangeRequestFactory.build(status=ExchangeStatus.PENDING)
        assert exchange.can_transition_to(ExchangeStatus.ACCEPTED) is True
        assert exchange.can_transition_to(ExchangeStatus.ACTIVE) is False

    def test_transition_to_raises_on_invalid(self):
        exchange = ExchangeRequestFactory.build(status=ExchangeStatus.PENDING)
        with pytest.raises(ValueError, match='Cannot transition'):
            exchange.transition_to(ExchangeStatus.ACTIVE)

    def test_transition_to_success(self):
        exchange = ExchangeRequestFactory.build(status=ExchangeStatus.PENDING)
        exchange.transition_to(ExchangeStatus.ACCEPTED)
        assert exchange.status == ExchangeStatus.ACCEPTED

    def test_is_swap_confirmed(self):
        from django.utils import timezone
        exchange = ExchangeRequestFactory.build(
            requester_confirmed_at=timezone.now(),
            owner_confirmed_at=timezone.now(),
        )
        assert exchange.is_swap_confirmed is True

    def test_is_swap_not_confirmed(self):
        exchange = ExchangeRequestFactory.build()
        assert exchange.is_swap_confirmed is False

    def test_both_conditions_accepted(self):
        exchange = ExchangeRequestFactory(accepted=True)
        ConditionsAcceptanceFactory(exchange=exchange, user=exchange.requester)
        ConditionsAcceptanceFactory(exchange=exchange, user=exchange.owner)
        assert exchange.both_conditions_accepted() is True

    def test_conditions_not_fully_accepted(self):
        exchange = ExchangeRequestFactory(accepted=True)
        ConditionsAcceptanceFactory(exchange=exchange, user=exchange.requester)
        assert exchange.both_conditions_accepted() is False


# ══════════════════════════════════════════════════════════════════════════════
# Create Exchange (US-501)
# ══════════════════════════════════════════════════════════════════════════════


class TestCreateExchange:
    def test_create_exchange_success(self):
        owner = UserFactory(with_location=True, onboarded=True)
        requester = UserFactory(with_location=True, onboarded=True)
        requested_book = BookFactory(owner=owner)
        offered_book = BookFactory(owner=requester)

        client = api_client(requester)
        response = client.post(exchange_url(), {
            'requested_book_id': str(requested_book.pk),
            'offered_book_id': str(offered_book.pk),
            'message': 'Great book!',
        })

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['status'] == 'pending'
        assert data['message'] == 'Great book!'
        assert data['requester']['id'] == str(requester.pk)
        assert data['owner']['id'] == str(owner.pk)

    def test_cannot_request_own_book(self):
        user = UserFactory(with_location=True, onboarded=True)
        book = BookFactory(owner=user)
        offered = BookFactory(owner=user)

        client = api_client(user)
        response = client.post(exchange_url(), {
            'requested_book_id': str(book.pk),
            'offered_book_id': str(offered.pk),
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_offer_someone_elses_book(self):
        owner = UserFactory(with_location=True, onboarded=True)
        requester = UserFactory(with_location=True, onboarded=True)
        other = UserFactory(with_location=True, onboarded=True)
        requested_book = BookFactory(owner=owner)
        not_my_book = BookFactory(owner=other)

        client = api_client(requester)
        response = client.post(exchange_url(), {
            'requested_book_id': str(requested_book.pk),
            'offered_book_id': str(not_my_book.pk),
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_request_unavailable_book(self):
        owner = UserFactory(with_location=True, onboarded=True)
        requester = UserFactory(with_location=True, onboarded=True)
        unavailable = BookFactory(owner=owner, in_exchange=True)
        offered = BookFactory(owner=requester)

        client = api_client(requester)
        response = client.post(exchange_url(), {
            'requested_book_id': str(unavailable.pk),
            'offered_book_id': str(offered.pk),
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_pending_request_rejected(self):
        exchange = ExchangeRequestFactory()
        new_offered = BookFactory(owner=exchange.requester)

        client = api_client(exchange.requester)
        response = client.post(exchange_url(), {
            'requested_book_id': str(exchange.requested_book.pk),
            'offered_book_id': str(new_offered.pk),
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_cannot_create(self):
        client = APIClient()
        response = client.post(exchange_url(), {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
# List & Detail
# ══════════════════════════════════════════════════════════════════════════════


class TestListExchanges:
    def test_list_shows_sent_and_received(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.get(exchange_url())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 1

    def test_list_excludes_other_users(self):
        ExchangeRequestFactory()
        other = UserFactory()
        client = api_client(other)
        response = client.get(exchange_url())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 0

    def test_detail_as_participant(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.get(exchange_url(pk=exchange.pk))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['id'] == str(exchange.pk)

    def test_detail_as_non_participant_denied(self):
        exchange = ExchangeRequestFactory()
        other = UserFactory()
        client = api_client(other)
        response = client.get(exchange_url(pk=exchange.pk))
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ══════════════════════════════════════════════════════════════════════════════
# Accept (US-502)
# ══════════════════════════════════════════════════════════════════════════════


class TestAcceptExchange:
    def test_owner_accepts_pending(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.post(exchange_url(pk=exchange.pk, action='accept'))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'accepted'

    def test_auto_decline_other_pending(self):
        owner = UserFactory(with_location=True, onboarded=True)
        book = BookFactory(owner=owner)
        e1 = ExchangeRequestFactory(owner=owner, requested_book=book)
        e2 = ExchangeRequestFactory(owner=owner, requested_book=book)

        client = api_client(owner)
        client.post(exchange_url(pk=e1.pk, action='accept'))

        e2.refresh_from_db()
        assert e2.status == ExchangeStatus.DECLINED
        assert e2.decline_reason == DeclineReason.RESERVED

    def test_requester_cannot_accept(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.post(exchange_url(pk=exchange.pk, action='accept'))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_accept_non_pending(self):
        exchange = ExchangeRequestFactory(accepted=True)
        client = api_client(exchange.owner)
        response = client.post(exchange_url(pk=exchange.pk, action='accept'))
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
# Decline (US-502)
# ══════════════════════════════════════════════════════════════════════════════


class TestDeclineExchange:
    def test_owner_declines_with_reason(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.post(
            exchange_url(pk=exchange.pk, action='decline'),
            {'reason': 'not_interested'},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'declined'
        assert response.json()['decline_reason'] == 'not_interested'

    def test_decline_without_reason(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.post(exchange_url(pk=exchange.pk, action='decline'))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'declined'

    def test_requester_cannot_decline(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.post(exchange_url(pk=exchange.pk, action='decline'))
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
# Counter-propose (US-502)
# ══════════════════════════════════════════════════════════════════════════════


class TestCounterPropose:
    def test_counter_creates_new_exchange(self):
        exchange = ExchangeRequestFactory()
        alt_book = BookFactory(owner=exchange.requester)

        client = api_client(exchange.owner)
        response = client.post(
            exchange_url(pk=exchange.pk, action='counter'),
            {'offered_book_id': str(alt_book.pk)},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['counter_to'] == str(exchange.pk)
        assert data['status'] == 'pending'

        exchange.refresh_from_db()
        assert exchange.status == ExchangeStatus.DECLINED
        assert exchange.decline_reason == DeclineReason.COUNTER_PROPOSED

    def test_counter_must_pick_different_book(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.post(
            exchange_url(pk=exchange.pk, action='counter'),
            {'offered_book_id': str(exchange.offered_book.pk)},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
# Cancel (US-501)
# ══════════════════════════════════════════════════════════════════════════════


class TestCancelExchange:
    def test_requester_cancels(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.post(exchange_url(pk=exchange.pk, action='cancel'))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'cancelled'

    def test_owner_cannot_cancel(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.post(exchange_url(pk=exchange.pk, action='cancel'))
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
# Accept Conditions (US-503)
# ══════════════════════════════════════════════════════════════════════════════


class TestAcceptConditions:
    def test_first_acceptance_transitions_to_conditions_pending(self):
        exchange = ExchangeRequestFactory(accepted=True)
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='accept-conditions'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'conditions_pending'
        assert response.json()['conditions_accepted_count'] == 1

    def test_both_acceptances_transitions_to_active(self):
        exchange = ExchangeRequestFactory(accepted=True)
        # First user accepts
        api_client(exchange.requester).post(
            exchange_url(pk=exchange.pk, action='accept-conditions'),
        )
        # Second user accepts
        response = api_client(exchange.owner).post(
            exchange_url(pk=exchange.pk, action='accept-conditions'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'active'
        assert response.json()['conditions_accepted_count'] == 2

    def test_cannot_accept_conditions_twice(self):
        exchange = ExchangeRequestFactory(accepted=True)
        client = api_client(exchange.requester)
        client.post(exchange_url(pk=exchange.pk, action='accept-conditions'))
        response = client.post(
            exchange_url(pk=exchange.pk, action='accept-conditions'),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_accept_conditions_on_pending(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='accept-conditions'),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_conditions_endpoint_returns_status(self):
        exchange = ExchangeRequestFactory(accepted=True)
        ConditionsAcceptanceFactory(exchange=exchange, user=exchange.requester)
        client = api_client(exchange.owner)
        response = client.get(
            exchange_url(pk=exchange.pk, action='conditions'),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['conditions_version'] == '1.0'
        assert len(data['acceptances']) == 1
        assert data['both_accepted'] is False


# ══════════════════════════════════════════════════════════════════════════════
# Confirm Swap (US-504)
# ══════════════════════════════════════════════════════════════════════════════


class TestConfirmSwap:
    def test_first_confirmation(self):
        exchange = ExchangeRequestFactory(active=True)
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='confirm-swap'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'active'
        assert response.json()['requester_confirmed_at'] is not None

    def test_both_confirmations_transitions_to_swap_confirmed(self):
        exchange = ExchangeRequestFactory(active=True)
        api_client(exchange.requester).post(
            exchange_url(pk=exchange.pk, action='confirm-swap'),
        )
        response = api_client(exchange.owner).post(
            exchange_url(pk=exchange.pk, action='confirm-swap'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'swap_confirmed'

        # Books should now be in_exchange
        exchange.requested_book.refresh_from_db()
        exchange.offered_book.refresh_from_db()
        assert exchange.requested_book.status == BookStatus.IN_EXCHANGE
        assert exchange.offered_book.status == BookStatus.IN_EXCHANGE

        # Swap count incremented
        exchange.requester.refresh_from_db()
        exchange.owner.refresh_from_db()
        assert exchange.requester.swap_count == 1
        assert exchange.owner.swap_count == 1

    def test_cannot_confirm_swap_twice(self):
        exchange = ExchangeRequestFactory(active=True)
        client = api_client(exchange.requester)
        client.post(exchange_url(pk=exchange.pk, action='confirm-swap'))
        response = client.post(
            exchange_url(pk=exchange.pk, action='confirm-swap'),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_confirm_swap_on_non_active(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='confirm-swap'),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
# Return Flow (US-505)
# ══════════════════════════════════════════════════════════════════════════════


class TestReturnFlow:
    def test_request_return(self):
        exchange = ExchangeRequestFactory(swap_confirmed=True)
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='request-return'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'return_requested'
        assert response.json()['return_requested_at'] is not None

    def test_both_confirm_return(self):
        exchange = ExchangeRequestFactory(return_requested=True)
        # Set books to in_exchange for the return test
        exchange.requested_book.status = BookStatus.IN_EXCHANGE
        exchange.requested_book.save(update_fields=['status'])
        exchange.offered_book.status = BookStatus.IN_EXCHANGE
        exchange.offered_book.save(update_fields=['status'])

        api_client(exchange.requester).post(
            exchange_url(pk=exchange.pk, action='confirm-return'),
        )
        response = api_client(exchange.owner).post(
            exchange_url(pk=exchange.pk, action='confirm-return'),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'returned'

        # Books back to available
        exchange.requested_book.refresh_from_db()
        exchange.offered_book.refresh_from_db()
        assert exchange.requested_book.status == BookStatus.AVAILABLE
        assert exchange.offered_book.status == BookStatus.AVAILABLE

    def test_cannot_request_return_on_non_confirmed(self):
        exchange = ExchangeRequestFactory(active=True)
        client = api_client(exchange.requester)
        response = client.post(
            exchange_url(pk=exchange.pk, action='request-return'),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
# Incoming Requests (US-502)
# ══════════════════════════════════════════════════════════════════════════════


class TestIncomingRequests:
    def test_incoming_shows_pending_as_owner(self):
        exchange = ExchangeRequestFactory()
        client = api_client(exchange.owner)
        response = client.get(reverse('exchanges:exchange-incoming'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 1

    def test_incoming_excludes_non_pending(self):
        exchange = ExchangeRequestFactory(accepted=True)
        client = api_client(exchange.owner)
        response = client.get(reverse('exchanges:exchange-incoming'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 0

    def test_incoming_count(self):
        exchange = ExchangeRequestFactory()
        ExchangeRequestFactory(
            owner=exchange.owner,
            requested_book=BookFactory(owner=exchange.owner),
        )
        client = api_client(exchange.owner)
        response = client.get(reverse('exchanges:exchange-incoming-count'))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['count'] == 2


# ══════════════════════════════════════════════════════════════════════════════
# Celery Tasks
# ══════════════════════════════════════════════════════════════════════════════


class TestCeleryTasks:
    def test_expire_stale_requests(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.exchanges.tasks import expire_stale_requests

        exchange = ExchangeRequestFactory()
        # Backdate creation
        ExchangeRequest.objects.filter(pk=exchange.pk).update(
            created_at=timezone.now() - timedelta(days=15),
        )

        count = expire_stale_requests()
        assert count == 1

        exchange.refresh_from_db()
        assert exchange.status == ExchangeStatus.EXPIRED
        assert exchange.expired_at is not None

    def test_expire_stale_conditions(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.exchanges.tasks import expire_stale_conditions

        exchange = ExchangeRequestFactory(accepted=True)
        ExchangeRequest.objects.filter(pk=exchange.pk).update(
            updated_at=timezone.now() - timedelta(days=15),
        )

        count = expire_stale_conditions()
        assert count == 1

        exchange.refresh_from_db()
        assert exchange.status == ExchangeStatus.EXPIRED
