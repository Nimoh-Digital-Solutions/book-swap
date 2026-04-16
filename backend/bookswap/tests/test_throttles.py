"""Tests for custom throttle classes (SEC-001)."""

from unittest.mock import MagicMock, patch

from bookswap.throttles import AuthRateThrottle, AuthSensitiveRateThrottle

RATES = {"auth": "20/minute", "auth_sensitive": "5/minute"}


class TestAuthRateThrottle:
    @patch.dict(AuthRateThrottle.THROTTLE_RATES, RATES)
    def test_scope(self):
        throttle = AuthRateThrottle()
        assert throttle.scope == "auth"

    @patch.dict(AuthRateThrottle.THROTTLE_RATES, RATES)
    def test_cache_key_uses_ip(self):
        throttle = AuthRateThrottle()
        request = MagicMock()
        throttle.get_ident = MagicMock(return_value="192.168.1.1")
        key = throttle.get_cache_key(request, view=None)
        assert "auth" in key
        assert "192.168.1.1" in key


class TestAuthSensitiveRateThrottle:
    @patch.dict(AuthSensitiveRateThrottle.THROTTLE_RATES, RATES)
    def test_scope(self):
        throttle = AuthSensitiveRateThrottle()
        assert throttle.scope == "auth_sensitive"

    @patch.dict(AuthSensitiveRateThrottle.THROTTLE_RATES, RATES)
    def test_cache_key_uses_ip(self):
        throttle = AuthSensitiveRateThrottle()
        request = MagicMock()
        throttle.get_ident = MagicMock(return_value="10.0.0.1")
        key = throttle.get_cache_key(request, view=None)
        assert "auth_sensitive" in key
        assert "10.0.0.1" in key
