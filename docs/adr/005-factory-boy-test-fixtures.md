# ADR-005: factory_boy for Test Fixtures

**Date:** 2026-04-15
**Status:** Accepted

## Context

BookSwap has a growing test suite (pytest + pytest-django). Tests need realistic
model instances with valid relationships (User → UserProfile → Book →
ExchangeRequest). Options considered:

1. **Django fixtures (JSON/YAML)** — static, brittle, hard to maintain as models
   evolve
2. **Manual `Model.objects.create()` in setUp** — verbose, repetitive
3. **factory_boy + Faker** — declarative factories, lazy attributes, trait
   composition, easy relationship wiring

## Decision

Use **factory_boy** with **Faker** for all test data generation. Each app
provides its own factories in `tests/factories.py` (or `conftest.py`). The root
`conftest.py` registers shared fixtures like `user_factory` and `api_client`.

## Consequences

- **Positive:** Tests are concise — `UserFactory()` creates a valid user with
  profile in one call.
- **Positive:** Factories auto-adapt when model fields change (Faker generates
  valid data).
- **Positive:** Trait-based variations (`UserFactory(is_verified=True)`) keep
  test intent readable.
- **Negative:** Learning curve for developers unfamiliar with factory_boy's
  `LazyAttribute` / `SubFactory` / `post_generation` patterns.
- **Negative:** Factory definitions must be maintained alongside models.
