"""Native social login for the mobile app (Google + Apple)."""

import logging
from typing import ClassVar

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import UserPrivateSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class GoogleMobileAuthView(APIView):
    """POST /api/v1/auth/social/google-mobile/ — native Google Sign-In.

    Accepts a Google ID token from the mobile app's native Google Sign-In SDK,
    verifies it server-side, finds or creates the user, and returns JWT tokens.
    """

    permission_classes = (AllowAny,)

    def post(self, request):
        from django.conf import settings as django_settings
        from django.contrib.auth.hashers import make_password
        from django.db import transaction
        from django.utils import timezone as tz
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
        from rest_framework_simplejwt.tokens import RefreshToken
        from social_django.models import UserSocialAuth

        raw_token = (request.data.get("id_token") or "").strip()
        if not raw_token:
            return Response({"detail": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        web_client_id = getattr(django_settings, "SOCIAL_AUTH_GOOGLE_OAUTH2_KEY", "")
        if not web_client_id:
            logger.error("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY is not configured")
            return Response(
                {"detail": "Google sign-in is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            idinfo = google_id_token.verify_oauth2_token(raw_token, google_requests.Request(), web_client_id)
        except ValueError as exc:
            logger.warning("Invalid Google ID token: %s", exc)
            return Response({"detail": "Invalid or expired Google token."}, status=status.HTTP_401_UNAUTHORIZED)

        google_sub = idinfo.get("sub")
        email = (idinfo.get("email") or "").lower().strip()
        if not email or not idinfo.get("email_verified"):
            return Response(
                {"detail": "Google account email is not verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")

        try:
            with transaction.atomic():
                social = (
                    UserSocialAuth.objects.filter(provider="google-oauth2", uid=google_sub)
                    .select_related("user")
                    .first()
                )

                if social:
                    user = social.user
                else:
                    try:
                        user = User.objects.get(email__iexact=email)
                    except User.DoesNotExist:
                        base_username = email.split("@")[0][:28]
                        username = base_username
                        suffix = 0
                        while User.objects.filter(username=username).exists():
                            suffix += 1
                            username = f"{base_username}{suffix}"

                        user = User.objects.create(
                            email=email,
                            username=username,
                            first_name=first_name,
                            last_name=last_name,
                            password=make_password(None),
                            is_active=True,
                            email_verified=True,
                        )
                        logger.info("Created new user via Google mobile auth: %s", user.pk)

                    UserSocialAuth.objects.get_or_create(
                        user=user,
                        provider="google-oauth2",
                        uid=google_sub,
                        defaults={"extra_data": idinfo},
                    )

                update_fields = []
                if not user.is_social_account:
                    user.is_social_account = True
                    update_fields.append("is_social_account")
                if not user.social_provider:
                    user.social_provider = "google-oauth2"
                    update_fields.append("social_provider")
                if not user.auth_provider:
                    user.auth_provider = "google"
                    update_fields.append("auth_provider")
                if not user.email_verified:
                    user.email_verified = True
                    update_fields.append("email_verified")
                if update_fields:
                    user.save(update_fields=update_fields)

        except Exception:
            logger.exception("Google mobile auth failed")
            return Response(
                {"detail": "Authentication failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Download the Google profile photo on first sign-in (fire-and-forget;
        # set_avatar_from_url never raises and skips if avatar already exists).
        picture_url = idinfo.get("picture", "")
        if picture_url and not user.avatar:
            from ..utils import set_avatar_from_url

            set_avatar_from_url(user, picture_url)

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        user_data = UserPrivateSerializer(user).data

        logger.info("Google mobile auth successful for user %s", user.pk)

        return Response(
            {
                "access_token": str(access_token),
                "refresh_token": str(refresh),
                "token_type": "Bearer",
                "expires_in": int(access_token.get("exp", 0) - tz.now().timestamp())
                if access_token.get("exp")
                else 900,
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )


class AppleMobileAuthView(APIView):
    """POST /api/v1/auth/social/apple-mobile/ — native Apple Sign-In.

    Accepts an Apple identity token from expo-apple-authentication,
    verifies it server-side using Apple's public keys, finds or creates
    the user, and returns JWT tokens.
    """

    permission_classes = (AllowAny,)
    _apple_keys_cache: ClassVar[dict] = {}

    @classmethod
    def _get_apple_public_keys(cls):
        """Fetch Apple's public keys (cached in-memory)."""
        import time

        import jwt
        import requests as py_requests

        cached = cls._apple_keys_cache
        if cached.get("keys") and time.time() < cached.get("expires", 0):
            return cached["keys"]

        resp = py_requests.get("https://appleid.apple.com/auth/keys", timeout=10)
        resp.raise_for_status()
        jwks = resp.json()

        keys = {}
        for key_data in jwks.get("keys", []):
            kid = key_data["kid"]
            keys[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
        cls._apple_keys_cache = {"keys": keys, "expires": time.time() + 3600}
        return keys

    def post(self, request):
        import jwt
        from django.conf import settings as django_settings
        from django.contrib.auth.hashers import make_password
        from django.db import transaction
        from django.utils import timezone as tz
        from rest_framework_simplejwt.tokens import RefreshToken
        from social_django.models import UserSocialAuth

        raw_token = (request.data.get("identity_token") or "").strip()
        if not raw_token:
            return Response(
                {"detail": "identity_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            header = jwt.get_unverified_header(raw_token)
            kid = header.get("kid")
            apple_keys = self._get_apple_public_keys()
            public_key = apple_keys.get(kid)
            if not public_key:
                return Response(
                    {"detail": "Unable to verify Apple token."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            apple_client_id = getattr(django_settings, "SOCIAL_AUTH_APPLE_ID_CLIENT", "")
            if not apple_client_id:
                logger.error("SOCIAL_AUTH_APPLE_ID_CLIENT is not configured")
                return Response(
                    {"detail": "Apple sign-in is not configured on the server."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            claims = jwt.decode(
                raw_token,
                public_key,
                algorithms=["RS256"],
                audience=apple_client_id,
                issuer="https://appleid.apple.com",
            )
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Apple token has expired."}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError as exc:
            logger.warning("Invalid Apple identity token: %s", exc)
            return Response({"detail": "Invalid Apple token."}, status=status.HTTP_401_UNAUTHORIZED)

        apple_sub = claims.get("sub")
        # SECURITY (ADV-101): Only trust email from the signed JWT claims.
        # Never fall back to client-supplied request.data["user"]["email"] —
        # an attacker could supply a victim's email to hijack their account.
        email = (claims.get("email") or "").lower().strip()
        if not email or not claims.get("email_verified", False):
            return Response(
                {
                    "detail": "Apple token must include a verified email. "
                    "Please revoke BookSwap in Settings > Apple ID > "
                    "Sign in with Apple and try again."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_info = request.data.get("user") or {}
        first_name = user_info.get("first_name", "")
        last_name = user_info.get("last_name", "")

        try:
            with transaction.atomic():
                social = (
                    UserSocialAuth.objects.filter(provider="apple-id", uid=apple_sub).select_related("user").first()
                )

                if social:
                    user = social.user
                else:
                    try:
                        user = User.objects.get(email__iexact=email)
                    except User.DoesNotExist:
                        base_username = email.split("@")[0][:28]
                        username = base_username
                        suffix = 0
                        while User.objects.filter(username=username).exists():
                            suffix += 1
                            username = f"{base_username}{suffix}"

                        user = User.objects.create(
                            email=email,
                            username=username,
                            first_name=first_name,
                            last_name=last_name,
                            password=make_password(None),
                            is_active=True,
                            email_verified=True,
                        )
                        logger.info("Created new user via Apple mobile auth: %s", user.pk)

                    UserSocialAuth.objects.get_or_create(
                        user=user,
                        provider="apple-id",
                        uid=apple_sub,
                        defaults={"extra_data": claims},
                    )

                update_fields = []
                if not user.is_social_account:
                    user.is_social_account = True
                    update_fields.append("is_social_account")
                if not user.social_provider:
                    user.social_provider = "apple-id"
                    update_fields.append("social_provider")
                if not user.auth_provider:
                    user.auth_provider = "apple"
                    update_fields.append("auth_provider")
                if not user.email_verified:
                    user.email_verified = True
                    update_fields.append("email_verified")
                if update_fields:
                    user.save(update_fields=update_fields)

        except Exception:
            logger.exception("Apple mobile auth failed")
            return Response(
                {"detail": "Authentication failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        user_data = UserPrivateSerializer(user).data

        logger.info("Apple mobile auth successful for user %s", user.pk)

        return Response(
            {
                "access_token": str(access_token),
                "refresh_token": str(refresh),
                "token_type": "Bearer",
                "expires_in": int(access_token.get("exp", 0) - tz.now().timestamp())
                if access_token.get("exp")
                else 900,
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )
