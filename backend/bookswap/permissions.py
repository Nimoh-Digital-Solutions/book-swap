"""Custom permissions for bookswap."""
from rest_framework.permissions import BasePermission


class IsBookOwner(BasePermission):
    """Allow access only if request.user owns the book."""

    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.pk


class IsEmailVerified(BasePermission):
    """Allow access only to users with a verified email address.

    OAuth / social-login users are considered verified automatically.
    """

    message = 'Please verify your email address before performing this action.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_social_account', False):
            return True
        return getattr(user, 'email_verified', False)
