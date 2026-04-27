"""Tests for MobileDeviceSerializer validation (SEC-010)."""

import pytest
from rest_framework.test import APIRequestFactory

from apps.notifications.models import MobileDevice
from apps.notifications.serializers import MobileDeviceSerializer
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

VALID_EXPO_TOKEN = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
VALID_APNS_TOKEN = "a" * 64
VALID_FCM_TOKEN = "a" * 150


def _make_context(user):
    factory = APIRequestFactory()
    request = factory.post("/fake/")
    request.user = user
    return {"request": request}


class TestPushTokenValidation:
    def test_valid_expo_token(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": VALID_EXPO_TOKEN, "platform": "ios"},
            context=_make_context(user),
        )
        assert s.is_valid(), s.errors

    def test_valid_apns_token(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": VALID_APNS_TOKEN, "platform": "ios"},
            context=_make_context(user),
        )
        assert s.is_valid(), s.errors

    def test_valid_fcm_token(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": VALID_FCM_TOKEN, "platform": "android"},
            context=_make_context(user),
        )
        assert s.is_valid(), s.errors

    def test_empty_token_rejected(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": "   ", "platform": "ios"},
            context=_make_context(user),
        )
        assert not s.is_valid()
        assert "push_token" in s.errors

    def test_too_long_token_rejected(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": "x" * 300, "platform": "ios"},
            context=_make_context(user),
        )
        assert not s.is_valid()

    def test_invalid_format_rejected(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": "not-a-valid-token", "platform": "ios"},
            context=_make_context(user),
        )
        assert not s.is_valid()
        assert "push_token" in s.errors


class TestDeviceLimitValidation:
    def test_max_devices_enforced(self):
        user = UserFactory()
        for i in range(10):
            MobileDevice.objects.create(
                user=user,
                push_token=f"ExponentPushToken[device{i:020d}]",
                platform="ios",
                is_active=True,
            )

        s = MobileDeviceSerializer(
            data={"push_token": "ExponentPushToken[newdevicetoken12345]", "platform": "ios"},
            context=_make_context(user),
        )
        assert not s.is_valid()
        assert "non_field_errors" in s.errors

    def test_existing_token_update_allowed_at_limit(self):
        user = UserFactory()
        existing_token = "ExponentPushToken[existingdevice00000]"
        for i in range(9):
            MobileDevice.objects.create(
                user=user,
                push_token=f"ExponentPushToken[device{i:020d}]",
                platform="ios",
                is_active=True,
            )
        existing_device = MobileDevice.objects.create(
            user=user,
            push_token=existing_token,
            platform="ios",
            is_active=True,
        )

        s = MobileDeviceSerializer(
            instance=existing_device,
            data={"push_token": existing_token, "platform": "ios"},
            context=_make_context(user),
        )
        assert s.is_valid(), s.errors

    def test_under_limit_allowed(self):
        user = UserFactory()
        s = MobileDeviceSerializer(
            data={"push_token": VALID_EXPO_TOKEN, "platform": "ios"},
            context=_make_context(user),
        )
        assert s.is_valid(), s.errors
