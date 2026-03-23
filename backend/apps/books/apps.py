"""Books app — Book listings, photos, wishlist, browse, and ISBN lookup."""

from django.apps import AppConfig


class BooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.books"
    label = "books"
    verbose_name = "Books"

    def ready(self):
        import apps.books.signals  # noqa: F401
