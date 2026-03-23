"""URL configuration for the notifications app."""

from django.urls import path

app_name = 'notifications'

from .views import (
    MarkAllReadView,
    MarkNotificationReadView,
    NotificationListView,
    NotificationPreferencesView,
    UnsubscribeView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('preferences/', NotificationPreferencesView.as_view(), name='notification-preferences'),
    path('unsubscribe/<str:token>/', UnsubscribeView.as_view(), name='notification-unsubscribe'),
    path('<uuid:pk>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]
