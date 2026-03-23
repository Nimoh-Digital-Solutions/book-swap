import factory

from apps.trust_safety.models import Block, Report, ReportCategory
from bookswap.tests.factories import UserFactory


class BlockFactory(factory.django.DjangoModelFactory):
    """Factory for Block model."""

    class Meta:
        model = Block

    blocker = factory.SubFactory(UserFactory)
    blocked_user = factory.SubFactory(UserFactory)


class ReportFactory(factory.django.DjangoModelFactory):
    """Factory for Report model."""

    class Meta:
        model = Report

    reporter = factory.SubFactory(UserFactory)
    reported_user = factory.SubFactory(UserFactory)
    category = ReportCategory.SPAM
    description = ''
