"""Trust & Safety app — Block and Report models, views, and services."""

from django.apps import AppConfig


class TrustSafetyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.trust_safety"
    label = "trust_safety"
    verbose_name = "Trust & Safety"

    def ready(self):
        import apps.trust_safety.signals  # noqa: F401
