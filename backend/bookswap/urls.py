"""URL configuration for the bookswap app — user profile, onboarding, and account endpoints."""
from django.urls import include, path

from . import views

app_name = 'bookswap'

urlpatterns = [
    # ── User / Profile ────────────────────────────────────────────────
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/me/location/', views.SetLocationView.as_view(), name='user-set-location'),
    path('users/me/onboarding/complete/', views.OnboardingCompleteView.as_view(), name='user-onboarding-complete'),
    path('users/me/delete/', views.AccountDeletionRequestView.as_view(), name='user-delete-request'),
    path('users/me/delete/cancel/', views.AccountDeletionCancelView.as_view(), name='user-delete-cancel'),
    path('users/me/data-export/', views.DataExportView.as_view(), name='user-data-export'),
    path('users/check-username/', views.CheckUsernameView.as_view(), name='user-check-username'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # ── Notifications ─────────────────────────────────────────────────
    path('notifications/', include('apps.notifications.urls', namespace='notifications')),
]
