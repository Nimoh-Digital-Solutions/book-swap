"""Production settings — always ensure secrets come from environment variables."""
from config.settings.base import *  # noqa: F401, F403
from config.settings.base import env  # noqa: F401
from nimoh_base.conf import NimohBaseSettings

DEBUG = False

ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Override security settings for production (HTTPS on)
_prod_security = NimohBaseSettings.get_base_security_settings(https=True)
globals().update(_prod_security)

# Static files — WhiteNoise is already in get_base_middleware() at index 1;
# only the compressed storage class needs to be overridden here.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── Logging ───────────────────────────────────────────────────────────────────
# Switch to single-line JSON for log aggregation in production
LOGGING['handlers']['console']['formatter'] = 'json'  # type: ignore[index]

