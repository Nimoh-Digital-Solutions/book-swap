"""Serializers for the books app."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from bookswap.utils import snap_to_grid

from .models import Book, BookPhoto, WishlistItem

User = get_user_model()


class BookOwnerSerializer(serializers.ModelSerializer):
    """Minimal owner info nested inside book responses."""

    class Meta:
        model = User
        fields = ("id", "username", "avatar", "neighborhood", "avg_rating")
        read_only_fields = fields


class BookPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookPhoto
        fields = ("id", "image", "position", "created_at")
        read_only_fields = ("id", "created_at")


class BookListSerializer(serializers.ModelSerializer):
    """Compact book data for list/card views."""

    owner = BookOwnerSerializer(read_only=True)
    primary_photo = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "author",
            "cover_url",
            "condition",
            "language",
            "status",
            "swap_type",
            "primary_photo",
            "owner",
            "created_at",
        )
        read_only_fields = fields

    def get_primary_photo(self, obj) -> str | None:
        first = obj.photos.first()
        if first and first.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first.image.url)
            return first.image.url
        return None


class BookSerializer(serializers.ModelSerializer):
    """Full book detail with all photos and owner info."""

    owner = BookOwnerSerializer(read_only=True)
    photos = BookPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = (
            "id",
            "isbn",
            "title",
            "author",
            "description",
            "cover_url",
            "condition",
            "genres",
            "language",
            "status",
            "swap_type",
            "notes",
            "page_count",
            "publish_year",
            "photos",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "photos",
            "created_at",
            "updated_at",
        )


class BookCreateSerializer(serializers.ModelSerializer):
    """Create a new book listing. Owner is set from request.user."""

    class Meta:
        model = Book
        fields = (
            "isbn",
            "title",
            "author",
            "description",
            "cover_url",
            "condition",
            "genres",
            "language",
            "swap_type",
            "notes",
            "page_count",
            "publish_year",
        )

    def validate_genres(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("You can select up to 3 genres.")
        return value

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class BookUpdateSerializer(serializers.ModelSerializer):
    """Partial update for a book listing (owner only)."""

    class Meta:
        model = Book
        fields = (
            "title",
            "author",
            "description",
            "cover_url",
            "condition",
            "genres",
            "language",
            "swap_type",
            "notes",
            "page_count",
            "publish_year",
            "status",
        )

    def validate_genres(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("You can select up to 3 genres.")
        return value


class PhotoReorderSerializer(serializers.Serializer):
    """Accept a list of photo IDs in desired order."""

    photo_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=3,
    )


class ISBNLookupSerializer(serializers.Serializer):
    """Validate ISBN query parameter."""

    isbn = serializers.CharField(min_length=10, max_length=20)

    def validate_isbn(self, value):
        cleaned = value.replace("-", "").replace(" ", "")
        if len(cleaned) not in (10, 13) or not cleaned.replace("X", "").isdigit():
            raise serializers.ValidationError("Enter a valid ISBN-10 or ISBN-13.")
        return cleaned


class ExternalSearchSerializer(serializers.Serializer):
    """Validate search query parameter."""

    q = serializers.CharField(min_length=2, max_length=200)


class WishlistItemSerializer(serializers.ModelSerializer):
    book_id = serializers.UUIDField(source="book.id", read_only=True, default=None)
    book = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = ("id", "book", "book_id", "isbn", "title", "author", "genre", "cover_url", "created_at")
        read_only_fields = ("id", "book_id", "created_at")

    def validate(self, attrs):
        book = attrs.get("book")
        if not book:
            isbn = attrs.get("isbn", "")
            title = attrs.get("title", "")
            genre = attrs.get("genre", "")
            if not any([isbn, title, genre]):
                raise serializers.ValidationError("At least one of 'isbn', 'title', or 'genre' is required.")
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        if user.wishlist_items.count() >= 20:
            raise serializers.ValidationError("You can have up to 20 wishlist items.")

        book = validated_data.get("book")
        if book and WishlistItem.objects.filter(user=user, book=book).exists():
            raise serializers.ValidationError("This book is already on your wishlist.")

        validated_data["user"] = user
        return super().create(validated_data)


# ── Browse / Discovery ────────────────────────────────────────────────────────


class BrowseBookOwnerSerializer(BookOwnerSerializer):
    """Owner info with snapped location for map pins in browse results."""

    location = serializers.SerializerMethodField()

    class Meta(BookOwnerSerializer.Meta):
        fields = (*BookOwnerSerializer.Meta.fields, "location")
        read_only_fields = fields

    def get_location(self, obj) -> dict | None:
        return snap_to_grid(obj.location)


class BrowseBookListSerializer(BookListSerializer):
    """Extends BookListSerializer with distance (km) and owner location for browse."""

    owner = BrowseBookOwnerSerializer(read_only=True)
    distance = serializers.SerializerMethodField()

    class Meta(BookListSerializer.Meta):
        fields = (*BookListSerializer.Meta.fields, "distance")
        read_only_fields = fields

    def get_distance(self, obj) -> float | None:
        d = getattr(obj, "distance", None)
        if d is not None:
            return round(d.m / 1000, 1)
        return None


class BrowseFilterSerializer(serializers.Serializer):
    """Validate query params for the browse endpoint."""

    radius = serializers.IntegerField(min_value=500, max_value=50000, required=False)
    lat = serializers.FloatField(min_value=-90, max_value=90, required=False)
    lng = serializers.FloatField(min_value=-180, max_value=180, required=False)
    search = serializers.CharField(max_length=200, required=False, allow_blank=True)
    genre = serializers.CharField(max_length=500, required=False)
    language = serializers.CharField(max_length=100, required=False)
    condition = serializers.CharField(max_length=200, required=False)
    ordering = serializers.ChoiceField(
        choices=["distance", "-created_at", "relevance"],
        required=False,
    )
