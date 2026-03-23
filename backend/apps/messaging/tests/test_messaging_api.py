"""Tests for the messaging API — Epic 6 Phase 2."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.exchanges.tests.factories import ExchangeRequestFactory
from apps.messaging.models import Message
from bookswap.tests.factories import UserFactory

from .factories import MeetupLocationFactory, MessageFactory

pytestmark = pytest.mark.django_db


# ── Helpers ───────────────────────────────────────────────────────────────────


def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def messages_url(exchange_id):
    return reverse("messaging:message-list", kwargs={"exchange_id": exchange_id})


def mark_read_url(exchange_id):
    return reverse("messaging:message-mark-read", kwargs={"exchange_id": exchange_id})


def meetup_url(exchange_id):
    return reverse("messaging:meetup-suggestions", kwargs={"exchange_id": exchange_id})


# ══════════════════════════════════════════════════════════════════════════════
# Message List Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestMessageList:
    def test_list_messages_for_active_exchange(self):
        exchange = ExchangeRequestFactory(active=True)
        MessageFactory(exchange=exchange, sender=exchange.requester, content="Hello!")
        MessageFactory(exchange=exchange, sender=exchange.owner, content="Hi there!")

        response = api_client(exchange.requester).get(messages_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        results = response.data if isinstance(response.data, list) else response.data.get("results", response.data)
        assert len(results) == 2
        assert results[0]["content"] == "Hello!"
        assert results[1]["content"] == "Hi there!"

    def test_list_messages_unauthenticated(self):
        exchange = ExchangeRequestFactory(active=True)
        response = APIClient().get(messages_url(exchange.id))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_messages_non_participant(self):
        exchange = ExchangeRequestFactory(active=True)
        outsider = UserFactory(onboarded=True)
        response = api_client(outsider).get(messages_url(exchange.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_messages_pending_exchange(self):
        exchange = ExchangeRequestFactory()  # status=pending
        response = api_client(exchange.requester).get(messages_url(exchange.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_messages_swap_confirmed(self):
        exchange = ExchangeRequestFactory(swap_confirmed=True)
        response = api_client(exchange.requester).get(messages_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK

    def test_list_messages_nonexistent_exchange(self):
        import uuid

        response = api_client(UserFactory(onboarded=True)).get(messages_url(uuid.uuid4()))
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ══════════════════════════════════════════════════════════════════════════════
# Message Create Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestMessageCreate:
    def test_send_message_active_exchange(self):
        exchange = ExchangeRequestFactory(active=True)
        response = api_client(exchange.requester).post(
            messages_url(exchange.id),
            {"content": "Want to meet at the library?"},
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["content"] == "Want to meet at the library?"
        assert Message.objects.filter(exchange=exchange).count() == 1

    def test_send_message_swap_confirmed(self):
        exchange = ExchangeRequestFactory(swap_confirmed=True)
        response = api_client(exchange.owner).post(
            messages_url(exchange.id),
            {"content": "Thanks for the swap!"},
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_send_message_pending_exchange(self):
        exchange = ExchangeRequestFactory()
        response = api_client(exchange.requester).post(
            messages_url(exchange.id),
            {"content": "Hello"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_send_message_non_participant(self):
        exchange = ExchangeRequestFactory(active=True)
        outsider = UserFactory(onboarded=True)
        response = api_client(outsider).post(
            messages_url(exchange.id),
            {"content": "Hello"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_send_empty_message(self):
        exchange = ExchangeRequestFactory(active=True)
        response = api_client(exchange.requester).post(
            messages_url(exchange.id),
            {"content": ""},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_send_message_too_long(self):
        exchange = ExchangeRequestFactory(active=True)
        response = api_client(exchange.requester).post(
            messages_url(exchange.id),
            {"content": "a" * 1001},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_send_message_unauthenticated(self):
        exchange = ExchangeRequestFactory(active=True)
        response = APIClient().post(
            messages_url(exchange.id),
            {"content": "Hello"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
# Mark Read Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestMarkRead:
    def test_mark_read(self):
        exchange = ExchangeRequestFactory(active=True)
        MessageFactory(exchange=exchange, sender=exchange.requester, content="Hey")
        MessageFactory(exchange=exchange, sender=exchange.requester, content="You there?")

        # Owner marks messages as read.
        response = api_client(exchange.owner).post(mark_read_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["marked_read"] == 2

        # Verify in DB.
        assert (
            Message.objects.filter(
                exchange=exchange,
                read_at__isnull=False,
            ).count()
            == 2
        )

    def test_mark_read_does_not_mark_own_messages(self):
        exchange = ExchangeRequestFactory(active=True)
        MessageFactory(exchange=exchange, sender=exchange.requester, content="Mine")

        # Requester tries to mark own messages — should mark 0.
        response = api_client(exchange.requester).post(mark_read_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["marked_read"] == 0

    def test_mark_read_non_participant(self):
        exchange = ExchangeRequestFactory(active=True)
        outsider = UserFactory(onboarded=True)
        response = api_client(outsider).post(mark_read_url(exchange.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
# Meetup Suggestion Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestMeetupSuggestions:
    def test_list_suggestions_active_exchange(self):
        exchange = ExchangeRequestFactory(active=True)
        MeetupLocationFactory(name="OBA Oosterdok")
        MeetupLocationFactory(name="Vondelpark", category="park")

        response = api_client(exchange.requester).get(meetup_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_list_suggestions_has_distance(self):
        exchange = ExchangeRequestFactory(active=True)
        MeetupLocationFactory(name="Nearby Library")

        response = api_client(exchange.requester).get(meetup_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        location = response.data[0]
        assert "latitude" in location
        assert "longitude" in location

    def test_list_suggestions_pending_exchange(self):
        exchange = ExchangeRequestFactory()
        response = api_client(exchange.requester).get(meetup_url(exchange.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_suggestions_non_participant(self):
        exchange = ExchangeRequestFactory(active=True)
        outsider = UserFactory(onboarded=True)
        response = api_client(outsider).get(meetup_url(exchange.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_max_10_results(self):
        exchange = ExchangeRequestFactory(active=True)
        for i in range(15):
            MeetupLocationFactory(name=f"Location {i}")

        response = api_client(exchange.requester).get(meetup_url(exchange.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) <= 10


# ══════════════════════════════════════════════════════════════════════════════
# Message Model Tests
# ══════════════════════════════════════════════════════════════════════════════


class TestMessageModel:
    def test_str_representation(self):
        msg = MessageFactory.build(content="Hello world")
        assert "Hello world" in str(msg)

    def test_clean_requires_content_or_image(self):
        from django.core.exceptions import ValidationError

        msg = MessageFactory.build(content="", image=None)
        with pytest.raises(ValidationError):
            msg.clean()

    def test_clean_content_too_long(self):
        from django.core.exceptions import ValidationError

        msg = MessageFactory.build(content="a" * 1001)
        with pytest.raises(ValidationError):
            msg.clean()

    def test_ordering_by_created_at(self):
        exchange = ExchangeRequestFactory(active=True)
        m1 = MessageFactory(exchange=exchange, sender=exchange.requester, content="First")
        m2 = MessageFactory(exchange=exchange, sender=exchange.owner, content="Second")

        messages = list(Message.objects.filter(exchange=exchange))
        assert messages[0].id == m1.id
        assert messages[1].id == m2.id
