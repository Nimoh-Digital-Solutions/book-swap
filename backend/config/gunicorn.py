"""Gunicorn configuration for bookswap.

Designed for ASGI via UvicornWorker.  Worker count adapts to CPU cores at
startup.  Override any value with the corresponding GUNICORN_* env var.

Usage:
    gunicorn config.asgi:application -c config/gunicorn.py
"""

from __future__ import annotations

import multiprocessing
import os

# ── Binding ──────────────────────────────────────────────────────────────────
bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8000")

# ── Workers ──────────────────────────────────────────────────────────────────
# (2 * CPU) + 1 is the standard heuristic.  Cap at 4 on the Pi5 (4 cores)
# to leave headroom for Celery, Redis, and Postgres on the same host.
_default_workers = min((2 * multiprocessing.cpu_count()) + 1, 9)
workers = int(os.environ.get("GUNICORN_WORKERS", _default_workers))
worker_class = "uvicorn.workers.UvicornWorker"

# ── Timeouts ─────────────────────────────────────────────────────────────────
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "30"))
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "5"))

# ── Logging ──────────────────────────────────────────────────────────────────
accesslog = os.environ.get("GUNICORN_ACCESS_LOG", "-")
errorlog = os.environ.get("GUNICORN_ERROR_LOG", "-")
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")

# ── Process naming ───────────────────────────────────────────────────────────
proc_name = "bookswap"

# ── Forwarded headers ────────────────────────────────────────────────────────
# Trust X-Forwarded-* headers from reverse proxy (nginx / Cloudflare Tunnel).
forwarded_allow_ips = os.environ.get("GUNICORN_FORWARDED_ALLOW_IPS", "*")

# ── Request limits ────────────────────────────────────────────────────────────
limit_request_body = int(os.environ.get("GUNICORN_LIMIT_REQUEST_BODY", str(10 * 1024 * 1024)))  # 10 MB
limit_request_line = int(os.environ.get("GUNICORN_LIMIT_REQUEST_LINE", "8190"))
limit_request_fields = int(os.environ.get("GUNICORN_LIMIT_REQUEST_FIELDS", "100"))

# ── Preload ──────────────────────────────────────────────────────────────────
preload_app = os.environ.get("GUNICORN_PRELOAD", "false").lower() == "true"
