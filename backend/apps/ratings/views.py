"""Views for the ratings app."""
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.exchanges.models import ExchangeRequest

from .models import RATABLE_STATUSES, RATING_WINDOW_DAYS, Rating
from .permissions import IsExchangeParticipantForRating
from .serializers import (
    ExchangeRatingStatusSerializer,
    RatingCreateSerializer,
    RatingSerializer,
)


class ExchangeRatingViewSet(GenericViewSet):
    """
    Ratings for a specific exchange.

    GET  /api/v1/ratings/exchanges/{exchange_id}/  — rating status
    POST /api/v1/ratings/exchanges/{exchange_id}/  — submit rating
    """

    permission_classes = [IsAuthenticated, IsExchangeParticipantForRating]  # noqa: RUF012

    def initial(self, request, *args, **kwargs):
        """Resolve the exchange before permission checks."""
        exchange_id = kwargs.get('exchange_id')
        try:
            self.exchange = ExchangeRequest.objects.select_related(
                'requester', 'owner',
            ).get(pk=exchange_id)
        except (ExchangeRequest.DoesNotExist, ValueError):
            raise NotFound('Exchange not found.') from None
        super().initial(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Get rating status for this exchange."""
        exchange = self.exchange
        user = request.user

        partner_id = (
            exchange.owner_id
            if user.id == exchange.requester_id
            else exchange.requester_id
        )

        my_rating = Rating.objects.filter(
            exchange=exchange, rater=user,
        ).select_related('rater', 'rated').first()

        partner_rating = Rating.objects.filter(
            exchange=exchange, rater_id=partner_id,
        ).select_related('rater', 'rated').first()

        deadline = exchange.updated_at + timedelta(days=RATING_WINDOW_DAYS)
        can_rate = (
            exchange.status in RATABLE_STATUSES
            and my_rating is None
            and timezone.now() <= deadline
        )

        data = {
            'exchange_id': exchange.id,
            'my_rating': my_rating,
            'partner_rating': partner_rating,
            'can_rate': can_rate,
            'rating_deadline': deadline,
        }
        serializer = ExchangeRatingStatusSerializer(
            data,
            context={'request': request},
        )
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Submit a rating for the exchange partner."""
        serializer = RatingCreateSerializer(
            data=request.data,
            context={'exchange': self.exchange, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        rating = serializer.save()
        return Response(
            RatingSerializer(rating, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class UserRatingsViewSet(GenericViewSet):
    """
    Public ratings received by a user.

    GET /api/v1/ratings/users/{user_id}/  — paginated list
    """

    permission_classes = [IsAuthenticated]  # noqa: RUF012
    serializer_class = RatingSerializer

    def list(self, request, *args, **kwargs):
        """List public ratings received by a user."""
        user_id = kwargs.get('user_id')
        queryset = (
            Rating.objects
            .filter(rated_id=user_id, is_flagged=False)
            .select_related('rater', 'rated')
            .order_by('-created_at')
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RatingSerializer(
                page, many=True, context={'request': request},
            )
            return self.get_paginated_response(serializer.data)

        serializer = RatingSerializer(
            queryset, many=True, context={'request': request},
        )
        return Response(serializer.data)
