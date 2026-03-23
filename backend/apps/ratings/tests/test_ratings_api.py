"""Tests for the ratings API — Epic 7."""
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.exchanges.models import ExchangeRequest, ExchangeStatus
from apps.exchanges.tests.factories import ExchangeRequestFactory
from apps.ratings.models import Rating
from bookswap.tests.factories import UserFactory

from .factories import RatingFactory


def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def exchange_rating_url(exchange_id):
    return f'/api/v1/ratings/exchanges/{exchange_id}/'


def user_ratings_url(user_id):
    return f'/api/v1/ratings/users/{user_id}/'


@pytest.fixture
def completed_exchange(db):
    """Create a completed exchange for testing ratings."""
    exchange = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
    return exchange


@pytest.mark.django_db
class TestSubmitRating:
    """Tests for POST /api/v1/ratings/exchanges/{exchange_id}/"""

    def test_submit_rating_with_score_and_comment(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 5, 'comment': 'Great swap partner!'},
        )
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data['score'] == 5
        assert data['comment'] == 'Great swap partner!'
        assert data['rater']['id'] == str(completed_exchange.requester.pk)
        assert data['rated']['id'] == str(completed_exchange.owner.pk)

    def test_submit_rating_score_only(self, completed_exchange):
        client = api_client(completed_exchange.owner)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 3},
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()['comment'] == ''

    def test_unauthenticated_returns_401(self, completed_exchange):
        client = APIClient()
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 4},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_participant_returns_403(self, completed_exchange):
        outsider = UserFactory(with_location=True, onboarded=True)
        client = api_client(outsider)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 4},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_score_zero_returns_400(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 0},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_score_six_returns_400(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 6},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_comment_over_300_chars_returns_400(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 4, 'comment': 'x' * 301},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_pending_exchange_returns_400(self, db):
        exchange = ExchangeRequestFactory(status=ExchangeStatus.PENDING)
        client = api_client(exchange.requester)
        resp = client.post(
            exchange_rating_url(exchange.pk),
            {'score': 4},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_active_exchange_returns_400(self, db):
        exchange = ExchangeRequestFactory(status=ExchangeStatus.ACTIVE)
        client = api_client(exchange.requester)
        resp = client.post(
            exchange_rating_url(exchange.pk),
            {'score': 4},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_window_returns_400(self, completed_exchange):
        # Move the exchange completion date back 31 days
        # Use .update() to bypass auto_now on updated_at
        ExchangeRequest.objects.filter(pk=completed_exchange.pk).update(
            updated_at=timezone.now() - timedelta(days=31),
        )
        completed_exchange.refresh_from_db()

        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 4},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_rating_returns_400(self, completed_exchange):
        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
        )
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 3},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_profanity_flagged(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.post(
            exchange_rating_url(completed_exchange.pk),
            {'score': 1, 'comment': 'This person is a shit partner'},
        )
        assert resp.status_code == status.HTTP_201_CREATED
        rating = Rating.objects.get(pk=resp.json()['id'])
        assert rating.is_flagged is True

    def test_returned_exchange_allows_rating(self, db):
        exchange = ExchangeRequestFactory(status=ExchangeStatus.RETURNED)
        client = api_client(exchange.requester)
        resp = client.post(
            exchange_rating_url(exchange.pk),
            {'score': 4, 'comment': 'Smooth return process!'},
        )
        assert resp.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestExchangeRatingStatus:
    """Tests for GET /api/v1/ratings/exchanges/{exchange_id}/"""

    def test_get_status_no_ratings(self, completed_exchange):
        client = api_client(completed_exchange.requester)
        resp = client.get(exchange_rating_url(completed_exchange.pk))
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data['can_rate'] is True
        assert data['my_rating'] is None
        assert data['partner_rating'] is None

    def test_get_status_after_rating(self, completed_exchange):
        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
            score=5,
        )
        client = api_client(completed_exchange.requester)
        resp = client.get(exchange_rating_url(completed_exchange.pk))
        data = resp.json()
        assert data['can_rate'] is False
        assert data['my_rating'] is not None
        assert data['my_rating']['score'] == 5
        assert data['partner_rating'] is None

    def test_get_status_both_rated(self, completed_exchange):
        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
            score=5,
        )
        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.owner,
            rated=completed_exchange.requester,
            score=4,
        )
        client = api_client(completed_exchange.requester)
        resp = client.get(exchange_rating_url(completed_exchange.pk))
        data = resp.json()
        assert data['my_rating']['score'] == 5
        assert data['partner_rating']['score'] == 4

    def test_get_status_expired_window(self, completed_exchange):
        ExchangeRequest.objects.filter(pk=completed_exchange.pk).update(
            updated_at=timezone.now() - timedelta(days=31),
        )
        completed_exchange.refresh_from_db()

        client = api_client(completed_exchange.requester)
        resp = client.get(exchange_rating_url(completed_exchange.pk))
        data = resp.json()
        assert data['can_rate'] is False


@pytest.mark.django_db
class TestUserRatings:
    """Tests for GET /api/v1/ratings/users/{user_id}/"""

    def test_list_user_ratings(self, db):
        exchange = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        RatingFactory(
            exchange=exchange,
            rater=exchange.requester,
            rated=exchange.owner,
            score=5,
            comment='Excellent!',
        )
        client = api_client(exchange.requester)
        resp = client.get(user_ratings_url(exchange.owner.pk))
        assert resp.status_code == status.HTTP_200_OK
        results = resp.json()['results']
        assert len(results) == 1
        assert results[0]['score'] == 5

    def test_flagged_ratings_excluded(self, db):
        exchange = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED)
        RatingFactory(
            exchange=exchange,
            rater=exchange.requester,
            rated=exchange.owner,
            is_flagged=True,
        )
        client = api_client(exchange.requester)
        resp = client.get(user_ratings_url(exchange.owner.pk))
        assert len(resp.json()['results']) == 0

    def test_unauthenticated_returns_401(self, db):
        user = UserFactory(with_location=True, onboarded=True)
        client = APIClient()
        resp = client.get(user_ratings_url(user.pk))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestRatingAggregateUpdate:
    """Tests for the signal → task that updates user stats."""

    def test_aggregate_stats_updated_after_rating(self, completed_exchange):
        # Call the task synchronously for testing
        from apps.ratings.tasks import update_user_rating_stats

        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
            score=4,
        )
        update_user_rating_stats(str(completed_exchange.owner.pk))

        completed_exchange.owner.refresh_from_db()
        assert completed_exchange.owner.avg_rating == 4
        assert completed_exchange.owner.rating_count == 1

    def test_multiple_ratings_average(self, db):
        from apps.ratings.tasks import update_user_rating_stats

        user = UserFactory(with_location=True, onboarded=True)

        ex1 = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED, owner=user)
        RatingFactory(exchange=ex1, rater=ex1.requester, rated=user, score=5)

        ex2 = ExchangeRequestFactory(status=ExchangeStatus.COMPLETED, owner=user)
        RatingFactory(exchange=ex2, rater=ex2.requester, rated=user, score=3)

        update_user_rating_stats(str(user.pk))
        user.refresh_from_db()
        assert float(user.avg_rating) == 4.0
        assert user.rating_count == 2


@pytest.mark.django_db
class TestRatingModel:
    """Tests for the Rating model itself."""

    def test_str_representation(self, completed_exchange):
        rating = RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
            score=5,
        )
        assert '5★' in str(rating)

    def test_unique_constraint(self, completed_exchange):
        RatingFactory(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            rated=completed_exchange.owner,
        )
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            RatingFactory(
                exchange=completed_exchange,
                rater=completed_exchange.requester,
                rated=completed_exchange.owner,
            )
