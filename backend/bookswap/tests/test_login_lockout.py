"""Tests for US-104 AC4 — login rate limiting and account lockout.

Verifies:
- Account locks after 5 consecutive failed login attempts
- Locked accounts receive HTTP 423 (not generic 400)
- Successful login resets the failed attempt counter
- Lockout expires after the configured duration (15 min)
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from bookswap.tests.factories import UserFactory

LOGIN_URL = "/api/v1/auth/login/"


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def user(db):
    u = UserFactory(email="locktest@bookswap.test", username="locktest")
    u.set_password("testpass123")
    u.save()
    return u


@pytest.mark.django_db
class TestLoginLockout:
    """US-104 AC4: After 5 failed attempts → temporary lockout with message."""

    def _login(self, client, email_or_username, password):
        return client.post(
            LOGIN_URL,
            {"email_or_username": email_or_username, "password": password},
            format="json",
        )

    def test_successful_login_returns_200(self, api_client, user):
        resp = self._login(api_client, "locktest@bookswap.test", "testpass123")
        assert resp.status_code == 200
        assert "access_token" in resp.data

    def test_failed_login_returns_400(self, api_client, user):
        resp = self._login(api_client, "locktest@bookswap.test", "wrongpass")
        assert resp.status_code == 400

    def test_failed_attempts_increment(self, api_client, user):
        for _ in range(3):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")
        user.refresh_from_db()
        assert user.failed_login_attempts == 3

    def test_account_locks_after_5_failed_attempts(self, api_client, user):
        for _ in range(5):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")

        user.refresh_from_db()
        assert user.is_account_locked()
        assert user.locked_until is not None

    def test_locked_account_returns_423(self, api_client, user):
        # Lock the account via failed attempts
        for _ in range(5):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")

        # Next attempt should get 423
        resp = self._login(api_client, "locktest@bookswap.test", "testpass123")
        assert resp.status_code == 423
        assert "locked" in resp.data["detail"].lower()

    def test_locked_account_returns_423_via_username(self, api_client, user):
        for _ in range(5):
            self._login(api_client, "locktest", "wrongpass")

        resp = self._login(api_client, "locktest", "testpass123")
        assert resp.status_code == 423

    def test_lock_duration_is_15_minutes(self, api_client, user):
        for _ in range(5):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")

        user.refresh_from_db()
        expected_unlock = timezone.now() + timedelta(minutes=15)
        # Allow 30 seconds tolerance
        assert abs((user.locked_until - expected_unlock).total_seconds()) < 30

    def test_lockout_expires_and_login_succeeds(self, api_client, user):
        for _ in range(5):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")

        # Simulate lockout expired (set locked_until in the past)
        user.locked_until = timezone.now() - timedelta(minutes=1)
        user.failed_login_attempts = 0
        user.save(update_fields=["locked_until", "failed_login_attempts"])

        resp = self._login(api_client, "locktest@bookswap.test", "testpass123")
        assert resp.status_code == 200

    def test_successful_login_resets_counter(self, api_client, user):
        # Accumulate some failed attempts (not enough to lock)
        for _ in range(3):
            self._login(api_client, "locktest@bookswap.test", "wrongpass")
        user.refresh_from_db()
        assert user.failed_login_attempts == 3

        # Successful login should reset
        resp = self._login(api_client, "locktest@bookswap.test", "testpass123")
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.failed_login_attempts == 0

    def test_nonexistent_user_returns_400_no_423(self, api_client, db):
        """Login with nonexistent user should return 400, not 423 or 500."""
        resp = self._login(api_client, "noone@example.com", "wrongpass")
        assert resp.status_code == 400
