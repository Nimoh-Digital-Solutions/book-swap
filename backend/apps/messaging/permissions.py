"""Custom permissions for the messaging app."""
from rest_framework.permissions import BasePermission

# Exchange statuses that allow sending new messages.
CHAT_WRITABLE_STATUSES = frozenset({'active', 'swap_confirmed'})

# Exchange statuses that allow viewing the chat (read-only or writable).
CHAT_ELIGIBLE_STATUSES = frozenset({
    'active', 'swap_confirmed', 'completed',
    'return_requested', 'returned',
})


class IsExchangeParticipantForChat(BasePermission):
    """
    Allow access only to the requester or owner of the exchange.

    Expects the view to have `self.exchange` set (see MessageViewSet).
    """

    def has_permission(self, request, view):
        exchange = getattr(view, 'exchange', None)
        if exchange is None:
            return False
        return request.user.id in (exchange.requester_id, exchange.owner_id)
