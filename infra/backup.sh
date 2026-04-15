#!/usr/bin/env bash
# BookSwap PostgreSQL backups: timestamped dumps, gzip compression, retention cleanup.
# Backups directory (override with BACKUP_DIR):
BACKUP_DIR="${BACKUP_DIR:-/home/gnimoh001/backups/bookswap}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
mkdir -p "$BACKUP_DIR"

stamp() { date +%Y%m%d_%H%M%S; }

run_dump() {
  local label="$1"
  local db_url="$2"
  local out="${BACKUP_DIR}/bookswap_${label}_$(stamp).sql"
  pg_dump --dbname="$db_url" --format=plain --no-owner --no-acl -f "$out"
  gzip -f "$out"
  echo "Wrote ${out}.gz"
}

cleanup_old() {
  find "$BACKUP_DIR" -type f -name 'bookswap_*.sql.gz' -mtime "+${RETENTION_DAYS}" -print -delete
}

# --- Configure connection strings for each environment (use env vars in production) ---
# Example: postgresql://USER:PASSWORD@HOST:5432/DBNAME
: "${BOOKSWAP_STAGING_DATABASE_URL:?Set BOOKSWAP_STAGING_DATABASE_URL}"
: "${BOOKSWAP_PRODUCTION_DATABASE_URL:?Set BOOKSWAP_PRODUCTION_DATABASE_URL}"

run_dump "staging" "$BOOKSWAP_STAGING_DATABASE_URL"
run_dump "production" "$BOOKSWAP_PRODUCTION_DATABASE_URL"
cleanup_old

echo "Backup complete. Files older than ${RETENTION_DAYS} days removed from ${BACKUP_DIR}."
