"""Trust & Safety services."""


def get_blocked_user_ids(user) -> set:
    """Return the combined set of user IDs that ``user`` has blocked
    and user IDs that have blocked ``user`` (bidirectional)."""
    from .models import Block

    blocked_by_me = set(Block.objects.filter(blocker=user).values_list("blocked_user_id", flat=True))
    blocked_me = set(Block.objects.filter(blocked_user=user).values_list("blocker_id", flat=True))
    return blocked_by_me | blocked_me
