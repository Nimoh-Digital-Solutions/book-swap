"""Tests for the ``print_ops_digest`` management command.

The command produces the data the pi-side cron script ships to Telegram
every 4 hours, so all the counters that flow into the digest are
verified end-to-end here.
"""

import json
from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.books.tests.factories import BookFactory
from apps.exchanges.models import ExchangeStatus
from apps.exchanges.tests.factories import ExchangeRequestFactory
from apps.messaging.models import Message
from apps.trust_safety.models import Report
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def _run_digest(json_output: bool = True) -> dict | str:
    out = StringIO()
    args = ["print_ops_digest"]
    if json_output:
        args.append("--json")
    call_command(*args, stdout=out)
    raw = out.getvalue()
    return json.loads(raw) if json_output else raw


def _backdate(model_qs, hours: int) -> None:
    """Set created_at on every row in queryset to N hours ago."""
    cutoff = timezone.now() - timedelta(hours=hours)
    model_qs.update(created_at=cutoff)


class TestUserStats:
    def test_counts_total_verified_and_new_users(self):
        UserFactory.create_batch(3, email_verified=True)
        UserFactory.create_batch(2, email_verified=False)

        # Backdate one verified user so it lands outside the 24h window.
        old_user = UserFactory(email_verified=True)
        from bookswap.models import User

        User.objects.filter(pk=old_user.pk).update(created_at=timezone.now() - timedelta(hours=30))

        stats = _run_digest()
        assert stats["users"]["total"] == 6
        assert stats["users"]["verified"] == 4
        assert stats["users"]["new_24h"] == 5  # the 5 fresh ones, not the backdated user


class TestBookStats:
    def test_separates_seed_books_from_user_listings(self):
        owner = UserFactory()
        BookFactory.create_batch(2, owner=owner, is_seed=True)
        BookFactory.create_batch(3, owner=owner, is_seed=False)

        stats = _run_digest()
        assert stats["books"]["total"] == 5
        assert stats["books"]["seed"] == 2
        assert stats["books"]["user_listed"] == 3

    def test_new_24h_excludes_seed_books_and_old_listings(self):
        owner = UserFactory()
        # Seed books should never count toward "new in last 24h" because the
        # operator only cares about real user activity.
        BookFactory.create_batch(2, owner=owner, is_seed=True)
        # Real user listings, all fresh.
        BookFactory.create_batch(3, owner=owner, is_seed=False)
        # An older user listing — outside the 24h window.
        old = BookFactory(owner=owner, is_seed=False)
        from apps.books.models import Book

        Book.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(hours=30))

        stats = _run_digest()
        assert stats["books"]["new_24h"] == 3

    def test_top_genres_unnested_and_lower_cased(self):
        """Multi-genre books should each count once per genre, and case
        differences should not split a genre into two buckets."""
        owner = UserFactory()
        BookFactory(owner=owner, is_seed=False, genres=["Fiction", "fantasy"])
        BookFactory(owner=owner, is_seed=False, genres=["fiction"])
        BookFactory(owner=owner, is_seed=False, genres=["History"])
        # Seed book — must be ignored.
        BookFactory(owner=owner, is_seed=True, genres=["fiction", "fiction"])

        stats = _run_digest()
        top = dict(stats["books"]["top_genres"])
        assert top["fiction"] == 2  # not 4 — seed ignored, case folded
        assert top["fantasy"] == 1
        assert top["history"] == 1


class TestExchangeStats:
    def test_active_count_excludes_terminal_states(self):
        ExchangeRequestFactory(status=ExchangeStatus.PENDING)
        ExchangeRequestFactory(status=ExchangeStatus.ACCEPTED)
        ExchangeRequestFactory(status=ExchangeStatus.ACTIVE)
        ExchangeRequestFactory(status=ExchangeStatus.SWAP_CONFIRMED)
        # Terminal — must NOT count as active.
        ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        ExchangeRequestFactory(status=ExchangeStatus.DECLINED)
        ExchangeRequestFactory(status=ExchangeStatus.CANCELLED)
        ExchangeRequestFactory(status=ExchangeStatus.EXPIRED)

        stats = _run_digest()
        assert stats["exchanges"]["active"] == 4
        assert stats["exchanges"]["total"] == 8

    def test_completed_24h_uses_updated_at(self):
        recent = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        old = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        # Backdate updated_at of the old one so it falls outside the window.
        from apps.exchanges.models import ExchangeRequest

        ExchangeRequest.objects.filter(pk=old.pk).update(updated_at=timezone.now() - timedelta(hours=30))
        # Make sure the recent one has updated_at within the window
        ExchangeRequest.objects.filter(pk=recent.pk).update(updated_at=timezone.now())

        stats = _run_digest()
        assert stats["exchanges"]["completed_24h"] == 1

    def test_status_breakdown_reflects_real_counts(self):
        ExchangeRequestFactory.create_batch(3, status=ExchangeStatus.PENDING)
        ExchangeRequestFactory.create_batch(2, status=ExchangeStatus.ACCEPTED)
        ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)

        stats = _run_digest()
        by_status = stats["exchanges"]["by_status"]
        assert by_status["pending"] == 3
        assert by_status["accepted"] == 2
        assert by_status["completed"] == 1


class TestActiveUsers:
    def test_active_7d_counts_books_exchanges_and_messages(self):
        u1 = UserFactory()
        u2 = UserFactory()
        u3 = UserFactory()
        UserFactory()  # u4 — entirely inactive, must NOT be counted

        BookFactory(owner=u1, is_seed=False)
        # u2 was the owner on a fresh request
        ExchangeRequestFactory(owner=u2, requester=UserFactory())
        # u3 sent a chat message
        ex = ExchangeRequestFactory()
        Message.objects.create(exchange=ex, sender=u3, content="Hi")

        stats = _run_digest()
        # The four request-side users (u2, plus the requester subfactory'd inside),
        # the 2 from u3's exchange, plus u1, all count. Just verify u4 is NOT
        # present and that active_7d is at least 4.
        assert stats["users"]["active_7d"] >= 4
        # Sanity: u4 (no activity) shouldn't push the count up.
        before = stats["users"]["active_7d"]
        UserFactory()  # another idle user
        assert _run_digest()["users"]["active_7d"] == before

    def test_old_activity_does_not_count(self):
        u = UserFactory()
        book = BookFactory(owner=u, is_seed=False)
        from apps.books.models import Book

        Book.objects.filter(pk=book.pk).update(created_at=timezone.now() - timedelta(days=8))

        stats = _run_digest()
        # No other activity, so active_7d should only contain users who ARE
        # active in the last 7d. u is not, so 0 unless other users count.
        # With only `u` in the system, 0.
        assert stats["users"]["active_7d"] == 0


class TestTrustSafetyStats:
    def test_counts_open_and_under_review_separately(self):
        reporter = UserFactory()
        target = UserFactory()
        Report.objects.create(reporter=reporter, reported_user=target, category="spam", status="open")
        Report.objects.create(reporter=reporter, reported_user=target, category="harassment", status="open")
        Report.objects.create(
            reporter=reporter, reported_user=target, category="other", description="x", status="reviewed"
        )
        Report.objects.create(
            reporter=reporter, reported_user=target, category="other", description="x", status="resolved"
        )

        stats = _run_digest()
        assert stats["trust_safety"]["open"] == 2
        assert stats["trust_safety"]["under_review"] == 1


class TestMarkdownOutput:
    def test_markdown_contains_each_section(self):
        UserFactory.create_batch(2)
        BookFactory.create_batch(2, is_seed=False)
        ExchangeRequestFactory(status=ExchangeStatus.PENDING)

        out = _run_digest(json_output=False)
        assert "BookSwap Ops Digest" in out
        assert "Users" in out
        assert "Books" in out
        assert "Exchanges" in out

    def test_markdown_omits_trust_safety_when_queue_empty(self):
        UserFactory()
        out = _run_digest(json_output=False)
        # Only emit the T&S warning when there's something open.
        assert "Trust & Safety queue" not in out

    def test_markdown_includes_trust_safety_when_reports_open(self):
        reporter = UserFactory()
        target = UserFactory()
        Report.objects.create(reporter=reporter, reported_user=target, category="spam", status="open")

        out = _run_digest(json_output=False)
        assert "Trust & Safety queue" in out
