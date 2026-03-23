"""Custom permissions for the books app."""

from rest_framework.permissions import BasePermission


class IsBookOwner(BasePermission):
    """Allow access only if request.user owns the book."""

    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.pk
