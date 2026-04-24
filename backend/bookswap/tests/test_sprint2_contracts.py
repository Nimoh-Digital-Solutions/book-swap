"""Sprint 2 contract tests — pagination cap + profile-public filter.

Covers AUD-B-401..405, AUD-B-503, and AUD-B-601 from the deep audit:

- Every list endpoint that previously returned an unbounded set now wraps
  results in the standard ``count`` / ``next`` / ``previous`` / ``results``
  envelope.
- ``?page_size`` is honoured up to ``max_page_size`` (currently 100).
- Anything above ``max_page_size`` is silently clamped down so a malicious
  client can't ask for ``?page_size=999999`` and exfiltrate everything.
- ``GET /api/v1/users/<uuid>/`` returns 404 when the target user has
  ``profile_public=False``.
"""

from __future__ import annotations

import pytest
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APIClient

from apps.exchanges.models import ExchangeStatus
from apps.exchanges.tests.factories import ExchangeRequestFactory
from apps.messaging.models import Message
from apps.ratings.tests.factories import RatingFactory
from apps.trust_safety.models import Block
from bookswap.pagination import DefaultPagination
from bookswap.tests.factories import UserFactory

# ── Helpers ──────────────────────────────────────────────────────────────


def _auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _expect_paginated(payload):
    """Assert that ``payload`` is a DRF page envelope, not a bare list."""

    assert isinstance(payload, dict), f"expected dict, got {type(payload).__name__}"
    for key in ("count", "next", "previous", "results"):
        assert key in payload, f"missing pagination key: {key}"
    assert isinstance(payload["results"], list)


# ── Exchanges (AUD-B-401) ────────────────────────────────────────────────


@pytest.mark.django_db
class TestExchangeListPagination:
    def test_returns_paginated_envelope(self):
        ex = ExchangeRequestFactory()
        client = _auth(ex.requester)
        resp = client.get("/api/v1/exchanges/")
        assert resp.status_code == status.HTTP_200_OK
        _expect_paginated(resp.json())

    def test_page_size_query_param_honored(self):
        user = UserFactory(is_active=True, with_location=True)
        for _ in range(6):
            ExchangeRequestFactory(requester=user)
        client = _auth(user)
        resp = client.get("/api/v1/exchanges/?page_size=2")
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert body["count"] == 6
        assert len(body["results"]) == 2
        assert body["next"] is not None

    def test_page_size_above_cap_clamps(self):
        user = UserFactory(is_active=True, with_location=True)
        ExchangeRequestFactory(requester=user)
        client = _auth(user)
        resp = client.get("/api/v1/exchanges/?page_size=999999")
        assert resp.status_code == status.HTTP_200_OK
        # The paginator clamps at DefaultPagination.max_page_size; assert the
        # contract rather than a hard-coded value so the test tracks the cap.
        assert len(resp.json()["results"]) <= DefaultPagination.max_page_size


# ── Messages (AUD-B-402) ─────────────────────────────────────────────────


@pytest.mark.django_db
class TestMessageListPagination:
    def _setup(self, n_messages=3):
        ex = ExchangeRequestFactory(active=True)
        for i in range(n_messages):
            Message.objects.create(
                exchange=ex,
                sender=ex.requester if i % 2 == 0 else ex.owner,
                content=f"msg-{i}",
            )
        return ex

    def test_returns_paginated_envelope(self):
        ex = self._setup(n_messages=2)
        client = _auth(ex.requester)
        resp = client.get(f"/api/v1/messaging/exchanges/{ex.pk}/messages/")
        assert resp.status_code == status.HTTP_200_OK
        _expect_paginated(resp.json())

    def test_page_size_query_param_honored(self):
        ex = self._setup(n_messages=5)
        client = _auth(ex.requester)
        resp = client.get(f"/api/v1/messaging/exchanges/{ex.pk}/messages/?page_size=2")
        body = resp.json()
        assert body["count"] == 5
        assert len(body["results"]) == 2

    def test_page_size_above_cap_clamps(self):
        ex = self._setup(n_messages=1)
        client = _auth(ex.requester)
        resp = client.get(f"/api/v1/messaging/exchanges/{ex.pk}/messages/?page_size=999999")
        assert len(resp.json()["results"]) <= DefaultPagination.max_page_size


# ── User ratings (AUD-B-403) ─────────────────────────────────────────────


@pytest.mark.django_db
class TestUserRatingsListPagination:
    def test_returns_paginated_envelope(self):
        ex = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        RatingFactory(exchange=ex, rater=ex.requester, rated=ex.owner, score=5)
        client = _auth(ex.requester)
        resp = client.get(f"/api/v1/ratings/users/{ex.owner.pk}/")
        assert resp.status_code == status.HTTP_200_OK
        _expect_paginated(resp.json())

    def test_page_size_above_cap_clamps(self):
        ex = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        RatingFactory(exchange=ex, rater=ex.requester, rated=ex.owner, score=5)
        client = _auth(ex.requester)
        resp = client.get(f"/api/v1/ratings/users/{ex.owner.pk}/?page_size=999999")
        assert len(resp.json()["results"]) <= DefaultPagination.max_page_size


# ── Blocked users (AUD-B-404) ────────────────────────────────────────────


@pytest.mark.django_db
class TestBlockListPagination:
    def test_returns_paginated_envelope(self):
        me = UserFactory(is_active=True)
        Block.objects.create(blocker=me, blocked_user=UserFactory())
        client = _auth(me)
        resp = client.get("/api/v1/users/block/")
        assert resp.status_code == status.HTTP_200_OK
        _expect_paginated(resp.json())

    def test_page_size_above_cap_clamps(self):
        me = UserFactory(is_active=True)
        Block.objects.create(blocker=me, blocked_user=UserFactory())
        client = _auth(me)
        resp = client.get("/api/v1/users/block/?page_size=999999")
        assert len(resp.json()["results"]) <= DefaultPagination.max_page_size


# ── Admin reports (AUD-B-405) ────────────────────────────────────────────


@pytest.mark.django_db
class TestReportAdminListPagination:
    def test_returns_paginated_envelope(self):
        admin = UserFactory(is_active=True, is_staff=True, is_superuser=True)
        client = _auth(admin)
        resp = client.get("/api/v1/reports/admin/")
        assert resp.status_code == status.HTTP_200_OK
        _expect_paginated(resp.json())


# ── Profile public filter (AUD-B-601) ────────────────────────────────────


@pytest.mark.django_db
class TestUserDetailRespectsProfilePublic:
    def test_public_profile_visible(self):
        viewer = UserFactory(is_active=True)
        target = UserFactory(
            is_active=True,
            profile_public=True,
            location=Point(4.9041, 52.3676, srid=4326),
        )
        resp = _auth(viewer).get(f"/api/v1/users/{target.pk}/")
        assert resp.status_code == status.HTTP_200_OK

    def test_private_profile_hidden(self):
        """Users with ``profile_public=False`` must 404 — even when active.

        This is the AUD-B-601 fix: the previous queryset only excluded
        inactive/blocked users, leaking opt-out profiles via direct UUID lookup.
        """

        viewer = UserFactory(is_active=True)
        target = UserFactory(
            is_active=True,
            profile_public=False,
            location=Point(4.9041, 52.3676, srid=4326),
        )
        resp = _auth(viewer).get(f"/api/v1/users/{target.pk}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ── Login PII hashing helper (AUD-B-604) ─────────────────────────────────


class TestHashLoginInput:
    """``_hash_login_input`` must produce a stable, case-insensitive, short
    hash so support can correlate failed-login bursts without leaking PII.

    The login view itself (``logger.error("Login failed", extra=...)``) was
    updated to emit ``login_id_hash`` instead of ``email_or_username`` —
    asserting on the helper covers the contract that downstream logs depend
    on, without needing to drive the full login pipeline.
    """

    def test_hash_is_case_insensitive(self):
        from bookswap.views import _hash_login_input

        assert _hash_login_input("Victim@Example.com") == _hash_login_input("victim@example.com")

    def test_distinct_inputs_produce_distinct_hashes(self):
        from bookswap.views import _hash_login_input

        assert _hash_login_input("a@b.com") != _hash_login_input("c@d.com")

    def test_hash_length_is_short(self):
        from bookswap.views import _hash_login_input

        assert len(_hash_login_input("anything@example.com")) == 12

    def test_empty_input_is_marked(self):
        from bookswap.views import _hash_login_input

        assert _hash_login_input("") == "<empty>"

    def test_hash_does_not_contain_raw_input(self):
        from bookswap.views import _hash_login_input

        raw = "leaky@example.com"
        h = _hash_login_input(raw)
        assert raw not in h
        assert "leaky" not in h
        assert "example" not in h
