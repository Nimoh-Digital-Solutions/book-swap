from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class OptionalJWTAuthentication(JWTAuthentication):
    """JWT authentication that falls back to anonymous on invalid/expired tokens.

    Standard JWTAuthentication raises 401 when it sees an invalid token,
    even if the view allows anonymous access (AllowAny). This subclass
    catches that and returns None so DRF treats the request as anonymous.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None
