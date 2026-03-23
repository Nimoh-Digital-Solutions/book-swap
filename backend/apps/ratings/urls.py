"""URL configuration for the ratings app."""
from django.urls import path

from . import views

app_name = 'ratings'

urlpatterns = [
    path(
        'exchanges/<uuid:exchange_id>/',
        views.ExchangeRatingViewSet.as_view({'get': 'retrieve', 'post': 'create'}),
        name='exchange-rating',
    ),
    path(
        'users/<uuid:user_id>/',
        views.UserRatingsViewSet.as_view({'get': 'list'}),
        name='user-ratings',
    ),
]
