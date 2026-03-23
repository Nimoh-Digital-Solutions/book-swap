from django.contrib import admin

from .models import ConditionsAcceptance, ExchangeRequest


@admin.register(ExchangeRequest)
class ExchangeRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'requester', 'owner', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('requester__email', 'owner__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('requester', 'owner', 'requested_book', 'offered_book', 'counter_to')


@admin.register(ConditionsAcceptance)
class ConditionsAcceptanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'exchange', 'user', 'conditions_version', 'accepted_at')
    readonly_fields = ('id', 'accepted_at')
    raw_id_fields = ('exchange', 'user')
