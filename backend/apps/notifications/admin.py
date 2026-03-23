"""Admin registration for the notifications app."""

from django.contrib import admin

from .models import Notification, NotificationPreferences


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("notification_type", "user", "title", "is_read", "created_at")
    list_filter = ("notification_type", "read_at")
    search_fields = ("user__email", "title", "body")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)

    @admin.display(boolean=True, description="Read")
    def is_read(self, obj: Notification) -> bool:
        return obj.read_at is not None


@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = ("user", "email_new_request", "email_new_message", "email_exchange_completed")
    search_fields = ("user__email",)
    readonly_fields = ("unsubscribe_token",)
