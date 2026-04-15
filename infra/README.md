# BookSwap infrastructure

BookSwap is designed to run on **self-hosted Raspberry Pi 5** hardware with **Docker** for process isolation and repeatable deploys. Public HTTPS and routing typically go through **Cloudflare** (Tunnel or proxy), so the Pi does not need a static public IP or open inbound ports for the application.

## Typical stack

- **Pi 5**: Application host (Docker Compose or similar), running Django (ASGI), Celery workers, Redis, PostgreSQL with PostGIS, and the built React SPA behind a reverse proxy.
- **Cloudflare**: TLS termination at the edge, DDoS mitigation, and secure tunnel to the Pi where applicable.
- **Redis**: Sessions, caching, and Celery broker duties as configured in the project.

## Object storage

**MinIO** (S3-compatible object storage) is **planned** for replacing or supplementing local media storage (e.g. book cover images, uploads). It is **not yet implemented** in the main BookSwap deployment path. A reference Compose file is provided as `docker-compose.minio.yml` for future use on ARM64 (Pi 5).

## Operations

- Database backups should follow your retention and encryption policy; see `backup.sh` for a starting point using `pg_dump`.
- Review Cloudflare and Docker secrets rotation as part of regular maintenance.
