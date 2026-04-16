"""Tests for BookSwapSecurityHeadersMiddleware."""

import pytest
from django.test import RequestFactory

from bookswap.middleware import BookSwapSecurityHeadersMiddleware


@pytest.fixture
def make_middleware():
    def _factory(frontend_url=""):
        def get_response(request):
            from django.http import HttpResponse

            return HttpResponse("OK")

        with pytest.MonkeyPatch.context() as mp:
            mp.setattr("bookswap.middleware.settings", type("S", (), {"FRONTEND_URL": frontend_url})())
            mw = BookSwapSecurityHeadersMiddleware(get_response)
        return mw

    return _factory


@pytest.fixture
def rf():
    return RequestFactory()


class TestSecurityHeadersMiddleware:
    def test_csp_header_present(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/api/v1/books/"))
        assert "Content-Security-Policy" in response
        assert "default-src 'self'" in response["Content-Security-Policy"]

    def test_admin_gets_relaxed_csp(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/admin/login/"))
        csp = response["Content-Security-Policy"]
        assert "'unsafe-inline'" in csp
        assert "'unsafe-eval'" in csp

    def test_non_admin_strict_script_src(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/api/v1/books/"))
        csp = response["Content-Security-Policy"]
        assert "script-src 'self'" in csp
        assert "'unsafe-eval'" not in csp

    def test_frontend_url_in_connect_src(self, make_middleware, rf):
        mw = make_middleware(frontend_url="https://app.bookswap.nl")
        response = mw(rf.get("/api/v1/books/"))
        csp = response["Content-Security-Policy"]
        assert "https://app.bookswap.nl" in csp

    def test_referrer_policy(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/"))
        assert response["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_permissions_policy(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/"))
        assert "geolocation=(self)" in response["Permissions-Policy"]

    def test_cross_origin_opener_policy(self, make_middleware, rf):
        mw = make_middleware()
        response = mw(rf.get("/"))
        assert response["Cross-Origin-Opener-Policy"] == "same-origin"
