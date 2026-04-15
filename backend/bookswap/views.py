"""bookswap views — user profile, location, onboarding, account, and login endpoints."""

import logging

from django.contrib.auth import get_user_model
from django.core import signing
from django.core.exceptions import ImproperlyConfigured
from nimoh_base.auth.serializers import UserLoginSerializer
from nimoh_base.auth.services import AuthenticationService
from nimoh_base.core.exceptions import ProblemDetailException
from nimoh_base.core.throttling import AuthenticationRateThrottle
from nimoh_base.core.utils import get_client_ip
from rest_framework import generics, status
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
    """GET /users/check-username/?q=<name> — check username availability."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = CheckUsernameSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["q"]

        is_taken = User.objects.filter(username=username).exclude(pk=request.user.pk).exists()

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
        auth_data = AuthenticationService.authenticate_user(
            validated_data=serializer.validated_data, request=request
        )

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


class MobileDeviceProxyView(APIView):
    """Thin proxy so ``/api/v1/users/me/devices/`` resolves in the bookswap URL namespace."""

    permission_classes = [IsAuthenticated]  # noqa: RUF012

    def post(self, request, *args, **kwargs):
        from apps.notifications.views import MobileDeviceView

        return MobileDeviceView().post(request)

    def delete(self, request, *args, **kwargs):
        from apps.notifications.views import MobileDeviceView

        return MobileDeviceView().delete(request)
