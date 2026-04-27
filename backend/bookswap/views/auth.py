"""Custom login view (US-104 AC4) and login-input hashing helper.

Wraps nimoh-base login to return HTTP 423 for locked accounts instead of
the generic 400 that the upstream serializer uses for anti-enumeration.
The frontend already handles 423 in errorHandlers.ts.
"""

import hashlib
import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from nimoh_base.auth.serializers import UserLoginSerializer
from nimoh_base.auth.services import AuthenticationService
from nimoh_base.core.exceptions import ProblemDetailException
from nimoh_base.core.throttling import AuthenticationRateThrottle
from nimoh_base.core.utils import get_client_ip
from rest_framework import serializers as drf_fields
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes as perm_classes
from rest_framework.exceptions import Throttled, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

User = get_user_model()
logger = logging.getLogger(__name__)


def _hash_login_input(value: str) -> str:
    """Return a stable, short hash of a login identifier for log correlation.

    Used to keep failed-login traces correlatable across log lines without
    leaking the raw email or username into central log aggregators / Sentry
    breadcrumbs (see AUD-B-604).
    """

    if not value:
        return "<empty>"
    return hashlib.sha256(value.lower().encode("utf-8")).hexdigest()[:12]


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
        # AUD-B-604: never log raw email_or_username to the structured logger
        # (it ends up in central log aggregators / Sentry breadcrumbs). Hash
        # the input so support can still correlate failed-login bursts without
        # leaking PII.
        logger.error(
            "Login failed",
            extra={
                "login_id_hash": _hash_login_input(email_or_username),
                "error": str(e),
            },
        )
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
