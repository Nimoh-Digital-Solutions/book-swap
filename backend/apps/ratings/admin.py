from django.contrib import admin

from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('rater', 'rated', 'score', 'is_flagged', 'created_at')
    list_filter = ('score', 'is_flagged')
    search_fields = ('rater__username', 'rated__username', 'comment')
    readonly_fields = ('id', 'exchange', 'rater', 'rated', 'score', 'comment', 'created_at')
    raw_id_fields = ('exchange', 'rater', 'rated')
