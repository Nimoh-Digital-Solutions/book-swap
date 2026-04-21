"""Security regression test: ADV-101 — Apple Sign-In email spoofing.

Before the fix, when Apple omitted the email claim from the identity token,
the backend fell back to reading email from the unsigned client-supplied
request.data["user"]["email"]. An attacker with a valid Apple identity token
(their own sub) could supply a victim's email, causing the backend to look up
the victim user by email and bind the attacker's Apple sub to the victim's
account.

The fix rejects Apple tokens that lack a verified email in the signed claims,
matching the pattern used by GoogleMobileAuthView.

If this test fails, the account-takeover vulnerability has been re-introduced.
Do NOT delete or skip this test.
"""

from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

APPLE_AUTH_URL = "/api/v1/auth/social/apple-mobile/"

MOCK_APPLE_KEYS = {"mock-kid": MagicMock()}


def _mock_jwt_decode(token, key, **kwargs):
    """Return claims embedded in test fixtures based on token string."""
    if token == "token-with-email":
        return {
            "sub": "apple-attacker-sub-001",
            "email": "attacker@real-apple.com",
            "email_verified": True,
            "iss": "https://appleid.apple.com",
            "aud": "com.bookswap.app",
        }
    if token == "token-without-email":
        return {
            "sub": "apple-attacker-sub-002",
            "iss": "https://appleid.apple.com",
            "aud": "com.bookswap.app",
        }
    if token == "token-email-unverified":
        return {
            "sub": "apple-attacker-sub-003",
            "email": "someone@apple.com",
            "email_verified": False,
            "iss": "https://appleid.apple.com",
            "aud": "com.bookswap.app",
        }
    if token == "token-existing-sub":
        return {
            "sub": "existing-apple-sub",
            "email": "existing@bookswap.test",
            "email_verified": True,
            "iss": "https://appleid.apple.com",
            "aud": "com.bookswap.app",
        }
    return {}


def _mock_get_unverified_header(token):
    return {"kid": "mock-kid", "alg": "RS256"}


@pytest.fixture()
def _patch_apple_auth():
    """Patch JWT verification + Apple public keys so we control claims."""
    with (
        patch("jwt.decode", side_effect=_mock_jwt_decode),
        patch("jwt.get_unverified_header", side_effect=_mock_get_unverified_header),
        patch(
            "bookswap.views.AppleMobileAuthView._get_apple_public_keys",
            return_value=MOCK_APPLE_KEYS,
        ),
        patch(
            "django.conf.settings.SOCIAL_AUTH_APPLE_ID_CLIENT",
            "com.bookswap.app",
            create=True,
        ),
    ):
        yield


@pytest.mark.usefixtures("_patch_apple_auth")
class TestADV101AppleEmailSpoofing:
    """ADV-101: Apple Sign-In must not trust unsigned client-supplied email."""

    def test_token_without_email_rejected(self):
        """Apple token missing email claim returns 400, not a user lookup."""
        victim = UserFactory(email="victim@bookswap.test")
        client = APIClient()

        response = client.post(
            APPLE_AUTH_URL,
            {
                "identity_token": "token-without-email",
                "user": {"email": "victim@bookswap.test"},
            },
            format="json",
        )

        assert response.status_code == 400
        assert "verified email" in response.data["detail"].lower()
        victim.refresh_from_db()
        assert (
            not hasattr(victim, "social_auth")
            or not victim.social_auth.filter(provider="apple-id", uid="apple-attacker-sub-002").exists()
        )

    def test_token_with_unverified_email_rejected(self):
        """Apple token with email_verified=false returns 400."""
        client = APIClient()

        response = client.post(
            APPLE_AUTH_URL,
            {"identity_token": "token-email-unverified"},
            format="json",
        )

        assert response.status_code == 400
        assert "verified email" in response.data["detail"].lower()

    def test_token_with_verified_email_succeeds(self):
        """Apple token with verified email in claims creates/links user."""
        client = APIClient()

        response = client.post(
            APPLE_AUTH_URL,
            {
                "identity_token": "token-with-email",
                "user": {"first_name": "Test", "last_name": "User"},
            },
            format="json",
        )

        assert response.status_code == 200
        assert "access_token" in response.data

    def test_existing_social_link_still_works(self):
        """Users with existing Apple social auth can still sign in via sub."""
        from social_django.models import UserSocialAuth

        user = UserFactory(email="existing@bookswap.test")
        UserSocialAuth.objects.create(user=user, provider="apple-id", uid="existing-apple-sub")
        client = APIClient()

        response = client.post(
            APPLE_AUTH_URL,
            {"identity_token": "token-existing-sub"},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["user"]["email"] == "existing@bookswap.test"

    def test_spoofed_email_in_body_ignored_when_token_has_no_email(self):
        """The core ADV-101 attack: spoofed email in body must be ignored."""
        victim = UserFactory(email="ceo@company.com")
        client = APIClient()

        response = client.post(
            APPLE_AUTH_URL,
            {
                "identity_token": "token-without-email",
                "user": {"email": "ceo@company.com"},
            },
            format="json",
        )

        assert response.status_code == 400
        from social_django.models import UserSocialAuth

        assert not UserSocialAuth.objects.filter(user=victim, provider="apple-id").exists()
