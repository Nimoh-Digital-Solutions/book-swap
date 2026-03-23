"""URL configuration for the trust_safety app."""
from django.urls import path

from . import views

app_name = 'trust_safety'

urlpatterns = [
    # ── Block / Unblock (Epic 8 — US-801) ────────────────────────────
    path('users/block/', views.BlockViewSet.as_view({'get': 'list', 'post': 'create'}), name='block-list-create'),
    path('users/block/<uuid:pk>/', views.BlockViewSet.as_view({'delete': 'destroy'}), name='block-destroy'),

    # ── Reports (Epic 8 — US-802) ────────────────────────────────────
    path('reports/', views.ReportCreateView.as_view(), name='report-create'),
    path('reports/admin/', views.ReportAdminListView.as_view(), name='report-admin-list'),
    path('reports/admin/<uuid:pk>/', views.ReportAdminUpdateView.as_view(), name='report-admin-update'),
]
