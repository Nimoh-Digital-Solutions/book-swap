"""Exchange flow app — manages swap requests, conditions, and the full exchange lifecycle."""

from django.apps import AppConfig


class ExchangesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.exchanges'
    verbose_name = 'Exchanges'
