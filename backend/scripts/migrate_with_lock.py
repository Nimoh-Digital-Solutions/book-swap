#!/usr/bin/env python
"""Run Django migrations with a Redis advisory lock.

Prevents multiple containers from running migrations simultaneously during
rolling deployments.  The lock auto-expires after LOCK_TTL seconds as a
safety net.

Usage:
    python scripts/migrate_with_lock.py          # uses REDIS_URL from env
    python scripts/migrate_with_lock.py --noinput
"""

from __future__ import annotations

import os
import sys
import time

LOCK_KEY = "bookswap:migrate_lock"
LOCK_TTL = 600  # 10 minutes — enough for even large migrations
POLL_INTERVAL = 2  # seconds between retry attempts
MAX_WAIT = 300  # 5 minutes — give up if lock is held this long


def _get_redis():
    """Return a Redis client from REDIS_URL (falls back to localhost)."""
    try:
        import redis
    except ImportError:
        print("⚠️  redis-py not installed — running migrations without lock.")  # noqa: T201
        return None

    url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        client = redis.from_url(url, socket_connect_timeout=5)
        client.ping()
        return client
    except redis.ConnectionError:
        print("⚠️  Cannot reach Redis — running migrations without lock.")  # noqa: T201
        return None


def _run_migrate(extra_args: list[str]) -> int:
    """Execute Django's migrate command and return the exit code."""
    import django
    from django.core.management import call_command

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
    django.setup()

    try:
        call_command("migrate", *extra_args, verbosity=1)
        return 0
    except Exception as exc:
        print(f"❌ Migration failed: {exc}")  # noqa: T201
        return 1


def main() -> int:
    extra_args = sys.argv[1:]
    r = _get_redis()

    if r is None:
        return _run_migrate(extra_args)

    waited = 0
    acquired = r.set(LOCK_KEY, "1", nx=True, ex=LOCK_TTL)

    while not acquired:
        if waited >= MAX_WAIT:
            print(f"❌ Could not acquire migration lock after {MAX_WAIT}s — aborting.")  # noqa: T201
            return 1
        print(f"⏳ Migration lock held by another process, retrying in {POLL_INTERVAL}s ...")  # noqa: T201
        time.sleep(POLL_INTERVAL)
        waited += POLL_INTERVAL
        acquired = r.set(LOCK_KEY, "1", nx=True, ex=LOCK_TTL)

    print("🔒 Migration lock acquired.")  # noqa: T201
    try:
        return _run_migrate(extra_args)
    finally:
        r.delete(LOCK_KEY)
        print("🔓 Migration lock released.")  # noqa: T201


if __name__ == "__main__":
    raise SystemExit(main())
