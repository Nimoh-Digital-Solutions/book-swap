"""Shared resilience helpers for outbound third-party HTTP calls.

This module provides three composable building blocks used by every view that
hits an external API on the request path (Nominatim, Open Library, Google
Books, etc.):

1. :class:`CircuitBreaker` — a Django-cache-backed circuit breaker shared
   across gunicorn workers and Celery workers so that one slow / dead
   upstream cannot poison every request.
2. :func:`cached_call` — a small wrapper around the Django cache that runs
   a callable on miss and stores the result. Used to absorb repeat lookups
   for stable data (postcode → coords, ISBN → metadata).
3. Tight default timeouts (:data:`SHORT_TIMEOUT`, :data:`MEDIUM_TIMEOUT`)
   so request threads cannot hang for the upstream's full timeout.

Sprint 3 of the deep-audit plan (AUD-B-701 / AUD-B-702 / AUD-B-705).
"""

from __future__ import annotations

import functools
import hashlib
import logging
import time
from collections.abc import Callable
from typing import Any, TypeVar

from django.core.cache import cache

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Tight default timeouts. Anything that needs longer should pass an explicit
# value; the goal here is to make the *default* case safe.
SHORT_TIMEOUT = 3.0
MEDIUM_TIMEOUT = 5.0


# ── Exceptions ───────────────────────────────────────────────────────────────


class ExternalServiceError(Exception):
    """Base class for any failure talking to an external service."""


class CircuitOpenError(ExternalServiceError):
    """Raised when the circuit breaker is open and a call is short-circuited.

    Callers should treat this as "the upstream is currently unhealthy; do not
    retry right now". It is intentionally a subclass of
    :class:`ExternalServiceError` so existing ``except ExternalServiceError``
    handlers catch it too.
    """


# ── Circuit breaker ──────────────────────────────────────────────────────────


class CircuitBreaker:
    """Cache-backed circuit breaker keyed by service name.

    The breaker keeps a tiny piece of state in the Django cache (a failure
    counter and an "open until" timestamp). Because the state lives in the
    shared cache, every gunicorn / Celery worker sees the same circuit
    status — one worker noticing the upstream is dead protects every other
    worker for the cooldown window.

    Default behaviour:

    - **Closed** (normal): calls run; failures increment a counter.
    - **Tripped** after ``failure_threshold`` consecutive failures within
      ``failure_window`` seconds. Counter is reset on success.
    - **Open** for ``cooldown`` seconds: calls short-circuit with
      :class:`CircuitOpenError` (no traffic to the upstream).
    - **Half-open** automatically when ``cooldown`` elapses: the next call
      tries the upstream; success closes the circuit, failure re-opens it.
    """

    def __init__(
        self,
        name: str,
        *,
        failure_threshold: int = 5,
        failure_window: int = 60,
        cooldown: int = 60,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.failure_window = failure_window
        self.cooldown = cooldown
        self._fail_key = f"cb:{name}:fails"
        self._open_key = f"cb:{name}:open_until"

    def _is_open(self) -> bool:
        open_until = cache.get(self._open_key)
        return bool(open_until and time.time() < float(open_until))

    def _record_success(self) -> None:
        cache.delete_many([self._fail_key, self._open_key])

    def _record_failure(self) -> None:
        # Different cache backends behave differently on incr-of-missing-key:
        # Memcached raises ValueError, Django LocMem auto-initializes to 1,
        # some django-redis builds return None. Handle all three so the
        # breaker is portable across deployments and test environments.
        fails: int | None
        try:
            fails = cache.incr(self._fail_key)
        except ValueError:
            fails = None
        if fails is None:
            cache.set(self._fail_key, 1, timeout=self.failure_window)
            fails = 1
        if fails >= self.failure_threshold:
            cache.set(self._open_key, time.time() + self.cooldown, timeout=self.cooldown)
            logger.warning(
                "circuit_breaker.opened service=%s consecutive_failures=%s cooldown=%ss",
                self.name,
                fails,
                self.cooldown,
            )

    def call(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """Run ``func(*args, **kwargs)`` through the breaker.

        Raises :class:`CircuitOpenError` immediately if the breaker is open.
        Re-raises the underlying exception if the call itself fails.
        """
        if self._is_open():
            raise CircuitOpenError(f"Circuit '{self.name}' is open — skipping call.")
        try:
            result = func(*args, **kwargs)
        except Exception:
            self._record_failure()
            raise
        else:
            self._record_success()
            return result

    def __call__(self, func: Callable[..., T]) -> Callable[..., T]:
        """Decorator form: ``@breaker``."""

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            return self.call(func, *args, **kwargs)

        return wrapper


# ── Cache helper ─────────────────────────────────────────────────────────────


_SENTINEL = object()


def cached_call(
    cache_key: str,
    ttl: int,
    func: Callable[..., T],
    *args: Any,
    **kwargs: Any,
) -> T:
    """Return a cached result for *func* keyed by *cache_key*.

    On cache miss the callable is invoked and its return value is stored for
    *ttl* seconds before being returned. Exceptions are not cached — a
    failed call simply propagates and the next call will retry.

    The cache key should already be namespaced by the caller (we recommend
    ``"<service>:<version>:<input-hash>"``); long keys are hashed to keep
    the underlying cache backend happy.
    """
    safe_key = _safe_cache_key(cache_key)
    cached = cache.get(safe_key, _SENTINEL)
    if cached is not _SENTINEL:
        return cached  # type: ignore[return-value]

    result = func(*args, **kwargs)
    try:
        cache.set(safe_key, result, timeout=ttl)
    except Exception as exc:  # never let a cache backend hiccup break a request
        logger.warning("cache.set failed for key=%s: %s", safe_key, exc)
    return result


def _safe_cache_key(raw: str) -> str:
    """Return a cache-backend-safe key.

    Memcached caps keys at 250 chars; Redis is more permissive but very long
    keys are awkward to debug. We hash anything over 200 chars and prefix it
    so the prefix is still grep-able.
    """
    if len(raw) <= 200:
        return raw
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]
    prefix = raw.split(":", 2)[0] if ":" in raw else raw[:32]
    return f"{prefix}:hashed:{digest}"
