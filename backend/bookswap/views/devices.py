"""Mobile device push-token proxy view (delegates to apps.notifications)."""

from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers as drf_fields
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


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
