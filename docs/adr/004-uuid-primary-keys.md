# ADR-004: UUID Primary Keys via nimoh-base

**Date:** 2026-04-15
**Status:** Accepted

## Context

BookSwap exposes object IDs in URLs, API responses, and WebSocket payloads.
Sequential integer IDs leak information (total count, creation order) and are
trivially enumerable.

nimoh-be-django-base provides a `NimohBaseModel` abstract class that uses
`UUIDField(primary_key=True, default=uuid.uuid4)` along with standard
`created_at` / `updated_at` timestamp fields.

## Decision

All BookSwap models inherit from nimoh-base's `NimohBaseModel`, giving every
table a UUID primary key and automatic timestamp tracking. The custom `User`
model in `bookswap.models` follows the same pattern.

## Consequences

- **Positive:** IDs are non-guessable and safe to expose publicly.
- **Positive:** No ID conflicts when merging data from multiple environments.
- **Positive:** Consistent `created_at` / `updated_at` on every model without
  boilerplate.
- **Negative:** UUIDs are 128-bit vs 32/64-bit integers — slightly larger
  indexes. Acceptable at BookSwap's scale.
- **Negative:** UUIDs are not human-readable for debugging. Mitigated by
  admin list displays showing short UUID prefixes.
