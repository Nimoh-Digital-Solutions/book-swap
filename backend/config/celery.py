"""Celery application for bookswap."""

import os

from celery import Celery

# DJANGO_SETTINGS_MODULE must be set in the environment (docker-compose or .env).
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("bookswap")

# Load configuration from Django settings (CELERY_* keys).
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all installed apps.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Sanity-check task — prints the request to the worker log."""
    print(f"Request: {self.request!r}")
