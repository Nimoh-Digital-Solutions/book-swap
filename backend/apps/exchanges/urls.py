"""URL configuration for the exchanges app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "exchanges"

router = DefaultRouter()
router.register(r"", views.ExchangeRequestViewSet, basename="exchange")

urlpatterns = [
    path("", include(router.urls)),
]
