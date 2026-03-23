import factory
from django.contrib.gis.geos import Point

from bookswap.models import User


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for BookSwap User model."""

    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@bookswap.test")
    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")

    # Domain fields with sensible defaults
    date_of_birth = factory.Faker("date_of_birth", minimum_age=16, maximum_age=80)
    bio = factory.Faker("sentence", nb_words=10)
    preferred_language = "en"
    preferred_radius = 5000
    onboarding_completed = False
    email_verified = True

    class Params:
        with_location = factory.Trait(
            location=factory.LazyFunction(lambda: Point(4.9041, 52.3676, srid=4326)),
            neighborhood="Amsterdam Centrum",
        )
        onboarded = factory.Trait(
            onboarding_completed=True,
            bio=factory.Faker("sentence", nb_words=10),
            preferred_genres=["fiction", "mystery"],
        )
        unverified = factory.Trait(
            email_verified=False,
        )
