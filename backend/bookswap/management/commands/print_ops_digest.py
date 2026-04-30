r"""Print a Telegram-friendly ops digest of BookSwap activity.

Designed to be invoked by a small bash wrapper on the pi server (every
4 hours, via cron) which pipes the output to ``send_telegram`` from the
existing monitoring suite.

Output is plain-text with Telegram *legacy* Markdown markup
(``*bold*`` and ``\`code\```) so it renders nicely in the chat
without requiring MarkdownV2 escaping. The format intentionally
mirrors the visual style of the other monitor scripts
(``container-monitor.sh``, ``db-monitor.sh``, etc.) for a consistent
operator experience.

Run with ``python manage.py print_ops_digest [--json]``.
"""

import json
from collections import Counter
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone

from apps.books.models import Book
from apps.exchanges.models import ExchangeRequest, ExchangeStatus
from apps.messaging.models import Message
from apps.trust_safety.models import Report
from bookswap.models import User

# Statuses that count as an "active" exchange — i.e. neither side has
# walked away yet and the swap hasn't completed/returned.
ACTIVE_EXCHANGE_STATUSES = (
    ExchangeStatus.PENDING,
    ExchangeStatus.ACCEPTED,
    ExchangeStatus.CONDITIONS_PENDING,
    ExchangeStatus.ACTIVE,
    ExchangeStatus.SWAP_CONFIRMED,
    ExchangeStatus.RETURN_REQUESTED,
)

TERMINAL_NEGATIVE_STATUSES = (
    ExchangeStatus.DECLINED,
    ExchangeStatus.CANCELLED,
    ExchangeStatus.EXPIRED,
)


class Command(BaseCommand):
    help = "Print a 4-hourly ops digest of BookSwap activity (for Telegram cron job)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--json",
            action="store_true",
            help="Emit raw stats as JSON instead of formatted Markdown.",
        )

    def handle(self, *args, **options):
        stats = self._collect_stats()
        if options["json"]:
            self.stdout.write(json.dumps(stats, indent=2, default=str))
            return
        self.stdout.write(self._format_markdown(stats))

    # ── data collection ──────────────────────────────────────────────

    def _collect_stats(self) -> dict:
        now = timezone.now()
        day_ago = now - timedelta(hours=24)
        week_ago = now - timedelta(days=7)

        # Users: separate organic accounts from seed data is unnecessary
        # (we don't seed users), but verified vs. unverified matters for ops.
        users_total = User.objects.count()
        users_verified = User.objects.filter(email_verified=True).count()
        users_new_24h = User.objects.filter(created_at__gte=day_ago).count()

        # Books: split is_seed from real listings so the operator knows
        # how much of the catalogue is real user-supplied content.
        books_qs = Book.objects.all()
        books_total = books_qs.count()
        books_seed = books_qs.filter(is_seed=True).count()
        books_user = books_total - books_seed
        books_new_24h = books_qs.filter(is_seed=False, created_at__gte=day_ago).count()

        # Exchanges: total + active + completed in the last 24h. Status
        # breakdown shows the funnel.
        exchanges_total = ExchangeRequest.objects.count()
        active_count = ExchangeRequest.objects.filter(status__in=ACTIVE_EXCHANGE_STATUSES).count()
        completed_24h = ExchangeRequest.objects.filter(
            status=ExchangeStatus.COMPLETED,
            updated_at__gte=day_ago,
        ).count()
        new_requests_24h = ExchangeRequest.objects.filter(created_at__gte=day_ago).count()
        status_breakdown = dict(
            ExchangeRequest.objects.values_list("status").annotate(n=Count("pk")).values_list("status", "n")
        )

        # Active users last 7d: anyone who created a book, sent a request,
        # or sent a chat message. last_login is unreliable because Simple
        # JWT does not update it by default.
        active_user_ids = set(Book.objects.filter(created_at__gte=week_ago).values_list("owner_id", flat=True))
        active_user_ids.update(
            ExchangeRequest.objects.filter(created_at__gte=week_ago).values_list("requester_id", flat=True)
        )
        active_user_ids.update(
            ExchangeRequest.objects.filter(created_at__gte=week_ago).values_list("owner_id", flat=True)
        )
        active_user_ids.update(Message.objects.filter(created_at__gte=week_ago).values_list("sender_id", flat=True))

        # Top genres — Book.genres is a Postgres ArrayField (up to 3 entries
        # per book). For an honest top-5 we have to unnest. The catalogue is
        # small enough (<<10k rows expected for the lifetime of this digest)
        # that pulling all arrays and counting in Python is cheaper than
        # fighting with raw SQL through the ORM. Genre values are normalised
        # to lower-case so "Fiction" / "fiction" don't double-count.
        genre_counter: Counter = Counter()
        for genres in Book.objects.filter(is_seed=False).values_list("genres", flat=True):
            for raw in genres or []:
                value = (raw or "").strip().lower()
                if value:
                    genre_counter[value] += 1
        top_genres = genre_counter.most_common(5)

        # Trust & safety: open + reviewed reports both demand attention.
        ts_open = Report.objects.filter(status="open").count()
        ts_reviewed = Report.objects.filter(status="reviewed").count()

        return {
            "generated_at": now.isoformat(),
            "users": {
                "total": users_total,
                "verified": users_verified,
                "new_24h": users_new_24h,
                "active_7d": len(active_user_ids),
            },
            "books": {
                "total": books_total,
                "user_listed": books_user,
                "seed": books_seed,
                "new_24h": books_new_24h,
                "top_genres": top_genres,
            },
            "exchanges": {
                "total": exchanges_total,
                "active": active_count,
                "completed_24h": completed_24h,
                "new_requests_24h": new_requests_24h,
                "by_status": status_breakdown,
            },
            "trust_safety": {
                "open": ts_open,
                "under_review": ts_reviewed,
            },
        }

    # ── formatting ──────────────────────────────────────────────────

    def _format_markdown(self, s: dict) -> str:
        u = s["users"]
        b = s["books"]
        e = s["exchanges"]
        ts = s["trust_safety"]
        by_status = e["by_status"]

        # Pretty-print exchange status counts in a stable order so consecutive
        # digests are visually comparable.
        ordered_statuses = [
            ExchangeStatus.PENDING,
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.CONDITIONS_PENDING,
            ExchangeStatus.ACTIVE,
            ExchangeStatus.SWAP_CONFIRMED,
            ExchangeStatus.RETURN_REQUESTED,
            ExchangeStatus.COMPLETED,
            ExchangeStatus.RETURNED,
            ExchangeStatus.DECLINED,
            ExchangeStatus.CANCELLED,
            ExchangeStatus.EXPIRED,
        ]
        status_lines = [
            f"   • {status.replace('_', ' ').title():<20} {by_status.get(status, 0)}"
            for status in ordered_statuses
            if by_status.get(status, 0) > 0
        ]
        status_block = "\n".join(status_lines) if status_lines else "   • _(none)_"

        if b["top_genres"]:
            genres_block = "\n".join(f"   • {genre or '_uncategorised_'}: {n}" for genre, n in b["top_genres"])
        else:
            genres_block = "   • _(no listings yet)_"

        ts_health = ""
        ts_total_open = ts["open"] + ts["under_review"]
        if ts_total_open > 0:
            ts_health = f"\n⚠️ *Trust & Safety queue*: {ts['open']} open, {ts['under_review']} under review"

        return (
            f"📚 *BookSwap Ops Digest*\n"
            f"\n"
            f"*👥 Users*\n"
            f"   • Total: *{u['total']}* ({u['verified']} verified)\n"
            f"   • Active last 7d: *{u['active_7d']}*\n"
            f"   • New last 24h: *{u['new_24h']}*\n"
            f"\n"
            f"*📖 Books*\n"
            f"   • Listed: *{b['user_listed']}* (+ {b['seed']} seed = {b['total']} total)\n"
            f"   • New last 24h: *{b['new_24h']}*\n"
            f"   • Top genres:\n{genres_block}\n"
            f"\n"
            f"*🔁 Exchanges*\n"
            f"   • Active right now: *{e['active']}*\n"
            f"   • New requests last 24h: *{e['new_requests_24h']}*\n"
            f"   • Completed last 24h: *{e['completed_24h']}*\n"
            f"   • Lifetime total: {e['total']}\n"
            f"   • By status:\n{status_block}"
            f"{ts_health}"
        )
