"""Production settings — always ensure secrets come from environment variables."""

import os

import sentry_sdk
from django.core.exceptions import ImproperlyConfigured
from nimoh_base.conf import NimohBaseSettings
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from config.settings.base import *  # noqa: F403
from config.settings.base import DEV_INSECURE_SECRET_KEY, env

# ── Fail-fast on missing / insecure prod secrets (AUD-B-801, AUD-B-802) ──────
# A misconfigured production deployment must crash immediately rather than
# silently fall back to the dev SECRET_KEY or the local Postgres URL embedded
# in ``base.py``. Both are convenient defaults for local dev; both are a
# critical security failure if they ever leak into a real deployment.
if SECRET_KEY in ("", DEV_INSECURE_SECRET_KEY):  # noqa: F405
    raise ImproperlyConfigured(
        "SECRET_KEY must be set to a unique production value via the SECRET_KEY env "
        "var. The dev fallback is not allowed in production."
    )

if not os.environ.get("DATABASE_URL", "").strip():
    raise ImproperlyConfigured(
        "DATABASE_URL must be set in production via the DATABASE_URL env var. The "
        "dev Postgres fallback in base.py is not allowed in production."
    )

DEBUG = False

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Override security settings for production (HTTPS on)
_prod_security = NimohBaseSettings.get_base_security_settings(https=True)
globals().update(_prod_security)

# ── CORS / CSRF hardening (SEC-007) ──────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = False
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [
        origin
        for origin in CORS_ALLOWED_ORIGINS  # noqa: F405
        if origin.startswith("https://")
    ]

# ── HSTS hardening ───────────────────────────────────────────────────────────
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files — WhiteNoise is already in get_base_middleware() at index 1;
# only the compressed storage class needs to be overridden here.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ── Logging ───────────────────────────────────────────────────────────────────
# Use the same human-readable dev_console formatter as development
LOGGING["handlers"]["console"]["formatter"] = "dev_console"  # type: ignore[index]  # noqa: F405

# Suppress noisy / broken third-party loggers
LOGGING.setdefault("loggers", {}).update(  # noqa: F405
    {  # type: ignore[union-attr]
        "httpx": {"level": "WARNING", "propagate": False},
        "httpcore": {"level": "WARNING", "propagate": False},
    }
)

# ── Sentry ─────────────────────────────────────────────────────────────────
_SENTRY_DSN = env("SENTRY_DSN", default="")
if _SENTRY_DSN:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        environment=env("SENTRY_ENVIRONMENT", default="production"),
        release=env("APP_VERSION", default="1.0.0"),
        traces_sample_rate=0.2,
        send_default_pii=False,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            LoggingIntegration(level=None, event_level="ERROR"),
        ],
    )
