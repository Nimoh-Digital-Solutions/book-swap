"""URL configuration for the books app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "books"

router = DefaultRouter()
router.register(r"books", views.BookViewSet, basename="book")
router.register(r"wishlist", views.WishlistItemViewSet, basename="wishlist")

urlpatterns = [
    # ── Book Photos (nested under books) ─────────────────────────────
    path(
        "books/<uuid:book_pk>/photos/",
        views.BookPhotoViewSet.as_view({"post": "create"}),
        name="book-photo-create",
    ),
    path(
        "books/<uuid:book_pk>/photos/<uuid:pk>/",
        views.BookPhotoViewSet.as_view({"delete": "destroy"}),
        name="book-photo-delete",
    ),
    path(
        "books/<uuid:book_pk>/photos/reorder/",
        views.BookPhotoViewSet.as_view({"patch": "reorder"}),
        name="book-photo-reorder",
    ),
    # ── ISBN / External Search ────────────────────────────────────────
    path("books/isbn-lookup/", views.ISBNLookupView.as_view(), name="isbn-lookup"),
    path("books/search-external/", views.ExternalSearchView.as_view(), name="external-search"),
    # ── Browse / Discovery ───────────────────────────────────────────
    path(
        "books/browse/",
        views.BrowseViewSet.as_view({"get": "list"}),
        name="browse-list",
    ),
    path(
        "books/browse/radius-counts/",
        views.BrowseViewSet.as_view({"get": "radius_counts"}),
        name="browse-radius-counts",
    ),
    path("books/nearby-count/", views.NearbyCountView.as_view(), name="nearby-count"),
    # ── Router-generated Book & Wishlist CRUD ─────────────────────────
    path("", include(router.urls)),
]
