"""Book photo validator for the books app."""

import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import serializers

ALLOWED_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_OUTPUT_SIZE = 1 * 1024 * 1024  # 1 MB
MAX_DIMENSION = 1200  # px longest edge
THUMB_DIMENSION = 300  # px longest edge for list thumbnails


def validate_book_photo(uploaded_file) -> SimpleUploadedFile:
    """Validate and re-process a book photo upload.

    1. Check magic bytes (JPEG / PNG only).
    2. Reject files > 5 MB.
    3. Re-save via Pillow: strip EXIF, resize to max 1200 px longest edge,
       compress to max 1 MB JPEG output.

    Returns a new ``SimpleUploadedFile`` ready for storage.
    """
    # Size check
    if uploaded_file.size > MAX_UPLOAD_SIZE:
        raise serializers.ValidationError("Photo must be 5 MB or smaller.")

    # Read magic bytes
    header = uploaded_file.read(4)
    uploaded_file.seek(0)

    valid = False
    for magic in ALLOWED_MAGIC_BYTES:
        if header[: len(magic)] == magic:
            valid = True
            break
    if not valid:
        raise serializers.ValidationError("Only JPEG and PNG images are allowed.")

    # Open with Pillow
    try:
        img = Image.open(uploaded_file)
        img.verify()
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)
    except Exception:
        raise serializers.ValidationError("Upload is not a valid image file.") from None

    # Convert to RGB (strip alpha / palette modes)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize if needed
    w, h = img.size
    longest = max(w, h)
    if longest > MAX_DIMENSION:
        ratio = MAX_DIMENSION / longest
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    # Save as JPEG, compress until under 1 MB
    buf = io.BytesIO()
    quality = 85
    while quality >= 40:
        buf.seek(0)
        buf.truncate()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= MAX_OUTPUT_SIZE:
            break
        quality -= 10

    buf.seek(0)
    return SimpleUploadedFile(
        name="photo.jpg",
        content=buf.read(),
        content_type="image/jpeg",
    )


def generate_thumbnail(processed_file) -> SimpleUploadedFile:
    """Generate a small thumbnail (300px) from an already-validated photo."""
    processed_file.seek(0)
    img = Image.open(processed_file)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    w, h = img.size
    longest = max(w, h)
    if longest > THUMB_DIMENSION:
        ratio = THUMB_DIMENSION / longest
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=70, optimize=True)
    buf.seek(0)
    return SimpleUploadedFile(
        name="thumb.jpg",
        content=buf.read(),
        content_type="image/jpeg",
    )
