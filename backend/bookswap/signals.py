"""Bookswap signals — login success tracking and cross-app hooks."""

from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

User = get_user_model()


@receiver(user_logged_in)
def reset_failed_login_counter(sender, user, request, **kwargs):
    """Reset failed_login_attempts on successful login (US-104 AC4)."""
    if hasattr(user, "record_successful_login"):
        user.record_successful_login()


# Signals have been moved to their respective apps:
# - Book search vector update → apps/books/signals.py
# - Report admin notification → apps/trust_safety/signals.py
