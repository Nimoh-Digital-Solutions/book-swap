"""
Custom User model for bookswap.

Subclasses ``AbstractNimohUser`` — add project-specific fields here.
"""
from nimoh_base.auth.models import AbstractNimohUser


class User(AbstractNimohUser):
    """
    Custom User for bookswap.

    ``AUTH_USER_MODEL = 'bookswap.User'`` is set in config/settings/base.py.
    Add extra fields below, then run ``python manage.py makemigrations``.
    """

    class Meta(AbstractNimohUser.Meta):
        db_table = 'bookswap_user'
        swappable = 'AUTH_USER_MODEL'
