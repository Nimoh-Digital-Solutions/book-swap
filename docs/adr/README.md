# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the BookSwap project.
Each ADR documents a significant technical decision, the context behind it, the
options considered, and the rationale for the chosen approach.

## Format

We follow the [Michael Nygard template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

- **Title** — short noun phrase
- **Status** — Accepted / Superseded / Deprecated
- **Context** — forces at play
- **Decision** — what we decided
- **Consequences** — trade-offs and follow-up

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-jwt-httponly-cookies.md) | JWT tokens in httpOnly cookies | Accepted |
| [002](002-postgis-geodjango.md) | PostGIS / GeoDjango for spatial queries | Accepted |
| [003](003-celery-queue-separation.md) | Celery queue separation (default / email / maintenance) | Accepted |
| [004](004-uuid-primary-keys.md) | UUID primary keys via nimoh-base | Accepted |
| [005](005-factory-boy-test-fixtures.md) | factory_boy for test fixtures | Accepted |
