"""Profanity filter utility for rating comments.

SECURITY (ADV-310): Uses ``better_profanity`` instead of naive substring
matching. The library handles leetspeak, word boundaries, and common evasion
techniques. A fallback blocklist is kept for terms the library may miss.
"""

from better_profanity import profanity

EXTRA_BLOCKED = frozenset(
    {
        "nigger",
        "nigga",
        "faggot",
        "retard",
    }
)


def is_profane(text: str) -> bool:
    """Return True if text contains profanity."""
    if not text:
        return False
    if profanity.contains_profanity(text):
        return True
    lower = text.lower()
    return any(term in lower for term in EXTRA_BLOCKED)
