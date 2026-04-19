"""Serializers for the trust_safety app."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Block, Report, ReportCategory, ReportStatus

User = get_user_model()


class BlockedUserSerializer(serializers.ModelSerializer):
    """Compact user representation for the blocked-users list."""

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "avatar")
        read_only_fields = fields


class BlockSerializer(serializers.ModelSerializer):
    """Read serializer for a Block record."""

    blocked_user = BlockedUserSerializer(read_only=True)

    class Meta:
        model = Block
        fields = ("id", "blocked_user", "created_at")
        read_only_fields = fields


class BlockCreateSerializer(serializers.Serializer):
    """Create a block — validates the target user exists and isn't self."""

    blocked_user_id = serializers.UUIDField()

    def validate_blocked_user_id(self, value):
        if value == self.context["request"].user.pk:
            raise serializers.ValidationError("You cannot block yourself.")
        if not User.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("User not found.")
        return value


class ReportCreateSerializer(serializers.Serializer):
    """Validate and create a new Report."""

    reported_user_id = serializers.UUIDField()
    reported_book_id = serializers.UUIDField(required=False)
    reported_exchange_id = serializers.UUIDField(required=False)
    category = serializers.ChoiceField(choices=ReportCategory.choices)
    description = serializers.CharField(max_length=500, required=False, default="")

    def validate_reported_user_id(self, value):
        if value == self.context["request"].user.pk:
            raise serializers.ValidationError("You cannot report yourself.")
        if not User.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("User not found.")
        return value

    def validate(self, attrs):
        if attrs["category"] == ReportCategory.OTHER and not attrs.get("description", "").strip():
            raise serializers.ValidationError({"description": 'Description is required when category is "other".'})
        return attrs

    def create(self, validated_data):
        from apps.books.models import Book

        user = self.context["request"].user
        reported_user_id = validated_data["reported_user_id"]
        book = None
        exchange = None
        book_id = validated_data.pop("reported_book_id", None)
        exchange_id = validated_data.pop("reported_exchange_id", None)

        if book_id:
            book = Book.objects.filter(pk=book_id, owner_id=reported_user_id).first()
            if not book:
                raise serializers.ValidationError(
                    {"reported_book_id": "Book does not belong to the reported user."}
                )

        if exchange_id:
            from apps.exchanges.models import ExchangeRequest

            exchange = ExchangeRequest.objects.filter(pk=exchange_id).first()
            if exchange:
                participants = {exchange.requester_id, exchange.owner_id}
                if user.pk not in participants or reported_user_id not in participants:
                    raise serializers.ValidationError(
                        {"reported_exchange_id": "You and the reported user must both be participants in this exchange."}
                    )

        return Report.objects.create(
            reporter=user,
            reported_user_id=reported_user_id,
            reported_book=book,
            reported_exchange=exchange,
            category=validated_data["category"],
            description=validated_data.get("description", ""),
        )


class ReportListSerializer(serializers.ModelSerializer):
    """Admin list view for reports."""

    reporter = BlockedUserSerializer(read_only=True)
    reported_user = BlockedUserSerializer(read_only=True)

    class Meta:
        model = Report
        fields = (
            "id",
            "reporter",
            "reported_user",
            "category",
            "description",
            "status",
            "admin_notes",
            "resolved_at",
            "created_at",
        )
        read_only_fields = fields


class ReportAdminUpdateSerializer(serializers.ModelSerializer):
    """Admin update — allows changing status and admin_notes."""

    class Meta:
        model = Report
        fields = ("status", "admin_notes", "resolved_at")

    def validate_status(self, value):
        if value not in ReportStatus.values:
            raise serializers.ValidationError("Invalid status.")
        return value
