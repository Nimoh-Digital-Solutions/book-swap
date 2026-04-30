"""Social-auth pipeline customizations for BookSwap.

The default ``social_core.pipeline.user.get_username`` step is incompatible
with our ``USERNAME_FIELD = 'email'`` setup: ``social_django``'s
``DjangoUserMixin.user_exists`` rewrites a ``username=...`` lookup to
``email=...``, which means the upstream collision-detection loop never
detects an existing username. The pipeline then proceeds to ``create_user``
with a duplicate ``username`` and the database raises
``IntegrityError`` → ``AuthAlreadyAssociated`` → 500.

This module provides a drop-in replacement that queries the ``username``
column directly so collisions are actually detected and resolved by
appending a short random suffix.

It also provides ``save_google_avatar``, a pipeline step that downloads the
Google profile photo and stores it on ``User.avatar`` the first time a user
signs in via Google (web OAuth path).
"""

from __future__ import annotations

import re
import uuid

from django.contrib.auth import get_user_model

User = get_user_model()

USERNAME_MAX_LEN = 150
UUID_SUFFIX_LEN = 8

_VALID_USERNAME_RE = re.compile(r"[^A-Za-z0-9@.+\-_]")


def _slugify_username(value: str) -> str:
    return _VALID_USERNAME_RE.sub("", value or "")[:USERNAME_MAX_LEN]


def _candidate_from_details(details: dict) -> str:
    candidate = (details.get("username") or "").strip()
    if candidate:
        return candidate

    email = (details.get("email") or "").strip()
    if email:
        return email.split("@", 1)[0]

    return uuid.uuid4().hex[:UUID_SUFFIX_LEN]


def get_username(strategy, details, backend, user=None, *args, **kwargs) -> dict:
    """Return a unique username for the social-auth pipeline.

    Replaces ``social_core.pipeline.user.get_username``. Works correctly when
    ``AUTH_USER_MODEL.USERNAME_FIELD`` is something other than ``username``
    (e.g. ``email``).
    """
    if user is not None:
        return {"username": getattr(user, "username", None)}

    base = _slugify_username(_candidate_from_details(details))
    if not base:
        base = "user"

    candidate = base[:USERNAME_MAX_LEN]
    while User.objects.filter(username=candidate).exists():
        suffix = uuid.uuid4().hex[:UUID_SUFFIX_LEN]
        truncated = base[: USERNAME_MAX_LEN - UUID_SUFFIX_LEN - 1]
        candidate = f"{truncated}-{suffix}"

    return {"username": candidate}


def save_google_avatar(backend, user, response, *args, **kwargs) -> None:
    """PSA pipeline step — persist the Google profile photo on first sign-in.

    Runs after ``user_details`` so ``user`` is guaranteed to be populated.
    Only fires for the Google backend and only when the user has no avatar yet,
    so manually-uploaded photos are never overwritten on subsequent logins.
    """
    if backend.name != "google-oauth2":
        return
    if not user or user.avatar:
        return

    picture_url = response.get("picture", "")
    if picture_url:
        from .utils import set_avatar_from_url

        set_avatar_from_url(user, picture_url)
