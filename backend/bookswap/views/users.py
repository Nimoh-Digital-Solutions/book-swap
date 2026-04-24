"""User profile, public profile, location, onboarding and username views."""

import logging
import random
from typing import ClassVar

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import (
    CheckUsernameSerializer,
    OnboardingCompleteSerializer,
    SetLocationSerializer,
    UserPrivateSerializer,
    UserPublicSerializer,
    UserUpdateSerializer,
)
from ..throttles import EnumerationThrottle

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
        # SECURITY (AUD-B-601): respect ``profile_public`` — users who opted out
        # of public discovery must 404 rather than expose their profile data.
        return User.objects.filter(is_active=True, profile_public=True).exclude(pk__in=blocked_ids)


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
            for _ in range(3):
                candidate = f"{base}{random.randint(10, 999)}"  # noqa: S311
                if not User.objects.filter(username=candidate).exists():
                    suggestions.append(candidate)
            result["suggestions"] = suggestions

        return Response(result)
