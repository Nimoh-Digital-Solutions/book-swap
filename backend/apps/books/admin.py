from django.contrib import admin

from .models import Book, BookPhoto, WishlistItem


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'owner', 'condition', 'status', 'created_at')
    list_filter = ('status', 'condition', 'language', 'created_at')
    search_fields = ('title', 'author', 'isbn', 'owner__username')
    raw_id_fields = ('owner',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'search_vector')


@admin.register(BookPhoto)
class BookPhotoAdmin(admin.ModelAdmin):
    list_display = ('book', 'position', 'created_at')
    raw_id_fields = ('book',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'isbn', 'created_at')
    search_fields = ('user__username', 'title', 'isbn')
    raw_id_fields = ('user',)
    readonly_fields = ('id', 'created_at', 'updated_at')
