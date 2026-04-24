"""Lightweight OG-meta view for social-crawler link previews.

Social crawlers (Facebook, Twitter/X, WhatsApp, Telegram, Discord, LinkedIn,
Slack) do NOT execute JavaScript. This view returns a minimal HTML document
with the correct Open Graph meta tags so that shared book links render a
rich preview with the book title, author, cover image, and condition.

The view is exposed at ``/oembed/books/<uuid:pk>/`` and is only reached
when nginx detects a social-bot User-Agent (see nginx.conf).
"""

from django.http import Http404, HttpResponse
from django.template.loader import render_to_string

from .models import Book, BookStatus


def book_og_view(request, pk):
    """Return minimal HTML with OG meta for a single book."""
    try:
        book = (
            Book.objects.filter(status=BookStatus.AVAILABLE)
            .select_related("owner")
            .prefetch_related("photos")
            .get(pk=pk)
        )
    except Book.DoesNotExist as exc:
        raise Http404 from exc

    photo = book.photos.first()
    image_url = request.build_absolute_uri(photo.image.url) if photo else book.cover_url

    site_url = "https://book-swaps.com"
    canonical = f"{site_url}/en/books/{book.pk}"

    context = {
        "title": f"{book.title} — {book.author}",
        "description": f"{book.get_condition_display()} condition · Available for swap on BookSwap",
        "image": image_url or f"{site_url}/og-image.png",
        "url": canonical,
        "site_name": "BookSwap",
    }

    html = render_to_string("og/book_og.html", context)
    return HttpResponse(html, content_type="text/html; charset=utf-8")
