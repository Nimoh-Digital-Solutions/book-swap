"""Custom DRF throttle classes for BookSwap endpoints."""

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


class EnumerationThrottle(SimpleRateThrottle):
    """Throttle for endpoints that could leak user existence info.

    SECURITY (ADV-306): Limits check-username and similar lookup endpoints
    to prevent automated username/email enumeration by unauthenticated callers.
    """

    scope = "enumeration"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
