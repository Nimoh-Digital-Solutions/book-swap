"""Serializers for the exchanges app."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.books.models import Book, BookStatus

from .models import ConditionsAcceptance, DeclineReason, ExchangeRequest

User = get_user_model()


# ── Nested read-only serializers ──────────────────────────────────────────────


class ExchangeParticipantSerializer(serializers.ModelSerializer):
    """Compact user info nested inside exchange responses."""

    class Meta:
        model = User
        fields = ("id", "username", "avatar", "avg_rating", "swap_count")
        read_only_fields = fields


class ExchangeBookSerializer(serializers.ModelSerializer):
    """Compact book info nested inside exchange responses."""

    primary_photo = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ("id", "title", "author", "cover_url", "condition", "primary_photo")
        read_only_fields = fields

    def get_primary_photo(self, obj) -> str | None:
        first = obj.photos.first()
        if first and first.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first.image.url)
            return first.image.url
        return None


# ── List / Detail serializers ─────────────────────────────────────────────────


class ExchangeRequestListSerializer(serializers.ModelSerializer):
    """Compact exchange data for list views."""

    requester = ExchangeParticipantSerializer(read_only=True)
    owner = ExchangeParticipantSerializer(read_only=True)
    requested_book = ExchangeBookSerializer(read_only=True)
    offered_book = ExchangeBookSerializer(read_only=True)
    unread_count = serializers.IntegerField(read_only=True, default=0)
    last_message_at = serializers.DateTimeField(read_only=True, default=None)
    last_message_preview = serializers.CharField(read_only=True, default="")

    class Meta:
        model = ExchangeRequest
        fields = (
            "id",
            "status",
            "message",
            "created_at",
            "updated_at",
            "requester",
            "owner",
            "requested_book",
            "offered_book",
            "unread_count",
            "last_message_at",
            "last_message_preview",
        )
        read_only_fields = fields


class ExchangeRequestDetailSerializer(ExchangeRequestListSerializer):
    """Full exchange detail with conditions and confirmation info."""

    original_offered_book = ExchangeBookSerializer(read_only=True)
    last_counter_by = serializers.PrimaryKeyRelatedField(read_only=True)
    conditions_accepted_by_me = serializers.SerializerMethodField()
    conditions_accepted_count = serializers.SerializerMethodField()
    conditions_version = serializers.SerializerMethodField()

    class Meta(ExchangeRequestListSerializer.Meta):
        fields = (
            *ExchangeRequestListSerializer.Meta.fields,
            "decline_reason",
            "counter_to",
            "original_offered_book",
            "last_counter_by",
            "counter_approved_at",
            "requester_confirmed_at",
            "owner_confirmed_at",
            "return_requested_at",
            "return_confirmed_requester",
            "return_confirmed_owner",
            "expired_at",
            "conditions_accepted_by_me",
            "conditions_accepted_count",
            "conditions_version",
        )
        read_only_fields = fields

    def get_conditions_accepted_by_me(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.conditions_acceptances.filter(user=request.user).exists()

    def get_conditions_accepted_count(self, obj) -> int:
        return obj.conditions_acceptances.count()

    def get_conditions_version(self, obj) -> str:
        return ConditionsAcceptance.CURRENT_VERSION


# ── Create / Action serializers ───────────────────────────────────────────────


class ExchangeRequestCreateSerializer(serializers.Serializer):
    """Validate and create a new exchange request."""

    requested_book_id = serializers.UUIDField()
    offered_book_id = serializers.UUIDField()
    message = serializers.CharField(max_length=200, required=False, default="")

    def validate_requested_book_id(self, value):
        try:
            book = Book.objects.select_related("owner").get(pk=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.") from None
        if book.owner_id == self.context["request"].user.pk:
            raise serializers.ValidationError("You cannot request your own book.")
        if book.status != BookStatus.AVAILABLE:
            raise serializers.ValidationError("This book is not available for exchange.")
        self._requested_book = book
        return value

    def validate_offered_book_id(self, value):
        try:
            book = Book.objects.get(pk=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.") from None
        if book.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError("You can only offer your own books.")
        if book.status != BookStatus.AVAILABLE:
            raise serializers.ValidationError("This book is not available for exchange.")
        self._offered_book = book
        return value

    def validate(self, attrs):
        if attrs["requested_book_id"] == attrs["offered_book_id"]:
            raise serializers.ValidationError("Requested and offered books must be different.")

        terminal_statuses = {"cancelled", "expired", "declined", "completed", "returned"}
        active_exchange = ExchangeRequest.objects.filter(
            requester=self.context["request"].user,
            requested_book_id=attrs["requested_book_id"],
        ).exclude(status__in=terminal_statuses).first()
        if active_exchange:
            raise serializers.ValidationError(
                f"You already have an active exchange for this book (status: {active_exchange.status})."
            )

        return attrs

    def create(self, validated_data):
        from django.db import IntegrityError

        try:
            return ExchangeRequest.objects.create(
                requester=self.context["request"].user,
                owner=self._requested_book.owner,
                requested_book=self._requested_book,
                offered_book=self._offered_book,
                message=validated_data.get("message", ""),
            )
        except IntegrityError:
            raise serializers.ValidationError("You already have a pending request for this book.") from None


class CounterProposeSerializer(serializers.Serializer):
    """Validate counter-proposal: pick a book from the other party's shelf."""

    offered_book_id = serializers.UUIDField()

    def validate_offered_book_id(self, value):
        exchange = self.context["exchange"]
        user = self.context["request"].user

        is_owner = user.pk == exchange.owner_id
        is_requester = user.pk == exchange.requester_id
        if not is_owner and not is_requester:
            raise serializers.ValidationError("You are not a participant of this exchange.")

        other_user_id = exchange.requester_id if is_owner else exchange.owner_id

        try:
            book = Book.objects.get(pk=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.") from None
        if book.owner_id != other_user_id:
            raise serializers.ValidationError("You must pick a book from the other party's shelf.")
        if book.status != BookStatus.AVAILABLE:
            raise serializers.ValidationError("This book is not available for exchange.")
        if book.pk == exchange.offered_book_id:
            raise serializers.ValidationError("Pick a different book from the current offer.")
        self._offered_book = book
        return value


class DeclineSerializer(serializers.Serializer):
    """Validate decline action with optional reason."""

    reason = serializers.ChoiceField(
        choices=DeclineReason.choices,
        required=False,
        allow_blank=True,
    )


class ConditionsAcceptanceSerializer(serializers.ModelSerializer):
    """Read-only serializer for conditions acceptance records."""

    class Meta:
        model = ConditionsAcceptance
        fields = ("id", "exchange", "user", "accepted_at", "conditions_version")
        read_only_fields = fields
