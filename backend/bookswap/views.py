"""bookswap views — user profile, location, onboarding, and account endpoints."""

from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework import generics, status
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


class UserMeView(APIView):
    """GET/PATCH the authenticated user's own profile."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserPrivateSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserPrivateSerializer(request.user).data)


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
        serializer = OnboardingCompleteSerializer(
            data=request.data, context={"request": request}
        )
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
        serializer = AccountDeletionRequestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Generate a signed cancellation token valid for 30 days
        cancel_token = signing.dumps(
            {"user_id": str(request.user.pk), "action": "cancel_deletion"},
            salt="account-deletion-cancel",
        )

        return Response(
            {
                "detail": "Your account has been scheduled for deletion. "
                          "You have 30 days to cancel.",
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
        response['Content-Disposition'] = 'attachment; filename="bookswap-data-export.json"'
        return response
