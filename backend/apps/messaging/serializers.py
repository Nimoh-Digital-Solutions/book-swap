"""Serializers for the messaging app."""

from rest_framework import serializers

from .models import MeetupLocation, Message


class MessageSenderSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    avatar = serializers.ImageField(allow_null=True)


class MessageSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "exchange",
            "sender",
            "content",
            "image",
            "read_at",
            "created_at",
        )
        read_only_fields = fields


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("content", "image")

    def validate(self, attrs):
        content = attrs.get("content", "")
        image = attrs.get("image")
        if not content and not image:
            raise serializers.ValidationError("A message must have either text content or an image.")
        if content and len(content) > 1000:
            raise serializers.ValidationError({"content": "Message content must be at most 1000 characters."})
        if image:
            if image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({"image": "Image must be at most 5 MB."})
            if image.content_type not in ("image/jpeg", "image/png"):
                raise serializers.ValidationError({"image": "Only JPEG and PNG images are allowed."})
            try:
                from PIL import Image as PILImage

                img = PILImage.open(image)
                img.verify()
                image.seek(0)
            except Exception as exc:
                raise serializers.ValidationError({"image": "File does not appear to be a valid image."}) from exc
        return attrs


class MeetupLocationSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = MeetupLocation
        fields = (
            "id",
            "name",
            "address",
            "category",
            "city",
            "latitude",
            "longitude",
            "distance_km",
        )

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None
