import factory

from apps.exchanges.tests.factories import ExchangeRequestFactory
from apps.messaging.models import MeetupCategory, MeetupLocation, Message
from bookswap.tests.factories import UserFactory
from django.contrib.gis.geos import Point


class MessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Message

    exchange = factory.SubFactory(ExchangeRequestFactory, active=True)
    sender = factory.SelfAttribute('exchange.requester')
    content = factory.Faker('sentence', nb_words=10)


class MeetupLocationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MeetupLocation

    name = factory.Faker('company')
    address = factory.Faker('address')
    category = MeetupCategory.LIBRARY
    city = 'Amsterdam'
    location = factory.LazyFunction(lambda: Point(4.9, 52.37, srid=4326))
    is_active = True
