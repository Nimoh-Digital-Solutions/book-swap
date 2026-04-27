#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Validate environment variables ────────────────────────────────────────────
"${SCRIPT_DIR}/check-env.sh"

# ── Wait for PostgreSQL ───────────────────────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
    echo "⏳ Waiting for PostgreSQL ..."
    # Extract host:port from DATABASE_URL (postgresql://user:pass@host:port/db)
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
    DB_PORT="${DB_PORT:-5432}"

    retries=0
    max_retries=30
    until python -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.settimeout(2)
    s.connect(('${DB_HOST}', ${DB_PORT}))
    s.close()
except Exception:
    sys.exit(1)
" 2>/dev/null; do
        retries=$((retries + 1))
        if [ "$retries" -ge "$max_retries" ]; then
            echo "❌ PostgreSQL at ${DB_HOST}:${DB_PORT} not reachable after ${max_retries}s"
            exit 1
        fi
        sleep 1
    done
    echo "✅ PostgreSQL is reachable."
fi

# ── Wait for Redis ────────────────────────────────────────────────────────────
REDIS_URL_CHECK="${REDIS_URL:-${CELERY_BROKER_URL:-}}"
if [ -n "$REDIS_URL_CHECK" ]; then
    echo "⏳ Waiting for Redis ..."
    REDIS_HOST=$(echo "$REDIS_URL_CHECK" | sed -E 's|redis://([^:/]+).*|\1|')
    REDIS_PORT=$(echo "$REDIS_URL_CHECK" | sed -E 's|redis://[^:]+:([0-9]+).*|\1|')
    REDIS_PORT="${REDIS_PORT:-6379}"

    retries=0
    max_retries=30
    until python -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.settimeout(2)
    s.connect(('${REDIS_HOST}', ${REDIS_PORT}))
    s.close()
except Exception:
    sys.exit(1)
" 2>/dev/null; do
        retries=$((retries + 1))
        if [ "$retries" -ge "$max_retries" ]; then
            echo "❌ Redis at ${REDIS_HOST}:${REDIS_PORT} not reachable after ${max_retries}s"
            exit 1
        fi
        sleep 1
    done
    echo "✅ Redis is reachable."
fi

# ── Hand off to the actual command (CMD from Dockerfile or docker-compose) ────
exec "$@"
