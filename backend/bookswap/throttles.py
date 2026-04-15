"""Custom DRF throttle classes for BookSwap authentication endpoints."""

from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """General auth endpoint throttle (login, register, refresh).

    Keyed by IP — applies to both anonymous and authenticated callers.
    """

    scope = "auth"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class AuthSensitiveRateThrottle(SimpleRateThrottle):
    """Stricter throttle for password reset and account recovery.

    Lower burst limit to prevent enumeration and abuse.
    """

    scope = "auth_sensitive"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
