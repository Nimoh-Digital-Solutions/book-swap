"""Production settings — always ensure secrets come from environment variables."""

from nimoh_base.conf import NimohBaseSettings

from config.settings.base import *  # noqa: F403
from config.settings.base import env

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
