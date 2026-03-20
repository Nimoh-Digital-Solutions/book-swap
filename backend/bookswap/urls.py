"""URL configuration for the bookswap app."""
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# Register viewsets here, e.g.:
# router.register(r'items', ItemViewSet, basename='item')

app_name = 'bookswap'

urlpatterns = [
    *router.urls,
    # Extra non-router paths go here, e.g.:
    # path('stats/', views.stats, name='stats'),
]
