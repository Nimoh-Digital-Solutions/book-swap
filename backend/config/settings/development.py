"""Development settings — never use in production."""
from config.settings.base import *  # noqa: F403
from config.settings.base import env

DEBUG = True

ALLOWED_HOSTS = ['*']

# Disable security middleware in development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
REFRESH_TOKEN_COOKIE_SECURE = False
# Console email during development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Django Debug Toolbar (optional — install separately)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
# INTERNAL_IPS = ['127.0.0.1']

# ── Logging ───────────────────────────────────────────────────────────────────
# Show DEBUG-level messages from the app and nimoh_base in dev
LOGGING['loggers']['nimoh_base']['level'] = 'DEBUG'  # type: ignore[index]  # noqa: F405
LOGGING['loggers']['apps']['level'] = 'DEBUG'         # type: ignore[index]  # noqa: F405

# Enable SQL query logging with LOG_SQL=true in .env
LOGGING['loggers']['django.db.backends'] = {          # type: ignore[index]  # noqa: F405
    'handlers': ['console'],
    'level': 'DEBUG' if env('LOG_SQL', default=False) else 'WARNING',
    'propagate': False,
}

