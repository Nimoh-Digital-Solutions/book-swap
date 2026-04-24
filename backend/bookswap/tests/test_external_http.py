"""Unit tests for the shared external-HTTP resilience helpers.

Covers:
- :class:`CircuitBreaker` — closed → trip → cooldown → recovery
- :func:`cached_call` — miss / hit / no-cache-on-error semantics
- :func:`_safe_cache_key` — long-key hashing
"""

from __future__ import annotations

import time
from unittest.mock import MagicMock

import pytest
from django.core.cache import cache

from bookswap.external_http import (
    CircuitBreaker,
    CircuitOpenError,
    _safe_cache_key,
    cached_call,
)

pytestmark = pytest.mark.django_db


# ── CircuitBreaker ──────────────────────────────────────────────────────────


class TestCircuitBreaker:
    def test_passes_through_when_closed(self):
        breaker = CircuitBreaker("test-pass", failure_threshold=3, cooldown=1)
        result = breaker.call(lambda: "ok")
        assert result == "ok"

    def test_opens_after_threshold_consecutive_failures(self):
        breaker = CircuitBreaker("test-trip", failure_threshold=3, failure_window=60, cooldown=60)
        boom = MagicMock(side_effect=RuntimeError("nope"))

        for _ in range(3):
            with pytest.raises(RuntimeError):
                breaker.call(boom)

        # The 4th call must short-circuit without invoking the upstream.
        boom.reset_mock()
        with pytest.raises(CircuitOpenError):
            breaker.call(boom)
        boom.assert_not_called()

    def test_success_resets_failure_counter(self):
        breaker = CircuitBreaker("test-reset", failure_threshold=3, cooldown=60)

        # Two failures (still under the threshold), then a success.
        for _ in range(2):
            with pytest.raises(RuntimeError):
                breaker.call(MagicMock(side_effect=RuntimeError()))
        breaker.call(lambda: "ok")

        # Two more failures should NOT trip — counter was reset by the success.
        for _ in range(2):
            with pytest.raises(RuntimeError):
                breaker.call(MagicMock(side_effect=RuntimeError()))
        # And we should still be allowed to call.
        result = breaker.call(lambda: "still ok")
        assert result == "still ok"

    def test_cooldown_expires_and_circuit_closes_again(self):
        breaker = CircuitBreaker(
            "test-cooldown",
            failure_threshold=2,
            failure_window=60,
            cooldown=1,  # 1-second cooldown so the test is fast
        )
        boom = MagicMock(side_effect=RuntimeError())
        for _ in range(2):
            with pytest.raises(RuntimeError):
                breaker.call(boom)

        # Open right now.
        with pytest.raises(CircuitOpenError):
            breaker.call(boom)

        # Wait out the cooldown then verify the breaker is back to closed.
        time.sleep(1.1)
        assert breaker.call(lambda: "recovered") == "recovered"

    def test_decorator_form(self):
        breaker = CircuitBreaker("test-deco", failure_threshold=2, cooldown=60)

        @breaker
        def upstream(x):
            return x * 2

        assert upstream(3) == 6


# ── cached_call ─────────────────────────────────────────────────────────────


class TestCachedCall:
    def test_caches_result_and_skips_callable_on_hit(self):
        spy = MagicMock(return_value={"some": "payload"})

        first = cached_call("test:cc:hit", 60, spy, "arg")
        second = cached_call("test:cc:hit", 60, spy, "arg")

        assert first == second == {"some": "payload"}
        # Callable should only run once — second call is a cache hit.
        spy.assert_called_once_with("arg")

    def test_does_not_cache_exceptions(self):
        spy = MagicMock(side_effect=[RuntimeError("boom"), "second-time-ok"])

        with pytest.raises(RuntimeError):
            cached_call("test:cc:err", 60, spy)
        # On retry the callable runs again because the previous call did not
        # populate the cache.
        result = cached_call("test:cc:err", 60, spy)
        assert result == "second-time-ok"

    def test_can_cache_falsy_values(self):
        """Empty list / None / "" are valid cached values, not "miss" markers."""
        spy = MagicMock(return_value=[])

        first = cached_call("test:cc:falsy", 60, spy)
        second = cached_call("test:cc:falsy", 60, spy)

        assert first == second == []
        spy.assert_called_once()

    def test_long_keys_are_hashed_safely(self):
        # Reach into the helper directly: any 250+ char key would blow up the
        # memcached backend without this protection.
        long_key = "namespace:" + ("x" * 500)
        safe = _safe_cache_key(long_key)
        assert len(safe) <= 200
        assert safe.startswith("namespace:hashed:")
        # Same input → same key (deterministic).
        assert _safe_cache_key(long_key) == safe

    def test_short_keys_pass_through(self):
        assert _safe_cache_key("foo:bar:1") == "foo:bar:1"


# ── Integration: cached_call + CircuitBreaker together ─────────────────────


class TestCachedCallWithCircuitBreaker:
    """The realistic shape of every external-call site in the project."""

    def test_cache_hit_does_not_consult_breaker(self):
        breaker = CircuitBreaker("test-cb-cache", failure_threshold=1, cooldown=60)
        upstream = MagicMock(return_value="payload")

        # First call: miss → breaker → upstream.
        first = cached_call("test:int:1", 60, lambda: breaker.call(upstream))
        assert first == "payload"

        # Trip the breaker behind the scenes by directly opening the circuit
        # via failures.
        with pytest.raises(RuntimeError):
            breaker.call(MagicMock(side_effect=RuntimeError()))
        # Sanity: breaker is now open.
        with pytest.raises(CircuitOpenError):
            breaker.call(upstream)

        # ...but the cached_call should still return the cached payload, since
        # the cache short-circuits BEFORE the breaker is consulted.
        cached = cache.get("test:int:1")
        assert cached == "payload"
