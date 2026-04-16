"""Tests for BookSwapSecurityHeadersMiddleware."""

import pytest
from django.http import HttpResponse
from django.test import RequestFactory

from bookswap.middleware import BookSwapSecurityHeadersMiddleware


def _make_response_with_headers(**headers):
    """Simulate a response that already has headers set by nimoh_base."""
    resp = HttpResponse("OK")
    for k, v in headers.items():
        resp[k] = v
    return resp


NIMOH_BASE_CSP = (
    "default-src 'self'; script-src 'self' 'nonce-abc123'; "
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
    "font-src 'self'; connect-src 'self'"
)
NIMOH_BASE_CSP_RO = (
    "default-src 'none'; script-src 'self' 'nonce-abc123'; "
    "style-src 'self'; img-src 'self' data:; font-src 'self'; "
    "connect-src 'self'; report-uri /api/v1/security/csp-report/"
)


@pytest.fixture
def make_middleware():
    def _factory(frontend_url="", csp=NIMOH_BASE_CSP, csp_ro=NIMOH_BASE_CSP_RO):
        def get_response(request):
            return _make_response_with_headers(
                **{
                    "Content-Security-Policy": csp,
                    "Content-Security-Policy-Report-Only": csp_ro,
                }
            )

        with pytest.MonkeyPatch.context() as mp:
            mp.setattr("bookswap.middleware.settings", type("S", (), {"FRONTEND_URL": frontend_url})())
            mw = BookSwapSecurityHeadersMiddleware(get_response)
        return mw

    return _factory


@pytest.fixture
def rf():
    return RequestFactory()


class TestReportOnlyAdminRelaxation:
    """The Report-Only CSP must be relaxed for Django admin pages."""

    def test_admin_report_only_gets_unsafe_inline_style(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/admin/bookswap/user/"))
        csp_ro = response["Content-Security-Policy-Report-Only"]
        assert "'unsafe-inline'" in csp_ro

    def test_admin_report_only_gets_unsafe_eval_script(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/admin/bookswap/user/"))
        csp_ro = response["Content-Security-Policy-Report-Only"]
        assert "'unsafe-eval'" in csp_ro

    def test_admin_report_only_removes_nonce(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/admin/login/"))
        csp_ro = response["Content-Security-Policy-Report-Only"]
        assert "'nonce-" not in csp_ro

    def test_non_admin_report_only_unchanged(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/api/v1/books/"))
        csp_ro = response["Content-Security-Policy-Report-Only"]
        assert csp_ro == NIMOH_BASE_CSP_RO


class TestFrontendOriginConnect:
    """The frontend origin must be appended to connect-src."""

    def test_frontend_url_added_to_csp(self, make_middleware, rf):
        mw = make_middleware(frontend_url="https://app.bookswap.nl")
        response = mw(rf.get("/api/v1/books/"))
        assert "https://app.bookswap.nl" in response["Content-Security-Policy"]

    def test_frontend_url_added_to_report_only(self, make_middleware, rf):
        mw = make_middleware(frontend_url="https://app.bookswap.nl")
        response = mw(rf.get("/api/v1/books/"))
        assert "https://app.bookswap.nl" in response["Content-Security-Policy-Report-Only"]

    def test_no_frontend_url_no_change(self, make_middleware, rf):
        mw = make_middleware(frontend_url="")
        response = mw(rf.get("/api/v1/books/"))
        assert response["Content-Security-Policy"] == NIMOH_BASE_CSP

    def test_no_duplicate_if_already_present(self, make_middleware, rf):
        csp_with_origin = NIMOH_BASE_CSP.replace(
            "connect-src 'self'", "connect-src 'self' https://app.bookswap.nl"
        )
        mw = make_middleware(frontend_url="https://app.bookswap.nl", csp=csp_with_origin)
        response = mw(rf.get("/api/v1/books/"))
        assert response["Content-Security-Policy"].count("https://app.bookswap.nl") == 1


class TestEnforcedCspPassthrough:
    """The enforced CSP is set by nimoh_base; we should not overwrite it."""

    def test_enforced_csp_preserved_for_non_admin(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/api/v1/books/"))
        assert response["Content-Security-Policy"] == NIMOH_BASE_CSP
