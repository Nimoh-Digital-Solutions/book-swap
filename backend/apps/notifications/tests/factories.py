import factory

from bookswap.tests.factories import UserFactory

from ..models import Notification, NotificationPreferences, NotificationType


class NotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Notification

    user = factory.SubFactory(UserFactory)
    notification_type = NotificationType.NEW_REQUEST
    title = factory.Faker('sentence', nb_words=4)
    body = factory.Faker('sentence', nb_words=10)
    link = factory.LazyAttribute(lambda o: '/exchanges/some-id/')


class NotificationPreferencesFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = NotificationPreferences
        django_get_or_create = ('user',)

    user = factory.SubFactory(UserFactory)
    email_new_request = True
    email_request_accepted = True
    email_request_declined = True
    email_new_message = True
    email_exchange_completed = True
    email_rating_received = True
