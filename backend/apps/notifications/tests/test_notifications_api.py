"""
Tests for the notifications REST API — Epic 9 (US-901 / US-902).

Endpoints under test:
  GET  /api/v1/notifications/
  POST /api/v1/notifications/{id}/read/
  POST /api/v1/notifications/mark-all-read/
  GET  /api/v1/notifications/preferences/
  PATCH /api/v1/notifications/preferences/
  GET  /api/v1/notifications/unsubscribe/{token}/
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.notifications.models import Notification, NotificationPreferences
from bookswap.tests.factories import UserFactory

from .factories import NotificationFactory, NotificationPreferencesFactory

LIST_URL = '/api/v1/notifications/'
MARK_ALL_URL = '/api/v1/notifications/mark-all-read/'
PREFS_URL = '/api/v1/notifications/preferences/'


def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def mark_read_url(pk):
    return f'/api/v1/notifications/{pk}/read/'


def unsubscribe_url(token):
    return f'/api/v1/notifications/unsubscribe/{token}/'


# ---------------------------------------------------------------------------
# GET /api/v1/notifications/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestNotificationList:
    def test_returns_notifications_for_current_user(self):
        user = UserFactory()
        other = UserFactory()
        NotificationFactory.create_batch(3, user=user)
        NotificationFactory(user=other)  # should not appear

        resp = api_client(user).get(LIST_URL)

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert len(data['results']) == 3
        assert all(n['notification_type'] for n in data['results'])

    def test_unread_count_reflects_unread_only(self):
        user = UserFactory()
        NotificationFactory.create_batch(4, user=user)           # unread
        read = NotificationFactory(user=user)
        from django.utils import timezone
        Notification.objects.filter(pk=read.pk).update(read_at=timezone.now())

        resp = api_client(user).get(LIST_URL)

        assert resp.json()['unread_count'] == 4

    def test_unauthenticated_returns_401(self):
        resp = APIClient().get(LIST_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_at_most_50(self):
        user = UserFactory()
        NotificationFactory.create_batch(55, user=user)

        resp = api_client(user).get(LIST_URL)

        assert len(resp.json()['results']) == 50

    def test_empty_list_for_new_user(self):
        user = UserFactory()
        resp = api_client(user).get(LIST_URL)
        data = resp.json()
        assert data['results'] == []
        assert data['unread_count'] == 0


# ---------------------------------------------------------------------------
# POST /api/v1/notifications/{id}/read/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestMarkNotificationRead:
    def test_marks_own_notification_read(self):
        user = UserFactory()
        notif = NotificationFactory(user=user)
        assert notif.read_at is None

        resp = api_client(user).post(mark_read_url(notif.pk))

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['marked'] == 1
        notif.refresh_from_db()
        assert notif.read_at is not None

    def test_cannot_mark_other_users_notification(self):
        owner = UserFactory()
        attacker = UserFactory()
        notif = NotificationFactory(user=owner)

        resp = api_client(attacker).post(mark_read_url(notif.pk))

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['marked'] == 0  # no records matched
        notif.refresh_from_db()
        assert notif.read_at is None

    def test_marking_already_read_returns_zero(self):
        from django.utils import timezone
        user = UserFactory()
        notif = NotificationFactory(user=user)
        Notification.objects.filter(pk=notif.pk).update(read_at=timezone.now())

        resp = api_client(user).post(mark_read_url(notif.pk))

        assert resp.json()['marked'] == 0

    def test_unauthenticated_returns_401(self):
        user = UserFactory()
        notif = NotificationFactory(user=user)
        resp = APIClient().post(mark_read_url(notif.pk))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# POST /api/v1/notifications/mark-all-read/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestMarkAllRead:
    def test_marks_all_unread_for_current_user(self):
        user = UserFactory()
        other = UserFactory()
        NotificationFactory.create_batch(3, user=user)
        NotificationFactory.create_batch(2, user=other)  # must not be touched

        resp = api_client(user).post(MARK_ALL_URL)

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['marked'] == 3
        assert Notification.objects.filter(user=user, read_at__isnull=True).count() == 0
        # Other user's notifications untouched
        assert Notification.objects.filter(user=other, read_at__isnull=True).count() == 2

    def test_returns_zero_when_all_already_read(self):
        from django.utils import timezone
        user = UserFactory()
        notif = NotificationFactory(user=user)
        Notification.objects.filter(pk=notif.pk).update(read_at=timezone.now())

        resp = api_client(user).post(MARK_ALL_URL)
        assert resp.json()['marked'] == 0

    def test_unauthenticated_returns_401(self):
        resp = APIClient().post(MARK_ALL_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# GET + PATCH /api/v1/notifications/preferences/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestNotificationPreferences:
    def test_get_preferences_auto_creates_if_missing(self):
        user = UserFactory()
        assert not NotificationPreferences.objects.filter(user=user).exists()

        resp = api_client(user).get(PREFS_URL)

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        for field in (
            'email_new_request', 'email_request_accepted', 'email_request_declined',
            'email_new_message', 'email_exchange_completed', 'email_rating_received',
        ):
            assert data[field] is True  # defaults

    def test_patch_opt_out_one_email_type(self):
        user = UserFactory()
        NotificationPreferencesFactory(user=user)

        resp = api_client(user).patch(PREFS_URL, {'email_new_message': False}, format='json')

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()['email_new_message'] is False
        # Others unchanged
        assert resp.json()['email_new_request'] is True

    def test_patch_opt_out_all_email_types(self):
        user = UserFactory()
        payload = {
            'email_new_request': False,
            'email_request_accepted': False,
            'email_request_declined': False,
            'email_new_message': False,
            'email_exchange_completed': False,
            'email_rating_received': False,
        }
        resp = api_client(user).patch(PREFS_URL, payload, format='json')

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        for flag in payload:
            assert data[flag] is False

    def test_get_unauthenticated_returns_401(self):
        resp = APIClient().get(PREFS_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patch_unauthenticated_returns_401(self):
        resp = APIClient().patch(PREFS_URL, {'email_new_request': False}, format='json')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# GET /api/v1/notifications/unsubscribe/{token}/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUnsubscribe:
    def test_valid_token_disables_all_emails(self):
        user = UserFactory()
        prefs = NotificationPreferencesFactory(user=user)
        token = prefs.unsubscribe_token

        resp = APIClient().get(unsubscribe_url(token))

        assert resp.status_code == status.HTTP_200_OK
        prefs.refresh_from_db()
        for field in (
            'email_new_request', 'email_request_accepted', 'email_request_declined',
            'email_new_message', 'email_exchange_completed', 'email_rating_received',
        ):
            assert getattr(prefs, field) is False

    def test_invalid_token_returns_404(self):
        resp = APIClient().get(unsubscribe_url('not-a-real-token'))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_no_authentication_required(self):
        """Unsubscribe must work without a session or JWT cookie."""
        user = UserFactory()
        prefs = NotificationPreferencesFactory(user=user)
        resp = APIClient().get(unsubscribe_url(prefs.unsubscribe_token))
        assert resp.status_code == status.HTTP_200_OK

    def test_response_contains_confirmation_message(self):
        user = UserFactory()
        prefs = NotificationPreferencesFactory(user=user)
        resp = APIClient().get(unsubscribe_url(prefs.unsubscribe_token))
        assert 'unsubscribed' in resp.json()['detail'].lower()
