"""URL configuration for bookswap."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from nimoh_base.auth.views.social import social_login_done_view
from nimoh_base.conf.urls import nimoh_base_urlpatterns

from bookswap.views import login_view

urlpatterns = [
    path("admin/", admin.site.urls),
    # US-104 AC4: project-level login view returns 423 for locked accounts.
    # Must be placed before nimoh_base_urlpatterns to take precedence.
    path("api/v1/auth/login/", login_view, name="login"),
    # nimoh_base built-in routes (auth, monitoring health, privacy, API schema)
    *nimoh_base_urlpatterns(
        include_monitoring=True,
        include_privacy=True,
        include_schema=True,
    ),
    # Social auth (Google, Apple — OAuth dance + done redirect)
    path("api/v1/auth/social/done/", social_login_done_view, name="social-auth-done"),
    # Include social_django.urls directly (not via nimoh_base wrapper) so PSA can
    # reverse 'social:complete' without double-namespace nesting.
    path("api/v1/auth/social/", include("social_django.urls", namespace="social")),
    # Project-specific routes — add new apps here:
    path("api/v1/", include("bookswap.urls")),
    path("api/v1/", include("apps.books.urls")),
    path("api/v1/", include("apps.trust_safety.urls")),
    path("api/v1/exchanges/", include("apps.exchanges.urls")),
    path("api/v1/messaging/", include("apps.messaging.urls")),
    path("api/v1/ratings/", include("apps.ratings.urls")),
]

# In development, redirect the root URL to the API docs for convenience
if settings.DEBUG:
    urlpatterns += [
        path("", RedirectView.as_view(url="/api/v1/schema/docs/", permanent=False)),
    ]

# Serve media files via Django in all environments.
# WhiteNoise handles static files; media files must be served separately
# since there is no separate nginx in front of Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    from django.views.static import serve as _serve_static

    urlpatterns += [
        path(
            "media/<path:path>",
            lambda request, path: _serve_static(request, path, document_root=settings.MEDIA_ROOT),
        ),
    ]
