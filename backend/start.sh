#!/usr/bin/env bash
# Production startup script — runs migrations then starts gunicorn.
# Called as the CMD in the Dockerfile (after entrypoint.sh).
set -euo pipefail

echo "🚀 BookSwap backend starting ..."

# ── Collect static files (idempotent) ────────────────────────────────────────
echo "📦 Collecting static files ..."
python manage.py collectstatic --noinput

# ── Migrate with advisory lock ───────────────────────────────────────────────
echo "🔄 Running migrations ..."
python scripts/migrate_with_lock.py --noinput

# ── Start gunicorn ───────────────────────────────────────────────────────────
echo "🌐 Starting gunicorn ..."
exec gunicorn config.asgi:application -c config/gunicorn.py
