"""Custom middleware for BookSwap."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import ClassVar

from django.conf import settings
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


class BookSwapSecurityHeadersMiddleware:
    """Inject hardened security headers on every response.

    nimoh-be-django-base already sets the basics (X-Content-Type-Options,
    X-Frame-Options, Strict-Transport-Security via get_base_security_settings).
    This middleware adds a Content-Security-Policy and supplementary headers
    that require awareness of BookSwap's frontend URL and CDN resources.

    Admin pages get a relaxed CSP (inline styles/scripts required by Django admin).
    """

    # CSP directives shared across all pages
    _BASE_CSP_DIRECTIVES: ClassVar[dict[str, str]] = {
        "default-src": "'self'",
        "img-src": "'self' data: https:",
        "font-src": "'self' https://fonts.gstatic.com",
        "style-src": "'self' https://fonts.googleapis.com 'unsafe-inline'",
        "frame-ancestors": "'none'",
        "base-uri": "'self'",
        "form-action": "'self'",
    }

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self._frontend_origin = getattr(settings, "FRONTEND_URL", "").rstrip("/")

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        self._set_security_headers(request, response)
        return response

    def _set_security_headers(self, request: HttpRequest, response: HttpResponse) -> None:
        is_admin = request.path.startswith("/admin/")

        connect_src = f"'self' {self._frontend_origin}" if self._frontend_origin else "'self'"

        if is_admin:
            script_src = "'self' 'unsafe-inline' 'unsafe-eval'"
            style_src = "'self' 'unsafe-inline'"
        else:
            script_src = "'self'"
            style_src = self._BASE_CSP_DIRECTIVES["style-src"]

        csp_parts = [
            f"default-src {self._BASE_CSP_DIRECTIVES['default-src']}",
            f"script-src {script_src}",
            f"style-src {style_src}",
            f"img-src {self._BASE_CSP_DIRECTIVES['img-src']}",
            f"font-src {self._BASE_CSP_DIRECTIVES['font-src']}",
            f"connect-src {connect_src}",
            f"frame-ancestors {self._BASE_CSP_DIRECTIVES['frame-ancestors']}",
            f"base-uri {self._BASE_CSP_DIRECTIVES['base-uri']}",
            f"form-action {self._BASE_CSP_DIRECTIVES['form-action']}",
        ]

        response["Content-Security-Policy"] = "; ".join(csp_parts)
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self), payment=()"
        response["Cross-Origin-Opener-Policy"] = "same-origin"
