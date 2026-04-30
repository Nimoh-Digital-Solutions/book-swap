"""
Serializers for the notifications app.
"""

from rest_framework import serializers

from .models import MobileDevice, Notification, NotificationPreferences


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [  # noqa: RUF012
            "id",
            "notification_type",
            "title",
            "body",
            "link",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreferences
        fields = [  # noqa: RUF012
            "email_new_request",
            "email_request_accepted",
            "email_request_declined",
            "email_new_message",
            "email_exchange_completed",
            "email_rating_received",
        ]


class MobileDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MobileDevice
        fields = ["id", "push_token", "platform", "device_name", "is_active", "created_at"]  # noqa: RUF012
        read_only_fields = ["id", "is_active", "created_at"]  # noqa: RUF012
        # Suppress the auto-generated UniqueValidator for push_token — the field
        # is unique at the DB level, but the view intentionally uses update_or_create
        # so re-registering an existing token (e.g. after reinstall) must be allowed.
        # Format validation is handled by validate_push_token() below.
        extra_kwargs = {"push_token": {"validators": []}}  # noqa: RUF012

    def validate_push_token(self, value: str) -> str:
        """SEC-010: Validate push token format (Expo, FCM, or APNs)."""
        import re

        value = value.strip()
        if not value:
            raise serializers.ValidationError("Push token cannot be empty.")
        if len(value) > 255:
            raise serializers.ValidationError("Push token exceeds maximum length.")
        is_expo = value.startswith("ExponentPushToken[") and value.endswith("]")
        is_fcm = bool(re.match(r"^[a-zA-Z0-9_:.-]{100,}$", value))
        is_apns = bool(re.match(r"^[a-f0-9]{64}$", value))
        if not (is_expo or is_fcm or is_apns):
            raise serializers.ValidationError("Invalid push token format.")
        return value

    def validate(self, attrs: dict) -> dict:
        """Limit devices per user to prevent token squatting."""
        user = self.context["request"].user
        max_devices = 10
        active_count = MobileDevice.objects.filter(user=user, is_active=True).count()
        if active_count >= max_devices:
            existing_token = attrs.get("push_token", "")
            if not MobileDevice.objects.filter(user=user, push_token=existing_token).exists():
                raise serializers.ValidationError(
                    f"Maximum of {max_devices} active devices reached. Remove an old device first."
                )
        return attrs

    def create(self, validated_data: dict) -> MobileDevice:
        user = self.context["request"].user
        token = validated_data["push_token"]

        # Prevent token hijack: deactivate other users' registration of this token
        MobileDevice.objects.filter(push_token=token).exclude(user=user).update(
            is_active=False,
        )

        device, _ = MobileDevice.objects.update_or_create(
            user=user,
            push_token=token,
            defaults={**validated_data, "is_active": True},
        )
        return device
