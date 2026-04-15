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

    def create(self, validated_data: dict) -> MobileDevice:
        user = self.context["request"].user
        device, _ = MobileDevice.objects.update_or_create(
            push_token=validated_data["push_token"],
            defaults={**validated_data, "user": user, "is_active": True},
        )
        return device
