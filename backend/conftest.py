import os

import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")


@pytest.fixture(autouse=True)
def _clear_django_cache():
    """Clear the Django cache before every test.

    Sprint 3 introduced cached external-HTTP calls and cached view payloads
    (CommunityStatsView). Without this fixture a value cached in test A would
    bleed into test B and either hide bugs or cause spurious failures
    depending on test order.
    """
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()
