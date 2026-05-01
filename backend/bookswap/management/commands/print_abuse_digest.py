"""Print a Telegram-friendly abuse digest of BookSwap T&S signals.

Counts trust-safety reports filed and account lockouts triggered in the
last N hours, plus a 7-day baseline for spike detection. Designed to be
called from ``bookswap-abuse-monitor.sh`` on the Pi every hour, but is
also runnable by hand for ad-hoc triage:

    python manage.py print_abuse_digest --hours 24 --format markdown

Exit codes:
    0  ran successfully (regardless of whether anything was alarming)
    1  hard error (DB unreachable, etc.)
"""

import json
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone

from apps.trust_safety.models import Report, ReportStatus
from bookswap.models import User


class Command(BaseCommand):
    help = "Print an hourly abuse digest of BookSwap trust-safety + auth signals."

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=1,
            help="Lookback window in hours (default: 1)",
        )
        parser.add_argument(
            "--format",
            choices=("json", "markdown"),
            default="markdown",
            help="Output format (default: markdown for Telegram)",
        )

    def handle(self, *args, hours: int, format: str, **kwargs):
        stats = self._collect_stats(hours)

        if format == "json":
            self.stdout.write(json.dumps(stats, indent=2, default=str))
        else:
            self.stdout.write(self._format_markdown(stats, hours))

    def _collect_stats(self, hours: int) -> dict:
        now = timezone.now()
        since = now - timedelta(hours=hours)
        # Baseline window for the spike detector: last 7 days, but
        # excluding the active hour so the comparison isn't self-tainted.
        baseline_start = now - timedelta(days=7)
        baseline_end = since

        # Trust & Safety reports filed in the lookback window.
        recent_reports = Report.objects.filter(created_at__gte=since)
        report_count = recent_reports.count()
        report_open = recent_reports.filter(status=ReportStatus.OPEN).count()
        report_by_category = dict(
            recent_reports.values_list("category").annotate(c=Count("id")).values_list("category", "c")
        )

        # All currently-active reports (regardless of when filed) waiting
        # on a moderator. This is the "queue depth" signal.
        open_total = Report.objects.filter(status=ReportStatus.OPEN).count()
        reviewing_total = Report.objects.filter(status=ReportStatus.REVIEWED).count()

        # Account lockouts. `locked_until > now` means the user is
        # currently locked. `locked_until` set in the lookback window
        # but already expired still counts as an "incident" for the
        # operator to know about — that's where the OR comes in.
        lockouts_recent = (
            User.objects.filter(Q(locked_until__gte=since) | Q(locked_until__isnull=False, updated_at__gte=since))
            .filter(failed_login_attempts__gte=5)
            .count()
        )
        lockouts_active = User.objects.filter(locked_until__gt=now).count()

        # Signup spike detector — compare last hour to the per-hour
        # average over the last 7 days (excluding the active window).
        new_users_recent = User.objects.filter(date_joined__gte=since).count()
        baseline_total = User.objects.filter(
            date_joined__gte=baseline_start,
            date_joined__lt=baseline_end,
        ).count()
        # Hours in the baseline (7d * 24h, minus the active window).
        baseline_hours = max(1, int((baseline_end - baseline_start).total_seconds() / 3600))
        baseline_per_hour = baseline_total / baseline_hours
        # Spike = current rate > 3x baseline AND > 10 signups absolute,
        # so we don't get paged at 4am for going from 1/h to 5/h.
        signup_rate_per_hour = new_users_recent / max(1, hours)
        signup_spike = signup_rate_per_hour > max(3 * baseline_per_hour, 1) and new_users_recent > 10

        return {
            "window_hours": hours,
            "since": since.isoformat(),
            "now": now.isoformat(),
            "reports": {
                "filed_in_window": report_count,
                "filed_open": report_open,
                "by_category": report_by_category,
                "queue_open_total": open_total,
                "queue_reviewing_total": reviewing_total,
            },
            "lockouts": {
                "in_window": lockouts_recent,
                "currently_active": lockouts_active,
            },
            "signups": {
                "in_window": new_users_recent,
                "rate_per_hour": round(signup_rate_per_hour, 2),
                "baseline_per_hour": round(baseline_per_hour, 2),
                "spike_detected": signup_spike,
            },
        }

    def _format_markdown(self, s: dict, hours: int) -> str:
        # Use Telegram (legacy) Markdown — same dialect the other
        # bookswap-* scripts use, kept consistent so the digest renders
        # identically in the channel.
        report = s["reports"]
        lock = s["lockouts"]
        signup = s["signups"]

        lines = [f"*🛡 BookSwap abuse signals — last {hours}h*", ""]

        # T&S — only show categories that actually have entries
        if report["filed_in_window"]:
            cat_lines = "\n".join(f"      • {cat}: {n}" for cat, n in sorted(report["by_category"].items()))
            lines.append(
                f"*Reports filed*: {report['filed_in_window']} ({report['filed_open']} still open)\n{cat_lines}"
            )
        else:
            lines.append("*Reports filed*: 0")

        lines.append(
            f"*Queue depth*: {report['queue_open_total']} open · {report['queue_reviewing_total']} under review"
        )

        # Lockouts
        if lock["in_window"] or lock["currently_active"]:
            lines.append(f"*Lockouts*: {lock['in_window']} hit in window · {lock['currently_active']} currently locked")
        else:
            lines.append("*Lockouts*: 0")

        # Signups + spike
        spike_marker = " 🚨 SPIKE" if signup["spike_detected"] else ""
        lines.append(
            f"*Signups*: {signup['in_window']} in window "
            f"({signup['rate_per_hour']}/h vs {signup['baseline_per_hour']}/h baseline)"
            f"{spike_marker}"
        )

        return "\n".join(lines)
