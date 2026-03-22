"""URL configuration for the bookswap app."""
from django.urls import path

from . import views

app_name = 'bookswap'

urlpatterns = [
    path('users/me/', views.UserMeView.as_view(), name='user-me'),
    path('users/me/location/', views.SetLocationView.as_view(), name='user-set-location'),
    path('users/me/onboarding/complete/', views.OnboardingCompleteView.as_view(), name='user-onboarding-complete'),
    path('users/me/delete/', views.AccountDeletionRequestView.as_view(), name='user-delete-request'),
    path('users/me/delete/cancel/', views.AccountDeletionCancelView.as_view(), name='user-delete-cancel'),
    path('users/check-username/', views.CheckUsernameView.as_view(), name='user-check-username'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
