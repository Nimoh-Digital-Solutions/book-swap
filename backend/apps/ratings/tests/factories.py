import factory

from apps.exchanges.tests.factories import ExchangeRequestFactory

from ..models import Rating


class RatingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rating

    exchange = factory.SubFactory(ExchangeRequestFactory)
    rater = factory.LazyAttribute(lambda o: o.exchange.requester)
    rated = factory.LazyAttribute(lambda o: o.exchange.owner)
    score = factory.Faker("random_int", min=1, max=5)
    comment = factory.Faker("sentence", nb_words=8)
