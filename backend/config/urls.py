"""URL configuration for bookswap."""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from nimoh_base.conf.urls import nimoh_base_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),

    # nimoh_base built-in routes (auth, monitoring health, privacy, API schema)
    *nimoh_base_urlpatterns(
        include_monitoring=True,
        include_privacy=True,
        include_schema=True,
    ),

    # Project-specific routes — add new apps here:
    path('api/v1/', include('bookswap.urls')),
]

# In development, redirect the root URL to the API docs for convenience
if settings.DEBUG:
    urlpatterns += [
        path('', RedirectView.as_view(url='/api/v1/schema/docs/', permanent=False)),
    ]
