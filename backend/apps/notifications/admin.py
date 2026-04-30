"""Admin registration for the notifications app."""

from django.contrib import admin

from .models import MobileDevice, Notification, NotificationPreferences, PushTicket


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


@admin.register(MobileDevice)
class MobileDeviceAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "device_name", "is_active", "created_at")
    list_filter = ("platform", "is_active")
    search_fields = ("user__email", "device_name", "push_token")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PushTicket)
class PushTicketAdmin(admin.ModelAdmin):
    list_display = ("ticket_id_short", "user", "status", "error_code", "notification_type", "created_at", "checked_at")
    list_filter = ("status", "notification_type")
    search_fields = ("ticket_id", "user__email", "push_token", "error_code")
    readonly_fields = ("id", "ticket_id", "push_token", "created_at", "checked_at")
    ordering = ("-created_at",)

    @admin.display(description="Ticket id")
    def ticket_id_short(self, obj: PushTicket) -> str:
        return f"{obj.ticket_id[:12]}…" if obj.ticket_id else "—"
