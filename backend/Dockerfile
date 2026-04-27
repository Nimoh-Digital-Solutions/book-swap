# ── Build stage ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    GDAL_LIBRARY_PATH="" \
    GEOS_LIBRARY_PATH=""

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gdal-bin \
    libgeos-c1v5 \
    libproj25 \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY . .

RUN chmod +x scripts/entrypoint.sh scripts/check-env.sh start.sh

# collectstatic only needs a runnable settings module — it never connects to
# the DB and never signs anything. Real SECRET_KEY / DATABASE_URL are still
# required at runtime (the production settings raise ImproperlyConfigured if
# they're missing — see config/settings/production.py — AUD-B-801/802). The
# dummy values below exist only for the duration of this RUN.
RUN SECRET_KEY="build-time-dummy-not-used-at-runtime" \
    DATABASE_URL="postgres://build:build@build/build" \
    ALLOWED_HOSTS="localhost" \
    GDAL_LIBRARY_PATH="" \
    GEOS_LIBRARY_PATH="" \
    python manage.py collectstatic --noinput --settings=config.settings.production

# Run as a non-root user for security (GAP-I-003)
RUN addgroup --system app && adduser --system --ingroup app app \
    && chown -R app:app /app
USER app

EXPOSE 8000

ENTRYPOINT ["scripts/entrypoint.sh"]
CMD ["./start.sh"]
