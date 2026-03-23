"""
Serializers for the notifications app.
"""

from rest_framework import serializers

from .models import Notification, NotificationPreferences


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
