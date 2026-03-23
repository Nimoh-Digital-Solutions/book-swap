"""Custom permissions for the exchanges app."""

from rest_framework.permissions import BasePermission


class IsExchangeParticipant(BasePermission):
    """Allow access only to the requester or owner of the exchange."""

    def has_object_permission(self, request, view, obj):
        return request.user.id in (obj.requester_id, obj.owner_id)


class IsExchangeOwner(BasePermission):
    """Allow access only to the owner (book holder) of the exchange."""

    def has_object_permission(self, request, view, obj):
        return request.user.id == obj.owner_id


class IsExchangeRequester(BasePermission):
    """Allow access only to the requester who initiated the exchange."""

    def has_object_permission(self, request, view, obj):
        return request.user.id == obj.requester_id
