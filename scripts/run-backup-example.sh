#!/usr/bin/env bash

set -euo pipefail

# Example startup script for backup-db.sh. Adjust values as needed before running.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"   # Directory to store temporary backup files
export POSTGRES_BACKUP_PREFIX="${POSTGRES_BACKUP_PREFIX:-tianji-postgres}"   # Prefix for backup file names
export KEEP_LOCAL_COPY="${KEEP_LOCAL_COPY:-false}"   # Set to "true" to keep local dump after upload
export KEEP_PARTIAL_DUMP="${KEEP_PARTIAL_DUMP:-false}"   # Set to "true" to keep partial dump if script fails

# PostgreSQL container must expose these environment variables.
export POSTGRES_USER="${POSTGRES_USER:-tianji}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-tianji}"
export POSTGRES_DB="${POSTGRES_DB:-tianji}"

# Cloudflare R2 credentials. Replace placeholders with real values.
export R2_BUCKET="${R2_BUCKET:-your-r2-bucket}"
export R2_ACCOUNT_ID="${R2_ACCOUNT_ID:-your-account-id}"
export R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-your-access-key}"
export R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-your-secret-key}"
export R2_REGION="${R2_REGION:-auto}"
export R2_PREFIX="${R2_PREFIX:-}"   # Optional path prefix in the bucket
export R2_ENDPOINT="${R2_ENDPOINT:-}"        # Optional custom endpoint, defaults to Cloudflare domain in backup script

exec "${SCRIPT_DIR}/backup-db.sh"
