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
    path('users/me/data-export/', views.DataExportView.as_view(), name='user-data-export'),
    path('users/check-username/', views.CheckUsernameView.as_view(), name='user-check-username'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # ── Block / Unblock (Epic 8 — US-801) ────────────────────────────
    path('users/block/', views.BlockViewSet.as_view({'get': 'list', 'post': 'create'}), name='block-list-create'),
    path('users/block/<uuid:pk>/', views.BlockViewSet.as_view({'delete': 'destroy'}), name='block-destroy'),

    # ── Reports (Epic 8 — US-802) ────────────────────────────────────
    path('reports/', views.ReportCreateView.as_view(), name='report-create'),
    path('reports/admin/', views.ReportAdminListView.as_view(), name='report-admin-list'),
    path('reports/admin/<uuid:pk>/', views.ReportAdminUpdateView.as_view(), name='report-admin-update'),

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

    # ── Browse / Discovery (Epic 4) ──────────────────────────────────
    path(
        'books/browse/',
        views.BrowseViewSet.as_view({'get': 'list'}),
        name='browse-list',
    ),
    path(
        'books/browse/radius-counts/',
        views.BrowseViewSet.as_view({'get': 'radius_counts'}),
        name='browse-radius-counts',
    ),
    path('books/nearby-count/', views.NearbyCountView.as_view(), name='nearby-count'),

    # ── Router-generated Book & Wishlist CRUD ─────────────────────────
    path('', include(router.urls)),
]
