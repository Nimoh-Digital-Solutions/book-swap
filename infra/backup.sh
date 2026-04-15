#!/usr/bin/env bash
# BookSwap PostgreSQL backups: timestamped dumps, gzip + GPG encryption, retention cleanup.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/gnimoh001/backups/bookswap}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPT="${BACKUP_ENCRYPT:-true}"
GPG_PASSPHRASE="${BACKUP_GPG_PASSPHRASE:-}"

mkdir -p "$BACKUP_DIR"

stamp() { date +%Y%m%d_%H%M%S; }

run_dump() {
  local label="$1"
  local db_url="$2"
  local out="${BACKUP_DIR}/bookswap_${label}_$(stamp).sql"

  echo "Dumping ${label}..."
  pg_dump --dbname="$db_url" --format=plain --no-owner --no-acl -f "$out"
  gzip -f "$out"

  if [ "$ENCRYPT" = "true" ]; then
    if [ -z "$GPG_PASSPHRASE" ]; then
      echo "WARNING: BACKUP_GPG_PASSPHRASE not set — skipping encryption for ${label}"
    else
      gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "$GPG_PASSPHRASE" "${out}.gz"
      rm -f "${out}.gz"
      echo "Wrote ${out}.gz.gpg (encrypted)"
      return
    fi
  fi

  echo "Wrote ${out}.gz"
}

cleanup_old() {
  find "$BACKUP_DIR" -type f \( -name 'bookswap_*.sql.gz' -o -name 'bookswap_*.sql.gz.gpg' \) \
    -mtime "+${RETENTION_DAYS}" -print -delete
}

: "${BOOKSWAP_STAGING_DATABASE_URL:?Set BOOKSWAP_STAGING_DATABASE_URL}"
: "${BOOKSWAP_PRODUCTION_DATABASE_URL:?Set BOOKSWAP_PRODUCTION_DATABASE_URL}"

run_dump "staging" "$BOOKSWAP_STAGING_DATABASE_URL"
run_dump "production" "$BOOKSWAP_PRODUCTION_DATABASE_URL"
cleanup_old

echo "Backup complete. Files older than ${RETENTION_DAYS} days removed from ${BACKUP_DIR}."
echo ""
echo "To restore an encrypted backup:"
echo "  gpg --decrypt backup.sql.gz.gpg | gunzip | psql \$DATABASE_URL"
