#!/usr/bin/env bash
# Validates that required EXPO_PUBLIC_* env vars are set before building.
# Sourced by build scripts; exits non-zero if any required var is missing.

set -euo pipefail

REQUIRED_VARS=(
  EXPO_PUBLIC_API_URL
)

missing=()

# Source .env if it exists and vars aren't already set
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: Missing required environment variables:"
  for var in "${missing[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set them in mobile/.env (local) or via 'eas secret:create' (CI)."
  exit 1
fi

echo "✓ All required env vars are set."
