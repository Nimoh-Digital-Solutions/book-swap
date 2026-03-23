"""Test settings — uses PostGIS for spatial + array field support."""

from config.settings.base import *  # noqa: F403

DEBUG = False
TESTING = True

# Disable nimoh-base HTTPS redirect middleware for tests
NIMOH_BASE["FORCE_HTTPS"] = False  # noqa: F405

# Use the same PostGIS engine as base.py; pytest-django creates a test_ prefixed DB
DATABASES["default"]["TEST"] = {  # type: ignore[index]  # noqa: F405
    "NAME": "test_bookswap",
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Disable throttling so unauthenticated endpoints (e.g. unsubscribe) are not rate-limited.
REST_FRAMEWORK.update(  # type: ignore[name-defined]  # noqa: F405
    {
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {},
    }
)

# Silence unused logging in tests
LOGGING = {}  # type: ignore[assignment]

# Faster password hashing in tests
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Disable security redirects
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
REFRESH_TOKEN_COOKIE_SECURE = False

# Remove the nimoh-base HTTPS redirect middleware in tests
MIDDLEWARE = [
    m
    for m in MIDDLEWARE  # noqa: F405
    if "HTTPSRedirectMiddleware" not in m
]

# Run Celery tasks synchronously in tests (no Redis dependency)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"
