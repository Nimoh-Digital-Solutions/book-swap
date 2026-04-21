"""Serializers for the ratings app."""

from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import RATABLE_STATUSES, RATING_WINDOW_DAYS, Rating
from .utils import is_profane


class RatingUserSerializer(serializers.Serializer):
    """Minimal user representation for rating responses."""

    id = serializers.UUIDField()
    username = serializers.CharField()
    avatar = serializers.ImageField(allow_null=True)


class RatingSerializer(serializers.ModelSerializer):
    """Read serializer for ratings."""

    rater = RatingUserSerializer(read_only=True)
    rated = RatingUserSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = (
            "id",
            "exchange",
            "rater",
            "rated",
            "score",
            "comment",
            "created_at",
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if instance.is_flagged:
            is_own = request and request.user.id == instance.rater_id
            is_admin = request and request.user.is_staff
            if not is_own and not is_admin:
                data["comment"] = ""
        return data


class RatingCreateSerializer(serializers.Serializer):
    """Write serializer for submitting a rating."""

    score = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=300, required=False, default="")

    def validate(self, attrs):
        exchange = self.context["exchange"]
        request = self.context["request"]

        if exchange.status not in RATABLE_STATUSES:
            raise serializers.ValidationError(
                {"exchange": "Ratings are only allowed for completed or returned exchanges."},
            )

        anchor = exchange.completed_at or exchange.updated_at
        deadline = anchor + timedelta(days=RATING_WINDOW_DAYS)
        if timezone.now() > deadline:
            raise serializers.ValidationError(
                {"exchange": "The 30-day rating window has expired."},
            )

        if Rating.objects.filter(exchange=exchange, rater=request.user).exists():
            raise serializers.ValidationError(
                {"exchange": "You have already rated this exchange."},
            )

        attrs["comment"] = attrs.get("comment", "").strip()
        return attrs

    def create(self, validated_data):
        from django.db import IntegrityError

        exchange = self.context["exchange"]
        rater = self.context["request"].user

        rated_id = exchange.owner_id if rater.id == exchange.requester_id else exchange.requester_id

        is_flagged = is_profane(validated_data.get("comment", ""))

        try:
            return Rating.objects.create(
                exchange=exchange,
                rater=rater,
                rated_id=rated_id,
                score=validated_data["score"],
                comment=validated_data.get("comment", ""),
                is_flagged=is_flagged,
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {"exchange": "You have already rated this exchange."},
            ) from None


class ExchangeRatingStatusSerializer(serializers.Serializer):
    """Rating status for a specific exchange from the current user's perspective."""

    exchange_id = serializers.UUIDField()
    my_rating = RatingSerializer(allow_null=True)
    partner_rating = RatingSerializer(allow_null=True)
    can_rate = serializers.BooleanField()
    rating_deadline = serializers.DateTimeField()
