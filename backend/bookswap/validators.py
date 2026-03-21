"""Domain validators for bookswap."""
import re
from datetime import date

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import serializers

# Dutch postcode: 4 digits, optional space, 2 letters
DUTCH_POSTCODE_RE = re.compile(r'^\d{4}\s?[A-Za-z]{2}$')

MINIMUM_AGE = 16


def validate_dutch_postcode(value: str) -> str:
    """Validate and normalise a Dutch postcode (e.g. '1012 AB')."""
    value = value.strip().upper()
    if not DUTCH_POSTCODE_RE.match(value):
        raise ValidationError(
            "Enter a valid Dutch postcode (e.g. 1012 AB).",
            code="invalid_postcode",
        )
    # Normalise to '1234 AB' format
    digits = value[:4]
    letters = value[-2:]
    return f"{digits} {letters}"


def validate_minimum_age(dob: date) -> None:
    """Raise ValidationError if the user is under MINIMUM_AGE."""
    today = timezone.now().date()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < MINIMUM_AGE:
        raise serializers.ValidationError(
            f"You must be at least {MINIMUM_AGE} years old to register.",
            code="underage",
        )
