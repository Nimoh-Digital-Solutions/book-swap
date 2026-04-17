"""Serializers for the bookswap app."""

import re

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.gis.geos import Point
from django.utils import timezone
from rest_framework import serializers

from .services import GeocodingError, NominatimGeocodingService
from .utils import snap_to_grid
from .validators import validate_dutch_postcode, validate_minimum_age

User = get_user_model()


class UserPrivateSerializer(serializers.ModelSerializer):
    """Full profile for the authenticated user (GET /users/me/)."""

    location = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "date_of_birth",
            "bio",
            "avatar",
            "location",
            "neighborhood",
            "preferred_genres",
            "preferred_language",
            "preferred_radius",
            "avg_rating",
            "swap_count",
            "rating_count",
            "auth_provider",
            "onboarding_completed",
            "email_verified",
            "member_since",
            "profile_public",
        )
        read_only_fields = (
            "id",
            "email",
            "username",
            "avg_rating",
            "swap_count",
            "rating_count",
            "auth_provider",
            "onboarding_completed",
            "email_verified",
            "member_since",
        )

    def get_location(self, obj) -> dict | None:
        return snap_to_grid(obj.location)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Partial update serializer for PATCH /users/me/."""

    ALLOWED_AVATAR_TYPES = ("image/jpeg", "image/png")
    MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2 MB

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "bio",
            "avatar",
            "preferred_genres",
            "preferred_language",
            "preferred_radius",
            "profile_public",
        )

    def validate_avatar(self, value):
        if value is None:
            return value
        if value.content_type not in self.ALLOWED_AVATAR_TYPES:
            raise serializers.ValidationError("Only JPEG and PNG images are allowed.")
        if value.size > self.MAX_AVATAR_SIZE:
            raise serializers.ValidationError("Avatar must be 2 MB or smaller.")
        return value

    def validate_preferred_genres(self, value):
        if len(value) > 5:
            raise serializers.ValidationError("You can select up to 5 genres.")
        return value

    def validate_preferred_language(self, value):
        if value not in ("en", "nl", "both"):
            raise serializers.ValidationError("Language must be 'en', 'nl', or 'both'.")
        return value

    def validate_preferred_radius(self, value):
        if value < 500 or value > 50_000:
            raise serializers.ValidationError("Radius must be between 500 and 50000 metres.")
        return value


class UserPublicSerializer(serializers.ModelSerializer):
    """Public profile — no email, no DOB, snapped location."""

    location = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source="created_at", read_only=True)
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "bio",
            "avatar",
            "location",
            "neighborhood",
            "preferred_genres",
            "preferred_language",
            "avg_rating",
            "swap_count",
            "rating_count",
            "member_since",
        )

    def get_location(self, obj) -> dict | None:
        return snap_to_grid(obj.location)

    def get_avg_rating(self, obj):
        """Only expose avg_rating when the user has 3+ ratings."""
        if obj.rating_count >= 3:
            return float(obj.avg_rating)
        return None


class SetLocationSerializer(serializers.Serializer):
    """Accept either postcode or lat/lng pair for location setup."""

    postcode = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)

    def validate_postcode(self, value):
        if value:
            return validate_dutch_postcode(value)
        return value

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate(self, attrs):
        postcode = attrs.get("postcode")
        lat = attrs.get("latitude")
        lng = attrs.get("longitude")

        has_postcode = bool(postcode)
        has_coords = lat is not None and lng is not None

        if not has_postcode and not has_coords:
            raise serializers.ValidationError("Provide either 'postcode' or both 'latitude' and 'longitude'.")

        if has_coords and (lat is None or lng is None):
            raise serializers.ValidationError("Both 'latitude' and 'longitude' are required when using coordinates.")

        return attrs

    def save(self, user):
        """Resolve location and update user."""
        postcode = self.validated_data.get("postcode")
        lat = self.validated_data.get("latitude")
        lng = self.validated_data.get("longitude")

        geocoder = NominatimGeocodingService()

        if postcode:
            try:
                point = geocoder.geocode_postcode(postcode)
            except GeocodingError as exc:
                raise serializers.ValidationError({"postcode": str(exc)}) from exc
        else:
            point = Point(lng, lat, srid=4326)

        neighborhood = geocoder.reverse_geocode_neighborhood(point)

        user.location = point
        user.neighborhood = neighborhood
        user.save(update_fields=["location", "neighborhood"])

        from apps.messaging.tasks import populate_meetup_locations

        populate_meetup_locations.delay(point.y, point.x)

        return user


class OnboardingCompleteSerializer(serializers.Serializer):
    """Validates that onboarding prerequisites are met."""

    def validate(self, attrs):
        user = self.context["request"].user
        if user.location is None:
            raise serializers.ValidationError("You must set your location before completing onboarding.")
        return attrs

    def save(self, user):
        user.onboarding_completed = True
        user.save(update_fields=["onboarding_completed"])
        return user


class BookswapRegisterSerializer(serializers.Serializer):
    """Extends nimoh-base registration with date_of_birth for age gate.

    This serializer wraps the nimoh-base ``UserRegistrationSerializer``
    and adds the ``date_of_birth`` field with under-16 validation.
    The actual user creation is delegated to nimoh-base.
    """

    date_of_birth = serializers.DateField(required=True)

    # Pass-through fields for nimoh-base
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True, required=False)
    confirmPassword = serializers.CharField(write_only=True, required=False)
    privacy_policy_accepted = serializers.BooleanField()
    terms_of_service_accepted = serializers.BooleanField()
    display_name = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    firstName = serializers.CharField(required=False, allow_blank=True)
    lastName = serializers.CharField(required=False, allow_blank=True)

    def validate_date_of_birth(self, value):
        validate_minimum_age(value)
        return value


# ── Username availability (US-201 AC2) ────────────────────────────────


class CheckUsernameSerializer(serializers.Serializer):
    """Validate and check username availability."""

    q = serializers.CharField(min_length=3, max_length=30)

    def validate_q(self, value):
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError("Username may only contain letters, numbers, and underscores.")
        return value.lower()


# ── Account deletion (US-203) ─────────────────────────────────────────


class AccountDeletionRequestSerializer(serializers.Serializer):
    """Request account deletion — requires password confirmation."""

    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context["request"].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Incorrect password.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if user.deletion_requested_at is not None:
            raise serializers.ValidationError("Account deletion has already been requested.")
        return attrs

    def save(self):
        user = self.context["request"].user
        user.deletion_requested_at = timezone.now()
        user.is_active = False
        user.save(update_fields=["deletion_requested_at", "is_active"])
