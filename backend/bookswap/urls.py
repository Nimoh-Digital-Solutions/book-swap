"""URL configuration for the bookswap app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'bookswap'

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'wishlist', views.WishlistItemViewSet, basename='wishlist')

urlpatterns = [
    # ── User / Profile (Epic 1 & 2) ──────────────────────────────────
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/me/location/', views.SetLocationView.as_view(), name='user-set-location'),
    path('users/me/onboarding/complete/', views.OnboardingCompleteView.as_view(), name='user-onboarding-complete'),
    path('users/me/delete/', views.AccountDeletionRequestView.as_view(), name='user-delete-request'),
    path('users/me/delete/cancel/', views.AccountDeletionCancelView.as_view(), name='user-delete-cancel'),
    path('users/check-username/', views.CheckUsernameView.as_view(), name='user-check-username'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # ── Book Photos (nested under books) ─────────────────────────────
    path(
        'books/<uuid:book_pk>/photos/',
        views.BookPhotoViewSet.as_view({'post': 'create'}),
        name='book-photo-create',
    ),
    path(
        'books/<uuid:book_pk>/photos/<uuid:pk>/',
        views.BookPhotoViewSet.as_view({'delete': 'destroy'}),
        name='book-photo-delete',
    ),
    path(
        'books/<uuid:book_pk>/photos/reorder/',
        views.BookPhotoViewSet.as_view({'patch': 'reorder'}),
        name='book-photo-reorder',
    ),

    # ── ISBN / External Search ────────────────────────────────────────
    path('books/isbn-lookup/', views.ISBNLookupView.as_view(), name='isbn-lookup'),
    path('books/search-external/', views.ExternalSearchView.as_view(), name='external-search'),

    # ── Router-generated Book & Wishlist CRUD ─────────────────────────
    path('', include(router.urls)),
]
