"""Test settings — fast, in-memory SQLite, no external services."""
from config.settings.base import *  # noqa: F401, F403

DEBUG = False
TESTING = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Silence unused logging in tests
LOGGING = {}  # type: ignore[assignment]

# Faster password hashing in tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# Disable security redirects
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
REFRESH_TOKEN_COOKIE_SECURE = False
