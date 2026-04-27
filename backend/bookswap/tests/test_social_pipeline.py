"""Tests for ``bookswap.social_pipeline``.

The default ``social_core.pipeline.user.get_username`` step does not detect
username collisions when ``USERNAME_FIELD = 'email'`` (see the module
docstring). These tests pin the project's replacement step to behave
correctly: it picks a unique username on every social sign-in.
"""

from __future__ import annotations

import re

import pytest

from bookswap.social_pipeline import USERNAME_MAX_LEN, UUID_SUFFIX_LEN, get_username
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def _call(details: dict, user=None) -> str:
    return get_username(strategy=None, details=details, backend=None, user=user)["username"]


def test_returns_existing_users_username_when_passed_in():
    user = UserFactory(username="alice", email="alice@example.com")
    assert _call({"username": "ignored", "email": "ignored@x"}, user=user) == "alice"


def test_uses_email_local_part_when_no_collision():
    assert _call({"email": "newperson@nimoh-ict.nl"}) == "newperson"


def test_appends_uuid_suffix_on_username_collision():
    UserFactory(username="admin", email="admin@example.com")

    candidate = _call({"username": "admin", "email": "admin@nimoh-ict.nl"})

    assert candidate != "admin"
    assert candidate.startswith("admin-")
    assert re.fullmatch(rf"admin-[a-f0-9]{{{UUID_SUFFIX_LEN}}}", candidate)


def test_appends_uuid_suffix_when_only_email_local_part_collides():
    """The Google-OAuth admin@nimoh-ict.nl scenario from the production bug."""
    UserFactory(username="admin", email="admin@example.com")

    candidate = _call({"email": "admin@nimoh-ict.nl"})

    assert candidate != "admin"
    assert candidate.startswith("admin-")


def test_falls_back_to_random_when_details_empty():
    """Mirrors social_core's behaviour: empty details -> random hex prefix."""
    candidate = _call({})
    assert candidate
    assert re.fullmatch(r"[a-f0-9]+", candidate)


def test_strips_invalid_characters():
    candidate = _call({"username": "weird name!*&"})
    assert " " not in candidate
    assert "!" not in candidate
    assert "*" not in candidate


def test_username_never_exceeds_max_length():
    long_local = "a" * 200
    candidate = _call({"email": f"{long_local}@example.com"})
    assert len(candidate) <= USERNAME_MAX_LEN


def test_username_always_unique_after_collision():
    UserFactory(username="taken", email="taken@example.com")
    seen = {_call({"username": "taken"}) for _ in range(5)}
    assert "taken" not in seen
    assert all(c.startswith("taken-") for c in seen)
