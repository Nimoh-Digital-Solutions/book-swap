"""URL configuration for bookswap."""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from nimoh_base.auth.views.social import social_login_done_view
from nimoh_base.conf.urls import nimoh_base_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),

    # nimoh_base built-in routes (auth, monitoring health, privacy, API schema)
    *nimoh_base_urlpatterns(
        include_monitoring=True,
        include_privacy=True,
        include_schema=True,
    ),

    # Social auth (Google, Apple — OAuth dance + done redirect)
    path('api/v1/auth/social/done/', social_login_done_view, name='social-auth-done'),
    path('api/v1/auth/social/', include('nimoh_base.auth.url_modules.social')),

    # Project-specific routes — add new apps here:
    path('api/v1/', include('bookswap.urls')),
    path('api/v1/exchanges/', include('apps.exchanges.urls')),
    path('api/v1/messaging/', include('apps.messaging.urls')),
    path('api/v1/ratings/', include('apps.ratings.urls')),
]

# In development, redirect the root URL to the API docs for convenience
if settings.DEBUG:
    urlpatterns += [
        path('', RedirectView.as_view(url='/api/v1/schema/docs/', permanent=False)),
    ]
