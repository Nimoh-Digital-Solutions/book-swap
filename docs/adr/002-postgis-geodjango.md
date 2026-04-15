# ADR-002: PostGIS / GeoDjango for Spatial Queries

**Date:** 2026-04-15
**Status:** Accepted

## Context

BookSwap's core discovery flow is map-based: users browse books near their
location, filter by radius, and arrange in-person meetups for swaps. This
requires efficient spatial queries ("books within 5km of me") and distance
sorting.

Options considered:

1. **Haversine formula in Python** — simple but O(n) full table scan, no index
2. **PostGIS with GeoDjango** — native spatial indexing (GiST), ST_DWithin,
   distance annotations, mature ecosystem
3. **Elasticsearch geo_point** — powerful but adds a separate search cluster

## Decision

Use **PostGIS** as the database engine (`django.contrib.gis.db.backends.postgis`)
and **GeoDjango** (`django.contrib.gis`) for all spatial operations. User
locations are stored as `PointField` geometry, and discovery queries use
`ST_DWithin` with GiST indexes for sub-millisecond radius filtering.

## Consequences

- **Positive:** Spatial queries are index-backed and scale well.
- **Positive:** GeoDjango integrates natively with DRF serializers and Django
  ORM — no glue code.
- **Positive:** Same database handles both relational and spatial data, no sync
  required.
- **Negative:** Requires PostGIS extension and GDAL/GEOS libraries at build
  time (handled in the Dockerfile with `libgdal-dev`, `libgeos-dev`,
  `libproj-dev`).
- **Negative:** Slightly larger Docker image than plain PostgreSQL.
