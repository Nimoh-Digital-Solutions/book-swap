"""Book photo upload, delete and reorder viewset."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Book, BookPhoto
from ..permissions import IsBookOwner
from ..serializers import BookPhotoSerializer, PhotoReorderSerializer
from ..validators import generate_thumbnail, validate_book_photo


class BookPhotoViewSet(viewsets.GenericViewSet):
    """Upload, delete, and reorder photos for a book.

    Nested under ``/books/{book_pk}/photos/``.
    """

    permission_classes = (IsAuthenticated, IsBookOwner)
    parser_classes = (MultiPartParser, JSONParser)
    serializer_class = BookPhotoSerializer

    def get_book(self):
        book = Book.objects.get(pk=self.kwargs["book_pk"])
        self.check_object_permissions(self.request, book)
        return book

    def create(self, request, book_pk=None):
        """Upload a photo for the book. Max 3."""
        book = self.get_book()
        if book.photos.count() >= 3:
            return Response(
                {"detail": "A book can have at most 3 photos."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        uploaded = request.FILES.get("image")
        if not uploaded:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        processed = validate_book_photo(uploaded)
        thumb = generate_thumbnail(processed)
        position = book.photos.count()
        photo = BookPhoto.objects.create(book=book, image=processed, thumbnail=thumb, position=position)
        return Response(
            BookPhotoSerializer(photo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, book_pk=None, pk=None):
        """Delete a photo."""
        book = self.get_book()
        try:
            photo = book.photos.get(pk=pk)
        except BookPhoto.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["patch"], url_path="reorder", parser_classes=[JSONParser])
    def reorder(self, request, book_pk=None):
        """Reorder photos by providing an ordered list of photo IDs."""
        book = self.get_book()
        serializer = PhotoReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photo_ids = serializer.validated_data["photo_ids"]

        photos = list(book.photos.all())
        photo_map = {p.pk: p for p in photos}

        if set(photo_ids) != set(photo_map.keys()):
            return Response(
                {"detail": "Provided IDs must match the book's current photos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for position, pid in enumerate(photo_ids):
            photo_map[pid].position = position
        BookPhoto.objects.bulk_update(photos, ["position"])

        return Response(BookPhotoSerializer(book.photos.all(), many=True, context={"request": request}).data)
