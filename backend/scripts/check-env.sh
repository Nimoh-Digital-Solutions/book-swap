#!/usr/bin/env bash
# Validate that all required environment variables are set before startup.
# Called by entrypoint.sh — exits non-zero on first missing var.
set -euo pipefail

MISSING=0

require_var() {
    local var_name="$1"
    if [ -z "${!var_name:-}" ]; then
        echo "❌ Missing required env var: ${var_name}"
        MISSING=1
    fi
}

# ── Always required ──────────────────────────────────────────────────────────
require_var "SECRET_KEY"
require_var "DATABASE_URL"
require_var "ALLOWED_HOSTS"

# ── Required in production / staging ─────────────────────────────────────────
if [ "${DJANGO_SETTINGS_MODULE:-}" = "config.settings.production" ] || \
   [ "${DJANGO_SETTINGS_MODULE:-}" = "config.settings.staging" ]; then
    require_var "CORS_ALLOWED_ORIGINS"
    require_var "FRONTEND_URL"
    require_var "SUPPORT_EMAIL"
    require_var "NOREPLY_EMAIL"
fi

if [ "$MISSING" -ne 0 ]; then
    echo ""
    echo "⛔ One or more required environment variables are missing."
    echo "   See .env.example for the full list."
    exit 1
fi

echo "✅ Environment check passed."
