"""bookswap views — user profile, location, and onboarding endpoints."""

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
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
    queryset = User.objects.filter(is_active=True)
    lookup_field = "pk"


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
