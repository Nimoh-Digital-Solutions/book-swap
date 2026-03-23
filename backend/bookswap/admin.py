from django.contrib import admin

from .models import Block, Report


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked_user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('blocker__username', 'blocked_user__username')
    raw_id_fields = ('blocker', 'blocked_user')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('reporter', 'reported_user', 'category', 'status', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = (
        'reporter__username',
        'reported_user__username',
        'description',
    )
    raw_id_fields = ('reporter', 'reported_user', 'reported_book', 'reported_exchange')
    readonly_fields = ('id', 'created_at', 'updated_at')
