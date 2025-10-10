#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  COMPOSE_FILE="${SCRIPT_DIR}/../docker-compose.yml"
fi

BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
BACKUP_PREFIX="${POSTGRES_BACKUP_PREFIX:-tianji-postgres}"
KEEP_LOCAL_COPY="${KEEP_LOCAL_COPY:-false}"
KEEP_PARTIAL_DUMP="${KEEP_PARTIAL_DUMP:-false}"
R2_REGION="${R2_REGION:-auto}"
R2_PREFIX="${R2_PREFIX:-tianji}"
R2_ENDPOINT="${R2_ENDPOINT:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
}

abort() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || abort "Command '$1' is required but not found in PATH."
}

require_env() {
  local var_name="$1"
  local value="${!var_name:-}"
  [ -n "$value" ] || abort "Environment variable '$var_name' is required."
}

[ -f "$COMPOSE_FILE" ] || abort "docker-compose.yml not found next to the script or one directory above."

require_command docker

DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
  else
    abort "Neither 'docker compose' nor 'docker-compose' command is available."
  fi
fi

if ! $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" config --services | grep -qx 'postgres'; then
  abort "Service 'postgres' not found in docker-compose.yml."
fi

POSTGRES_CONTAINER_ID="$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps -q postgres || true)"

if [ -z "$POSTGRES_CONTAINER_ID" ]; then
  log "Postgres container is not running. Bringing it up..."
  $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres >/dev/null
  POSTGRES_CONTAINER_ID="$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps -q postgres || true)"
  [ -n "$POSTGRES_CONTAINER_ID" ] || abort "Failed to start postgres service."
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
BACKUP_FILENAME="${BACKUP_PREFIX}_${TIMESTAMP}.dump"
LOCAL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

log "Creating Postgres dump at ${LOCAL_BACKUP_PATH}"

cleanup_partial_dump() {
  if [ -f "$LOCAL_BACKUP_PATH" ] && [ "$KEEP_PARTIAL_DUMP" != "true" ]; then
    rm -f "$LOCAL_BACKUP_PATH"
  fi
}

trap cleanup_partial_dump EXIT

$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres bash -c 'set -euo pipefail; export PGPASSWORD="${POSTGRES_PASSWORD}"; pg_dump --format=custom --no-owner --no-acl -U "${POSTGRES_USER}" "${POSTGRES_DB:-${POSTGRES_USER}}"' >"$LOCAL_BACKUP_PATH"

trap - EXIT

require_command aws

require_env R2_BUCKET
require_env R2_ACCOUNT_ID
require_env R2_ACCESS_KEY_ID
require_env R2_SECRET_ACCESS_KEY

R2_ENDPOINT="${R2_ENDPOINT:-https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com}"

REMOTE_KEY="$BACKUP_FILENAME"
if [ -n "$R2_PREFIX" ]; then
  R2_PREFIX="${R2_PREFIX%/}"
  REMOTE_KEY="${R2_PREFIX}/${REMOTE_KEY}"
fi

REMOTE_URI="s3://${R2_BUCKET%/}/${REMOTE_KEY}"

log "Uploading backup to ${REMOTE_URI} via R2"

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION="$R2_REGION" \
aws s3 cp "$LOCAL_BACKUP_PATH" "$REMOTE_URI" --endpoint-url "$R2_ENDPOINT"

if [ "$KEEP_LOCAL_COPY" != "true" ]; then
  log "Removing local backup ${LOCAL_BACKUP_PATH}"
  rm -f "$LOCAL_BACKUP_PATH"
else
  log "Keeping local backup ${LOCAL_BACKUP_PATH}"
fi

log "Backup completed successfully"
