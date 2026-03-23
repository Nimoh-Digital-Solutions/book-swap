"""Core identity app — User model, profile endpoints, and auth extensions.

This is the foundational app for BookSwap. It owns ``AUTH_USER_MODEL``
(``bookswap.User``) and all profile/onboarding API endpoints. The Django
app label **must** remain ``bookswap``.

Domain models live in dedicated apps:
- ``apps.books`` — Book, BookPhoto, WishlistItem
- ``apps.trust_safety`` — Block, Report
"""

from django.apps import AppConfig


class BookswapConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "bookswap"
    verbose_name = "BookSwap Core"

    def ready(self):
        import bookswap.signals  # noqa: F401
