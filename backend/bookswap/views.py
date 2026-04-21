"""bookswap views — user profile, location, onboarding, account, and login endpoints."""

import logging
from typing import ClassVar

from django.contrib.auth import get_user_model
from django.core import signing
from django.core.exceptions import ImproperlyConfigured
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from nimoh_base.auth.serializers import UserLoginSerializer
from nimoh_base.auth.services import AuthenticationService
from nimoh_base.core.exceptions import ProblemDetailException
from nimoh_base.core.throttling import AuthenticationRateThrottle
from nimoh_base.core.utils import get_client_ip
from rest_framework import generics, status
from rest_framework import serializers as drf_fields
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes as perm_classes
from rest_framework.exceptions import Throttled, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AccountDeletionRequestSerializer,
    CheckUsernameSerializer,
    OnboardingCompleteSerializer,
    SetLocationSerializer,
    UserPrivateSerializer,
    UserPublicSerializer,
    UserUpdateSerializer,
)
from .throttles import EnumerationThrottle

User = get_user_model()
logger = logging.getLogger(__name__)


class UserMeView(APIView):
    """GET/PATCH the authenticated user's own profile."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserPrivateSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserPrivateSerializer(request.user, context={"request": request}).data)


class UserDetailView(generics.RetrieveAPIView):
    """GET a public user profile by UUID."""

    permission_classes = (IsAuthenticated,)
    serializer_class = UserPublicSerializer
    lookup_field = "pk"

    def get_queryset(self):
        from apps.trust_safety.services import get_blocked_user_ids

        blocked_ids = get_blocked_user_ids(self.request.user)
        return User.objects.filter(is_active=True).exclude(pk__in=blocked_ids)


class SetLocationView(APIView):
    """POST — set the user's location from postcode or coordinates."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = SetLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(user=request.user)
        return Response(UserPrivateSerializer(user).data)


class OnboardingCompleteView(APIView):
    """POST — mark onboarding as complete."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = OnboardingCompleteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save(user=request.user)
        return Response(UserPrivateSerializer(user).data)

    def get(self, request):
        return Response({"message": "Hello from bookswap!"}, status=status.HTTP_200_OK)


class CheckUsernameView(APIView):
    """GET /users/check-username/?q=<name> — check username availability.

    SECURITY (ADV-306): Rate-limited to prevent automated username enumeration.
    """

    permission_classes = (AllowAny,)
    throttle_classes: ClassVar = [EnumerationThrottle]

    def get(self, request):
        serializer = CheckUsernameSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["q"]

        qs = User.objects.filter(username=username)
        if request.user.is_authenticated:
            qs = qs.exclude(pk=request.user.pk)
        is_taken = qs.exists()

        result = {"available": not is_taken}
        if is_taken:
            base = username.rstrip("0123456789")
            suggestions = []
            import random

            for _ in range(3):
                candidate = f"{base}{random.randint(10, 999)}"  # noqa: S311
                if not User.objects.filter(username=candidate).exists():
                    suggestions.append(candidate)
            result["suggestions"] = suggestions

        return Response(result)


class AccountDeletionRequestView(APIView):
    """POST /users/me/delete/ — request account deletion (GDPR)."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = AccountDeletionRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Generate a signed cancellation token valid for 30 days
        cancel_token = signing.dumps(
            {"user_id": str(request.user.pk), "action": "cancel_deletion"},
            salt="account-deletion-cancel",
        )

        return Response(
            {
                "detail": "Your account has been scheduled for deletion. You have 30 days to cancel.",
                "cancel_token": cancel_token,
            },
            status=status.HTTP_200_OK,
        )


class AccountDeletionCancelView(APIView):
    """POST /users/me/delete/cancel/ — cancel pending account deletion."""

    permission_classes = (AllowAny,)

    @extend_schema(
        summary="Cancel account deletion",
        description="Cancel a pending account deletion using the cancellation token from the deletion request.",
        request=inline_serializer("CancelDeletionRequest", fields={"token": drf_fields.CharField()}),
        responses={
            200: OpenApiResponse(description="Deletion cancelled"),
            400: OpenApiResponse(description="Invalid or expired token"),
            404: OpenApiResponse(description="User not found"),
        },
        tags=["users"],
    )
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Cancellation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = signing.loads(
                token,
                salt="account-deletion-cancel",
                max_age=30 * 24 * 60 * 60,  # 30 days
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid or expired cancellation token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=payload["user_id"])
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.deletion_requested_at is None:
            return Response(
                {"detail": "No pending deletion request found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.deletion_requested_at = None
        user.is_active = True
        user.save(update_fields=["deletion_requested_at", "is_active"])

        return Response(
            {"detail": "Account deletion has been cancelled."},
            status=status.HTTP_200_OK,
        )


class DataExportView(APIView):
    """GET /users/me/data-export/ — download all personal data as JSON."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        from .services import build_data_export

        data = build_data_export(request.user)
        response = Response(data)
        response["Content-Disposition"] = 'attachment; filename="bookswap-data-export.json"'
        return response


# ── Custom Login View (US-104 AC4) ────────────────────────────────────────────
# Wraps nimoh-base login to return HTTP 423 for locked accounts instead of
# the generic 400 that the upstream serializer uses for anti-enumeration.
# The frontend already handles 423 in errorHandlers.ts.


@extend_schema(
    summary="Authenticate user",
    description="Authenticate with email/username + password. Returns access token and user profile. "
    "Returns HTTP 423 if the account is locked due to failed attempts.",
    request=UserLoginSerializer,
    responses={
        200: OpenApiResponse(
            description="Login successful",
            response=inline_serializer(
                "LoginResponse",
                fields={
                    "access_token": drf_fields.CharField(),
                    "expires_in": drf_fields.IntegerField(),
                    "token_type": drf_fields.CharField(),
                    "user": inline_serializer(
                        "LoginUser",
                        fields={
                            "id": drf_fields.UUIDField(),
                            "email": drf_fields.EmailField(),
                            "username": drf_fields.CharField(),
                            "first_name": drf_fields.CharField(),
                            "last_name": drf_fields.CharField(),
                            "email_verified": drf_fields.BooleanField(),
                        },
                    ),
                },
            ),
        ),
        423: OpenApiResponse(description="Account locked"),
    },
    tags=["auth"],
)
@api_view(["POST"])
@perm_classes([AllowAny])
def login_view(request):
    """Authenticate user — returns 423 for locked accounts."""
    from nimoh_base.auth.models import AuditLog
    from nimoh_base.auth.utils.cookies import set_refresh_token_cookie
    from nimoh_base.auth.utils.mobile import get_client_type, is_mobile_client

    try:
        throttle = AuthenticationRateThrottle()
        if not throttle.allow_request(request, login_view):
            AuditLog.log_event(
                event_type="security_event",
                description="Login rate limit exceeded",
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                success=False,
                risk_level="high",
                metadata={"endpoint": "login"},
            )
            raise Throttled(detail="Too many login attempts. Please try again later.")
    except ImproperlyConfigured:
        pass  # Throttle rates not configured (e.g. test settings)

    # Pre-check: is the account locked? Return 423 before serializer validation.
    email_or_username = request.data.get("email_or_username", "")
    if email_or_username:
        user = None
        try:
            user = User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=email_or_username.lower())
            except User.DoesNotExist:
                pass

        if user and user.is_account_locked():
            AuditLog.log_event(
                event_type="login_failure",
                description=f"Login attempt on locked account: {email_or_username}",
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                success=False,
                risk_level="high",
                metadata={"login_attempt": email_or_username, "reason": "account_locked"},
            )
            raise ProblemDetailException(
                detail=(
                    "Your account has been temporarily locked due to too many"
                    " failed login attempts. Please try again later."
                ),
                code="account_locked",
                status_code=423,
            )

    serializer = UserLoginSerializer(data=request.data, context={"request": request})

    if not serializer.is_valid():
        AuditLog.log_event(
            event_type="login_failure",
            description="Login failed with validation errors",
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            success=False,
            risk_level="low",
            metadata={
                "errors": serializer.errors,
                "email_or_username": email_or_username,
            },
        )
        raise ValidationError(serializer.errors)

    try:
        auth_data = AuthenticationService.authenticate_user(validated_data=serializer.validated_data, request=request)

        if auth_data.get("two_factor_required"):
            return Response(
                {
                    "two_factor_required": True,
                    "challenge_token": auth_data["challenge_token"],
                    "expires_in": auth_data["expires_in"],
                    "message": "Please complete two-factor authentication.",
                },
                status=status.HTTP_202_ACCEPTED,
            )

        # Reset failed login counter on successful authentication
        auth_data["user"].record_successful_login()

        # Rotate session key to prevent session fixation (SEC-006)
        if hasattr(request, "session"):
            request.session.cycle_key()

        response_data = {
            "access_token": auth_data["access_token"],
            "expires_in": auth_data["expires_in"],
            "token_type": auth_data["token_type"],
            "user": {
                "id": str(auth_data["user"].id),
                "email": auth_data["user"].email,
                "username": auth_data["user"].username,
                "first_name": auth_data["user"].first_name,
                "last_name": auth_data["user"].last_name,
                "email_verified": auth_data["user"].email_verified,
            },
        }

        remember_me = serializer.validated_data.get("remember_me", False)
        max_age = 14 * 24 * 60 * 60 if remember_me else 7 * 24 * 60 * 60

        if is_mobile_client(request):
            response_data["refresh_token"] = auth_data["refresh_token"]
            response = Response(response_data, status=status.HTTP_200_OK)
        else:
            response = Response(response_data, status=status.HTTP_200_OK)
            response = set_refresh_token_cookie(response, auth_data["refresh_token"], max_age=max_age)

        logger.info(
            "Login successful",
            extra={
                "user_id": str(auth_data["user"].id),
                "client_type": get_client_type(request),
            },
        )
        return response

    except Exception as e:
        logger.error("Login failed", extra={"email_or_username": email_or_username, "error": str(e)})
        AuditLog.log_event(
            event_type="login_failure",
            description="Login failed with unexpected error",
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            success=False,
            risk_level="medium",
            metadata={"error_type": type(e).__name__, "email_or_username": email_or_username},
        )
        raise ProblemDetailException(
            detail="Login failed. Please try again later.",
            code="login_error",
        ) from None


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


class MobileDeviceProxyView(APIView):
    """Thin proxy so ``/api/v1/users/me/devices/`` resolves in the bookswap URL namespace."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    @extend_schema(
        summary="Register mobile device",
        description="Register or update a mobile device push token for push notifications.",
        request=inline_serializer(
            "MobileDeviceRequest",
            fields={
                "push_token": drf_fields.CharField(),
                "platform": drf_fields.ChoiceField(choices=["ios", "android"]),
                "device_name": drf_fields.CharField(required=False),
            },
        ),
        responses={201: OpenApiResponse(description="Device registered")},
        tags=["users"],
    )
    def post(self, request, *args, **kwargs):
        from apps.notifications.views import MobileDeviceView

        return MobileDeviceView().post(request)

    @extend_schema(
        summary="Deactivate mobile device",
        description="Deactivate a mobile device by push token.",
        request=inline_serializer("MobileDeviceDeleteRequest", fields={"push_token": drf_fields.CharField()}),
        responses={204: OpenApiResponse(description="Device deactivated")},
        tags=["users"],
    )
    def delete(self, request, *args, **kwargs):
        from apps.notifications.views import MobileDeviceView

        return MobileDeviceView().delete(request)
