"""Custom middleware for BookSwap."""

from __future__ import annotations

import logging
import re
from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

AUTH_THROTTLE_PATHS = re.compile(r"^/api/v1/auth/(register|token/refresh)/$")
AUTH_SENSITIVE_PATHS = re.compile(r"^/api/v1/auth/password/(reset|change)/$")


class AuthThrottleMiddleware:
    """Apply stricter IP-based throttles to auth endpoints served by nimoh-base.

    Login is handled separately in bookswap.views.login_view (manual throttle).
    This middleware covers register, token/refresh, password/reset, and
    password/change — endpoints defined inside nimoh_base_urlpatterns().
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.method != "POST":
            return self.get_response(request)

        path = request.path

        if AUTH_SENSITIVE_PATHS.match(path):
            from bookswap.throttles import AuthSensitiveRateThrottle

            throttle = AuthSensitiveRateThrottle()
            if not self._allow(throttle, request):
                return JsonResponse(
                    {"detail": "Request was throttled. Please try again later."},
                    status=429,
                )

        elif AUTH_THROTTLE_PATHS.match(path):
            from bookswap.throttles import AuthRateThrottle

            throttle = AuthRateThrottle()
            if not self._allow(throttle, request):
                return JsonResponse(
                    {"detail": "Request was throttled. Please try again later."},
                    status=429,
                )

        return self.get_response(request)

    @staticmethod
    def _allow(throttle, request: HttpRequest) -> bool:
        try:
            return throttle.allow_request(request, None)
        except Exception:
            return True


class BookSwapSecurityHeadersMiddleware:
    """Patch security headers after nimoh_base's SecurityHeadersMiddleware.

    Must be placed BEFORE nimoh_base middleware in MIDDLEWARE so it executes
    AFTER it in the response phase (Django processes responses bottom-to-top).

    Responsibilities:
    - Relax the CSP Report-Only header for Django admin pages (nimoh_base's
      report-only policy is strict and doesn't include admin-specific
      adjustments, causing false-positive violations for inline styles).
    - Append the frontend origin to connect-src in both CSP headers.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self._frontend_origin = getattr(settings, "FRONTEND_URL", "").rstrip("/")

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        self._patch_headers(request, response)
        return response

    def _patch_headers(self, request: HttpRequest, response: HttpResponse) -> None:
        is_admin = request.path.startswith("/admin/")

        if is_admin:
            self._relax_report_only_for_admin(response)

        if self._frontend_origin:
            self._append_frontend_origin(response)

    def _relax_report_only_for_admin(self, response: HttpResponse) -> None:
        """Add 'unsafe-inline' to style-src and script-src in the Report-Only
        CSP for admin pages so Django admin's inline styles and scripts don't
        flood CSP violation logs."""
        header = "Content-Security-Policy-Report-Only"
        csp_ro = response.get(header)
        if not csp_ro:
            return

        directives = self._parse_csp(csp_ro)

        style_src = directives.get("style-src", "'self'")
        if "'unsafe-inline'" not in style_src:
            directives["style-src"] = f"{style_src} 'unsafe-inline'"

        script_src = directives.get("script-src", "'self'")
        if "'unsafe-inline'" not in script_src:
            directives["script-src"] = f"{script_src} 'unsafe-inline'"
        if "'unsafe-eval'" not in script_src:
            directives["script-src"] = f"{directives['script-src']} 'unsafe-eval'"

        nonce_entries = [s for s in directives.get("script-src", "").split() if s.startswith("'nonce-")]
        if nonce_entries:
            directives["script-src"] = " ".join(
                s for s in directives["script-src"].split() if not s.startswith("'nonce-")
            )

        response[header] = "; ".join(f"{k} {v}" for k, v in directives.items())

    def _append_frontend_origin(self, response: HttpResponse) -> None:
        """Add the frontend origin to connect-src so the SPA can reach the API."""
        for header_name in ("Content-Security-Policy", "Content-Security-Policy-Report-Only"):
            csp = response.get(header_name)
            if not csp:
                continue
            if self._frontend_origin in csp:
                continue

            directives = self._parse_csp(csp)
            connect = directives.get("connect-src", "'self'")
            directives["connect-src"] = f"{connect} {self._frontend_origin}"
            response[header_name] = "; ".join(f"{k} {v}" for k, v in directives.items())

    @staticmethod
    def _parse_csp(csp_string: str) -> dict[str, str]:
        """Parse a CSP header string into an ordered dict of directive → values."""
        directives: dict[str, str] = {}
        for part in csp_string.split(";"):
            part = part.strip()
            if not part:
                continue
            tokens = part.split(None, 1)
            key = tokens[0]
            value = tokens[1] if len(tokens) > 1 else ""
            directives[key] = value
        return directives
