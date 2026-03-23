"""URL configuration for the messaging app."""
from django.urls import path

from . import views

app_name = 'messaging'

urlpatterns = [
    # Messages for an exchange
    path(
        'exchanges/<uuid:exchange_id>/messages/',
        views.MessageViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='message-list',
    ),
    path(
        'exchanges/<uuid:exchange_id>/messages/mark-read/',
        views.MessageViewSet.as_view({'post': 'mark_read'}),
        name='message-mark-read',
    ),
    # Meetup suggestions for an exchange
    path(
        'exchanges/<uuid:exchange_id>/meetup-suggestions/',
        views.MeetupSuggestionViewSet.as_view({'get': 'list'}),
        name='meetup-suggestions',
    ),
]
