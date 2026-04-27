import factory

from apps.books.models import BookStatus
from apps.books.tests.factories import BookFactory
from apps.exchanges.models import (
    ConditionsAcceptance,
    ExchangeRequest,
    ExchangeStatus,
)
from bookswap.tests.factories import UserFactory


class ExchangeRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExchangeRequest

    requester = factory.SubFactory(UserFactory, with_location=True, onboarded=True)
    owner = factory.SubFactory(UserFactory, with_location=True, onboarded=True)
    requested_book = factory.SubFactory(BookFactory, owner=factory.SelfAttribute("..owner"))
    offered_book = factory.SubFactory(BookFactory, owner=factory.SelfAttribute("..requester"))
    status = ExchangeStatus.PENDING
    message = "I would love to swap!"

    class Params:
        accepted = factory.Trait(status=ExchangeStatus.ACCEPTED)
        conditions_pending = factory.Trait(status=ExchangeStatus.CONDITIONS_PENDING)
        active = factory.Trait(status=ExchangeStatus.ACTIVE)
        swap_confirmed = factory.Trait(status=ExchangeStatus.SWAP_CONFIRMED)
        return_requested = factory.Trait(status=ExchangeStatus.RETURN_REQUESTED)

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        super()._after_postgeneration(instance, create, results)
        if not create:
            return
        post_accept_statuses = {
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.CONDITIONS_PENDING,
            ExchangeStatus.ACTIVE,
            ExchangeStatus.SWAP_CONFIRMED,
            ExchangeStatus.RETURN_REQUESTED,
        }
        if instance.status in post_accept_statuses:
            instance.requested_book.status = BookStatus.IN_EXCHANGE
            instance.requested_book.save(update_fields=["status"])
            instance.offered_book.status = BookStatus.IN_EXCHANGE
            instance.offered_book.save(update_fields=["status"])


class ConditionsAcceptanceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ConditionsAcceptance

    exchange = factory.SubFactory(ExchangeRequestFactory)
    user = factory.LazyAttribute(lambda o: o.exchange.requester)
