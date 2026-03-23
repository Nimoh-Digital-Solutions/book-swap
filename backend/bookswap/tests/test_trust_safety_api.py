"""Tests for Trust & Safety endpoints (Epic 8).

Covers:
- Block CRUD (US-801)
- Block filtering on books/exchanges/messages/profiles (US-801 AC3-5)
- Report creation + admin endpoints (US-802)
- IsEmailVerified permission (US-803)
- Data export (US-804 AC6)
"""
import pytest
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APIClient

from apps.exchanges.models import ExchangeRequest, ExchangeStatus
from apps.messaging.models import Message
from apps.ratings.models import Rating
from bookswap.models import Block, Book, BookCondition, BookStatus, Report, ReportCategory
from bookswap.tests.factories import BookFactory, UserFactory

pytestmark = pytest.mark.django_db


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════


def _auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _create_exchange(requester, owner, requested_book, offered_book,
                     exchange_status=ExchangeStatus.PENDING):
    return ExchangeRequest.objects.create(
        requester=requester,
        owner=owner,
        requested_book=requested_book,
        offered_book=offered_book,
        status=exchange_status,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Block CRUD (US-801)
# ══════════════════════════════════════════════════════════════════════════════


class TestBlockCreate:
    def test_block_user(self):
        me = UserFactory()
        other = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/users/block/', {'blocked_user_id': str(other.pk)})
        assert resp.status_code == status.HTTP_201_CREATED
        assert Block.objects.filter(blocker=me, blocked_user=other).exists()

    def test_block_self_rejected(self):
        me = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/users/block/', {'blocked_user_id': str(me.pk)})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_block_nonexistent_user(self):
        import uuid
        me = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/users/block/', {'blocked_user_id': str(uuid.uuid4())})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_block_returns_200(self):
        me = UserFactory()
        other = UserFactory()
        Block.objects.create(blocker=me, blocked_user=other)
        client = _auth_client(me)
        resp = client.post('/api/v1/users/block/', {'blocked_user_id': str(other.pk)})
        assert resp.status_code == status.HTTP_200_OK

    def test_block_cancels_pending_exchanges(self):
        me = UserFactory(with_location=True, email_verified=True)
        other = UserFactory(with_location=True, email_verified=True)
        my_book = BookFactory(owner=me)
        other_book = BookFactory(owner=other)
        exchange = _create_exchange(me, other, other_book, my_book)

        client = _auth_client(me)
        client.post('/api/v1/users/block/', {'blocked_user_id': str(other.pk)})

        exchange.refresh_from_db()
        assert exchange.status == ExchangeStatus.CANCELLED


class TestBlockDestroy:
    def test_unblock_user(self):
        me = UserFactory()
        other = UserFactory()
        Block.objects.create(blocker=me, blocked_user=other)
        client = _auth_client(me)
        resp = client.delete(f'/api/v1/users/block/{other.pk}/')
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Block.objects.filter(blocker=me, blocked_user=other).exists()

    def test_unblock_nonexistent_returns_404(self):
        import uuid
        me = UserFactory()
        client = _auth_client(me)
        resp = client.delete(f'/api/v1/users/block/{uuid.uuid4()}/')
        assert resp.status_code == status.HTTP_404_NOT_FOUND


class TestBlockList:
    def test_list_blocked_users(self):
        me = UserFactory()
        a = UserFactory()
        b = UserFactory()
        Block.objects.create(blocker=me, blocked_user=a)
        Block.objects.create(blocker=me, blocked_user=b)
        client = _auth_client(me)
        resp = client.get('/api/v1/users/block/')
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        results = data.get('results', data)
        assert len(results) == 2


# ══════════════════════════════════════════════════════════════════════════════
# Block Filtering (US-801 AC3-5)
# ══════════════════════════════════════════════════════════════════════════════


class TestBlockFiltering:
    def test_blocked_user_profile_returns_404(self):
        me = UserFactory()
        other = UserFactory()
        Block.objects.create(blocker=me, blocked_user=other)
        client = _auth_client(me)
        resp = client.get(f'/api/v1/users/{other.pk}/')
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_reverse_block_also_hides_profile(self):
        """User who blocked ME also can't see my profile and vice versa."""
        me = UserFactory()
        other = UserFactory()
        Block.objects.create(blocker=other, blocked_user=me)
        client = _auth_client(me)
        resp = client.get(f'/api/v1/users/{other.pk}/')
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_blocked_user_books_excluded_from_browse(self):
        loc = Point(4.9041, 52.3676, srid=4326)
        me = UserFactory(location=loc, email_verified=True)
        other = UserFactory(location=loc, email_verified=True)
        BookFactory(owner=other)
        Block.objects.create(blocker=me, blocked_user=other)

        client = _auth_client(me)
        resp = client.get('/api/v1/books/browse/')
        data = resp.json()
        results = data.get('results', data)
        assert all(r['owner']['id'] != str(other.pk) for r in results)

    def test_exchange_with_blocked_user_hidden(self):
        me = UserFactory(with_location=True, email_verified=True)
        other = UserFactory(with_location=True, email_verified=True)
        my_book = BookFactory(owner=me)
        other_book = BookFactory(owner=other)
        _create_exchange(me, other, other_book, my_book, ExchangeStatus.COMPLETED)
        Block.objects.create(blocker=me, blocked_user=other)

        client = _auth_client(me)
        resp = client.get('/api/v1/exchanges/')
        data = resp.json()
        results = data.get('results', data)
        assert len(results) == 0

    def test_exchange_create_blocked_user_rejected(self):
        me = UserFactory(with_location=True, email_verified=True)
        other = UserFactory(with_location=True, email_verified=True)
        my_book = BookFactory(owner=me)
        other_book = BookFactory(owner=other)
        Block.objects.create(blocker=me, blocked_user=other)

        client = _auth_client(me)
        resp = client.post('/api/v1/exchanges/', {
            'requested_book_id': str(other_book.pk),
            'offered_book_id': str(my_book.pk),
        })
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
# Report Creation (US-802)
# ══════════════════════════════════════════════════════════════════════════════


class TestReportCreate:
    def test_create_report(self):
        me = UserFactory(email_verified=True)
        other = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(other.pk),
            'category': 'spam',
        })
        assert resp.status_code == status.HTTP_201_CREATED
        assert Report.objects.filter(reporter=me, reported_user=other).exists()

    def test_report_self_rejected(self):
        me = UserFactory(email_verified=True)
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(me.pk),
            'category': 'spam',
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_report_other_category_requires_description(self):
        me = UserFactory(email_verified=True)
        other = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(other.pk),
            'category': 'other',
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_report_other_category_with_description(self):
        me = UserFactory(email_verified=True)
        other = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(other.pk),
            'category': 'other',
            'description': 'This user did something unusual.',
        })
        assert resp.status_code == status.HTTP_201_CREATED

    def test_report_requires_email_verification(self):
        me = UserFactory(email_verified=False)
        other = UserFactory()
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(other.pk),
            'category': 'spam',
        })
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_report_with_book_reference(self):
        me = UserFactory(email_verified=True)
        other = UserFactory()
        book = BookFactory(owner=other)
        client = _auth_client(me)
        resp = client.post('/api/v1/reports/', {
            'reported_user_id': str(other.pk),
            'reported_book_id': str(book.pk),
            'category': 'fake_listing',
        })
        assert resp.status_code == status.HTTP_201_CREATED
        report = Report.objects.get(reporter=me)
        assert report.reported_book == book


# ══════════════════════════════════════════════════════════════════════════════
# Report Admin endpoints (US-802 AC6)
# ══════════════════════════════════════════════════════════════════════════════


class TestReportAdmin:
    def test_admin_list_reports(self):
        admin = UserFactory(is_staff=True, is_superuser=True)
        reporter = UserFactory(email_verified=True)
        reported = UserFactory()
        Report.objects.create(
            reporter=reporter, reported_user=reported, category='spam',
        )
        client = _auth_client(admin)
        resp = client.get('/api/v1/reports/admin/')
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        results = data.get('results', data)
        assert len(results) == 1

    def test_non_admin_cannot_list_reports(self):
        me = UserFactory()
        client = _auth_client(me)
        resp = client.get('/api/v1/reports/admin/')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_update_report_status(self):
        admin = UserFactory(is_staff=True, is_superuser=True)
        reporter = UserFactory(email_verified=True)
        reported = UserFactory()
        report = Report.objects.create(
            reporter=reporter, reported_user=reported, category='spam',
        )
        client = _auth_client(admin)
        resp = client.patch(
            f'/api/v1/reports/admin/{report.pk}/',
            {'status': 'reviewed', 'admin_notes': 'Looking into it.'},
        )
        assert resp.status_code == status.HTTP_200_OK
        report.refresh_from_db()
        assert report.status == 'reviewed'
        assert report.admin_notes == 'Looking into it.'


# ══════════════════════════════════════════════════════════════════════════════
# IsEmailVerified Permission (US-803)
# ══════════════════════════════════════════════════════════════════════════════


class TestIsEmailVerified:
    def test_unverified_cannot_create_book(self):
        me = UserFactory(email_verified=False)
        client = _auth_client(me)
        resp = client.post('/api/v1/books/', {
            'isbn': '9780140449136',
            'title': 'Test',
            'author': 'Author',
            'condition': 'good',
            'language': 'en',
        })
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_verified_can_create_book(self):
        me = UserFactory(email_verified=True)
        client = _auth_client(me)
        resp = client.post('/api/v1/books/', {
            'isbn': '9780140449136',
            'title': 'Test',
            'author': 'Author',
            'condition': 'good',
            'language': 'en',
        })
        assert resp.status_code == status.HTTP_201_CREATED

    def test_social_user_auto_verified(self):
        me = UserFactory(email_verified=False, is_social_account=True)
        client = _auth_client(me)
        resp = client.post('/api/v1/books/', {
            'isbn': '9780140449136',
            'title': 'Test',
            'author': 'Author',
            'condition': 'good',
            'language': 'en',
        })
        assert resp.status_code == status.HTTP_201_CREATED

    def test_unverified_cannot_create_exchange(self):
        me = UserFactory(email_verified=False, with_location=True)
        other = UserFactory(with_location=True)
        my_book = BookFactory(owner=me)
        other_book = BookFactory(owner=other)
        client = _auth_client(me)
        resp = client.post('/api/v1/exchanges/', {
            'requested_book_id': str(other_book.pk),
            'offered_book_id': str(my_book.pk),
        })
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unverified_can_browse(self):
        me = UserFactory(email_verified=False, with_location=True)
        client = _auth_client(me)
        resp = client.get('/api/v1/books/browse/')
        assert resp.status_code == status.HTTP_200_OK


# ══════════════════════════════════════════════════════════════════════════════
# Data Export (US-804 AC6)
# ══════════════════════════════════════════════════════════════════════════════


class TestDataExport:
    def test_data_export_returns_json(self):
        me = UserFactory(email_verified=True)
        BookFactory(owner=me)
        client = _auth_client(me)
        resp = client.get('/api/v1/users/me/data-export/')
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert 'profile' in data
        assert 'books' in data
        assert 'exchanges' in data
        assert 'messages_sent' in data
        assert 'ratings_given' in data
        assert 'ratings_received' in data
        assert 'blocks' in data
        assert 'reports_filed' in data

    def test_data_export_includes_user_books(self):
        me = UserFactory(email_verified=True)
        BookFactory(owner=me, title='My Book')
        client = _auth_client(me)
        resp = client.get('/api/v1/users/me/data-export/')
        data = resp.json()
        assert len(data['books']) == 1
        assert data['books'][0]['title'] == 'My Book'

    def test_data_export_requires_auth(self):
        client = APIClient()
        resp = client.get('/api/v1/users/me/data-export/')
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_data_export_content_disposition(self):
        me = UserFactory(email_verified=True)
        client = _auth_client(me)
        resp = client.get('/api/v1/users/me/data-export/')
        assert 'bookswap-data-export.json' in resp.get('Content-Disposition', '')
