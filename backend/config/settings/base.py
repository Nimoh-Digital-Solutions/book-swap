"""
bookswap — base settings.

All environment-specific settings (development, production, test) inherit
from this module.  Use python-environ to populate values from the .env file.
"""
from __future__ import annotations

import pathlib

import environ
from nimoh_base.conf import NimohBaseSettings
from nimoh_base.conf.social import (
    get_social_auth_pipeline,
    get_social_auth_settings,
    get_social_installed_apps,
)

# ── Environment variables ─────────────────────────────────────────────────────
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
    DATABASE_URL=(str, ''),
    REDIS_URL=(str, 'redis://localhost:6379/0'),
    SECRET_KEY=(str, 'IG)x_Jcqvsm^0&CCb=NK^oADJII186)0pSZ&=BhWn98XR$O&t_'),
)

# Resolve project root (two levels up from config/settings/) and load .env
_PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
env.read_env(str(_PROJECT_ROOT / '.env'))

# ── Core ──────────────────────────────────────────────────────────────────────
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
USE_TZ = True
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True

# ── NIMOH_BASE configuration ──────────────────────────────────────────────────
NIMOH_BASE = {
    # Required
    'SITE_NAME': 'bookswap',
    'SUPPORT_EMAIL': env('SUPPORT_EMAIL', default='support@bookswap.example'),
    'NOREPLY_EMAIL': env('NOREPLY_EMAIL', default='noreply@bookswap.example'),
    # Optional
    'SERVER_HEADER': '',
    'PASSWORD_CHECKER_USER_AGENT': 'Django-Password-Validator',
    'CELERY_APP_NAME': 'bookswap',
    'CACHE_KEY_PREFIX': 'bookswap',
    'MOBILE_APP_IDENTIFIERS': [],
    'ENABLE_MONITORING_PERSISTENCE': True,
    # Set to False to skip the Celery worker check in /api/v1/health/.
    # Disable when running without a Celery worker (local dev without Docker Celery).
    'HEALTH_CHECK_CELERY': env.bool('HEALTH_CHECK_CELERY', default=True),
}

# ── AUTH ──────────────────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'bookswap.User'

AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.apple.AppleIdAuth',
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_PIPELINE = get_social_auth_pipeline()

# Social auth redirect settings (frontend host allow-list)
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3070')
globals().update(get_social_auth_settings(frontend_url=FRONTEND_URL))

# Provider credentials — set in .env, leave blank until provisioned
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET', default='')
SOCIAL_AUTH_APPLE_ID_CLIENT = env('SOCIAL_AUTH_APPLE_ID_CLIENT', default='')
SOCIAL_AUTH_APPLE_ID_SECRET = env('SOCIAL_AUTH_APPLE_ID_SECRET', default='')
SOCIAL_AUTH_APPLE_ID_TEAM = env('SOCIAL_AUTH_APPLE_ID_TEAM', default='')
SOCIAL_AUTH_APPLE_ID_KEY = env('SOCIAL_AUTH_APPLE_ID_KEY', default='')

# ── Installed apps ────────────────────────────────────────────────────────────
INSTALLED_APPS = NimohBaseSettings.get_base_apps(
    include_monitoring=True,
    include_privacy=True,
) + get_social_installed_apps() + [
    'django.contrib.gis',
    'django.contrib.postgres',
    # Project apps
    'bookswap',
    'apps.books',
    'apps.trust_safety',
    'apps.exchanges',
    'apps.messaging',
    'apps.ratings',
    'apps.notifications',
]

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = NimohBaseSettings.get_base_middleware()

# ── Database ──────────────────────────────────────────────────────────────────

DATABASES = {
    'default': env.db_url(
        'DATABASE_URL',
        default='postgresql://gnimoh001:root@localhost:5432/bookswap',
        engine='django.contrib.gis.db.backends.postgis',
    )
}


# ── Caches ────────────────────────────────────────────────────────────────────
CACHES = NimohBaseSettings.get_base_caches(
    redis_url=env('REDIS_URL'),
    key_prefix=NIMOH_BASE['CACHE_KEY_PREFIX'],
)

# ── Templates ─────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            # Override nimoh_base email templates here, e.g.:
            # BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ── Static / media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = 'staticfiles/'
MEDIA_URL = '/media/'
MEDIA_ROOT = 'mediafiles/'

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = NimohBaseSettings.get_base_rest_framework()

SIMPLE_JWT = NimohBaseSettings.get_base_simple_jwt()

# ── drf-spectacular ───────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = NimohBaseSettings.get_base_spectacular_settings(
    title='Bookswap API',
    description='An app for booklovers to save on buying new books everytime they want read new books',
    version='1.0.0',
)

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = NimohBaseSettings.get_base_logging(log_level='INFO')

# ── Email ─────────────────────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = NIMOH_BASE['NOREPLY_EMAIL']
SERVER_EMAIL = NIMOH_BASE['NOREPLY_EMAIL']

EMAIL_BACKEND = 'nimoh_base.core.email_backends.SendGridEmailBackend'
SENDGRID_API_KEY = env('SENDGRID_API_KEY', default='')


# ── Security ──────────────────────────────────────────────────────────────────
# Applied via globals().update() so Django reads CSRF_COOKIE_HTTPONLY,
# X_FRAME_OPTIONS, SECURE_CONTENT_TYPE_NOSNIFF, etc. directly.
globals().update(NimohBaseSettings.get_base_security_settings(https=False))

# Trusted proxy IPs — X-Forwarded-For is only honoured when the direct
# connection comes from one of these addresses (or a RFC-1918 private range).
# Set to your load-balancer / nginx container IPs in production.
# Example: TRUSTED_PROXY_IPS=10.0.0.1,10.0.0.2
TRUSTED_PROXY_IPS: list[str] = env.list('TRUSTED_PROXY_IPS', default=[])

# ── CORS ──────────────────────────────────────────────────────────────────────
# Applied via globals().update() so CORS_ALLOW_CREDENTIALS, CORS_ALLOW_HEADERS,
# and CORS_EXPOSE_HEADERS are active (not just CORS_ALLOWED_ORIGINS).
globals().update(NimohBaseSettings.get_base_cors())
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3070'])
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3070')


# ── Celery ────────────────────────────────────────────────────────────────────
_REDIS_BASE = env('REDIS_URL', default='redis://localhost:6379').rsplit('/', 1)[0]
# Applied via globals().update() so Celery's config_from_object(namespace='CELERY')
# resolves CELERY_BROKER_URL, CELERY_TASK_SERIALIZER, etc. as top-level settings.
globals().update(NimohBaseSettings.get_base_celery(
    broker_url=env('CELERY_BROKER_URL', default=f'{_REDIS_BASE}/1'),
    result_backend=env('CELERY_RESULT_BACKEND', default=f'{_REDIS_BASE}/2'),
))
CELERY_BEAT_SCHEDULE = NimohBaseSettings.get_base_celery_beat()
CELERY_BEAT_SCHEDULE["anonymize-deleted-accounts"] = {
    "task": "bookswap.anonymize_deleted_accounts",
    "schedule": 86400,  # daily (24h in seconds)
}

# Exchange expiry & auto-confirm tasks
from celery.schedules import crontab  # noqa: E402
CELERY_BEAT_SCHEDULE["expire-stale-exchange-requests"] = {
    "task": "exchanges.expire_stale_requests",
    "schedule": crontab(hour=2, minute=0),
}
CELERY_BEAT_SCHEDULE["expire-stale-conditions"] = {
    "task": "exchanges.expire_stale_conditions",
    "schedule": crontab(hour=2, minute=30),
}
CELERY_BEAT_SCHEDULE["auto-confirm-stale-swaps"] = {
    "task": "exchanges.auto_confirm_stale_swaps",
    "schedule": crontab(hour=4, minute=0, day_of_week=1),
}



# ── Channels ──────────────────────────────────────────────────────────────────
CHANNEL_LAYERS = NimohBaseSettings.get_base_channels(
    redis_url=env('REDIS_URL'),
)

