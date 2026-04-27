"""Security regression test: ADV-201 — Book status mass assignment.

Before the fix, BookUpdateSerializer included ``status`` as a writable field.
A book owner could PATCH their book's status from ``in_exchange`` back to
``available`` while the book was locked in an active exchange, desynchronizing
book state from exchange state and breaking exchange integrity.

The fix removes ``status`` from BookUpdateSerializer fields entirely.
Book status is now managed exclusively by the exchange lifecycle views.

If this test fails, the status mass-assignment vulnerability has been
re-introduced. Do NOT delete or skip this test.
"""

import pytest
from rest_framework.test import APIClient

from apps.books.models import BookStatus
from apps.books.tests.factories import BookFactory
from bookswap.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestADV201BookStatusMassAssignment:
    """ADV-201: Book status must not be writable via PATCH."""

    def test_patch_status_ignored_on_available_book(self):
        """PATCH with status field is silently ignored (not rejected)."""
        user = UserFactory(is_active=True, email_verified=True)
        book = BookFactory(owner=user, status=BookStatus.AVAILABLE)
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.patch(
            f"/api/v1/books/{book.pk}/",
            {"status": "in_exchange"},
            format="json",
        )

        assert response.status_code == 200
        book.refresh_from_db()
        assert book.status == BookStatus.AVAILABLE

    def test_patch_status_ignored_on_in_exchange_book(self):
        """Owner cannot reset status from in_exchange to available via PATCH."""
        user = UserFactory(is_active=True, email_verified=True)
        book = BookFactory(owner=user, status=BookStatus.IN_EXCHANGE)
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.patch(
            f"/api/v1/books/{book.pk}/",
            {"status": "available"},
            format="json",
        )

        assert response.status_code == 200
        book.refresh_from_db()
        assert book.status == BookStatus.IN_EXCHANGE

    def test_legitimate_update_still_works(self):
        """Non-status fields can still be updated normally."""
        user = UserFactory(is_active=True, email_verified=True)
        book = BookFactory(owner=user, status=BookStatus.AVAILABLE)
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.patch(
            f"/api/v1/books/{book.pk}/",
            {"title": "Updated Title", "notes": "Great condition"},
            format="json",
        )

        assert response.status_code == 200
        book.refresh_from_db()
        assert book.title == "Updated Title"
        assert book.notes == "Great condition"
