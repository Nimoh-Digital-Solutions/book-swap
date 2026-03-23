"""Basic profanity filter utility for rating comments."""

BLOCKED_TERMS = frozenset(
    {
        "fuck",
        "shit",
        "asshole",
        "bitch",
        "bastard",
        "cunt",
        "dick",
        "piss",
        "slut",
        "whore",
        "nigger",
        "nigga",
        "faggot",
        "retard",
    }
)


def is_profane(text: str) -> bool:
    """Return True if text contains any blocked terms (case-insensitive)."""
    if not text:
        return False
    lower = text.lower()
    return any(term in lower for term in BLOCKED_TERMS)
