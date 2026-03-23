from django.contrib import admin

from .models import MeetupLocation, Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "exchange", "sender", "read_at", "created_at")
    list_filter = ("read_at",)
    search_fields = ("sender__email", "content")
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("exchange", "sender")


@admin.register(MeetupLocation)
class MeetupLocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "city", "is_active")
    list_filter = ("category", "is_active", "city")
    search_fields = ("name", "address", "city")
    readonly_fields = ("id", "created_at")
