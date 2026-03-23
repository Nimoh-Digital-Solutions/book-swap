"""Permissions for the ratings app."""

from rest_framework.permissions import BasePermission

RATABLE_STATUSES = frozenset({"completed", "returned"})


class IsExchangeParticipantForRating(BasePermission):
    """Allow access only to the requester or owner of the exchange."""

    def has_permission(self, request, view):
        exchange = getattr(view, "exchange", None)
        if exchange is None:
            return False
        return request.user.id in (exchange.requester_id, exchange.owner_id)
