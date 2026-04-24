"""Internal helpers shared by the books views modules."""


def _get_blocked_user_ids(user):
    """Lazy import to avoid circular dependency with trust_safety."""
    from apps.trust_safety.services import get_blocked_user_ids

    return get_blocked_user_ids(user)
