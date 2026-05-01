"""Tests for the ``print_abuse_digest`` management command.

Drives the data that the pi-side ``bookswap-abuse-monitor.sh`` cron job
ships to the BookSwap Telegram channel every hour, so the same counters
are verified end-to-end here.
"""

import json
from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.trust_safety.models import Report, ReportCategory, ReportStatus
from apps.trust_safety.tests.factories import ReportFactory
from bookswap.models import User
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def _run(hours: int = 1, json_output: bool = True) -> dict | str:
    out = StringIO()
    args = ["print_abuse_digest", "--hours", str(hours)]
    if json_output:
        args += ["--format", "json"]
    call_command(*args, stdout=out)
    raw = out.getvalue()
    return json.loads(raw) if json_output else raw


def _backdate_reports(qs, hours: int) -> None:
    cutoff = timezone.now() - timedelta(hours=hours)
    qs.update(created_at=cutoff)


def _backdate_users(qs, hours: int) -> None:
    cutoff = timezone.now() - timedelta(hours=hours)
    qs.update(date_joined=cutoff)


class TestReportStats:
    def test_counts_reports_in_window_only(self):
        ReportFactory.create_batch(3, status=ReportStatus.OPEN)
        old = ReportFactory.create_batch(2, status=ReportStatus.OPEN)
        _backdate_reports(Report.objects.filter(pk__in=[r.pk for r in old]), hours=10)

        stats = _run(hours=1)
        assert stats["reports"]["filed_in_window"] == 3
        assert stats["reports"]["filed_open"] == 3
        # Queue depth counts everything currently open, regardless of window.
        assert stats["reports"]["queue_open_total"] == 5

    def test_separates_open_from_resolved_in_window(self):
        ReportFactory.create_batch(2, status=ReportStatus.OPEN)
        ReportFactory.create_batch(3, status=ReportStatus.RESOLVED)

        stats = _run(hours=1)
        assert stats["reports"]["filed_in_window"] == 5
        assert stats["reports"]["filed_open"] == 2

    def test_aggregates_by_category(self):
        ReportFactory.create_batch(2, category=ReportCategory.SPAM)
        ReportFactory.create(category=ReportCategory.HARASSMENT)
        ReportFactory.create(
            category=ReportCategory.OTHER,
            description="needed for OTHER category validation",
        )

        stats = _run(hours=1)
        assert stats["reports"]["by_category"]["spam"] == 2
        assert stats["reports"]["by_category"]["harassment"] == 1
        assert stats["reports"]["by_category"]["other"] == 1


class TestLockoutStats:
    def test_counts_currently_active_lockouts(self):
        u_locked = UserFactory(failed_login_attempts=5)
        User.objects.filter(pk=u_locked.pk).update(
            locked_until=timezone.now() + timedelta(minutes=10),
        )
        UserFactory()  # not locked

        stats = _run(hours=1)
        assert stats["lockouts"]["currently_active"] == 1

    def test_does_not_count_expired_lockouts_as_active(self):
        u = UserFactory(failed_login_attempts=5)
        User.objects.filter(pk=u.pk).update(
            locked_until=timezone.now() - timedelta(minutes=1),
        )

        stats = _run(hours=1)
        assert stats["lockouts"]["currently_active"] == 0


class TestSignupSpikeDetector:
    def test_no_spike_with_low_volume(self):
        UserFactory.create_batch(3)  # all in current hour

        stats = _run(hours=1)
        # 3 signups can never trigger the spike — absolute floor is > 10.
        assert stats["signups"]["spike_detected"] is False

    def test_spike_fires_when_rate_far_above_baseline_and_above_floor(self):
        # 12 signups in the last hour — clears the absolute floor.
        UserFactory.create_batch(12)

        # Baseline: 7 signups spread over the last 7 days = 1 / day = 0.04/h.
        # Last-hour rate of 12 is way more than 3x that AND > 10 absolute.
        baseline_users = UserFactory.create_batch(7)
        _backdate_users(
            User.objects.filter(pk__in=[u.pk for u in baseline_users]),
            hours=72,  # spread within the 7-day window, outside the active hour
        )

        stats = _run(hours=1)
        assert stats["signups"]["spike_detected"] is True
        assert stats["signups"]["in_window"] == 12

    def test_no_spike_when_above_floor_but_baseline_is_high(self):
        # Last hour: 12 signups, baseline: ~14/h. No spike.
        UserFactory.create_batch(12)
        baseline_users = UserFactory.create_batch(2400)
        _backdate_users(
            User.objects.filter(pk__in=[u.pk for u in baseline_users]),
            hours=24,  # within the 7-day baseline window
        )

        stats = _run(hours=1)
        assert stats["signups"]["spike_detected"] is False


class TestMarkdownOutput:
    def test_markdown_format_includes_all_sections(self):
        ReportFactory.create_batch(2, status=ReportStatus.OPEN, category=ReportCategory.SPAM)
        UserFactory.create_batch(3)

        out = _run(hours=1, json_output=False)
        assert "BookSwap abuse signals" in out
        assert "Reports filed" in out
        assert "Lockouts" in out
        assert "Signups" in out
        assert "spam: 2" in out

    def test_markdown_shows_zero_when_quiet(self):
        out = _run(hours=1, json_output=False)
        assert "Reports filed*: 0" in out
        assert "Lockouts*: 0" in out

    def test_markdown_flags_spike_with_emoji(self):
        UserFactory.create_batch(12)
        # Baseline must be tiny so 12/h ≫ baseline.
        out = _run(hours=1, json_output=False)
        assert "🚨 SPIKE" in out
