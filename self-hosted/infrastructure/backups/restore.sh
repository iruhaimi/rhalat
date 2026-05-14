#!/usr/bin/env bash
set -euo pipefail
FILE="${1:?Usage: restore.sh <dump.gz>}"
gunzip -c "$FILE" | docker exec -i visafaster-postgres-1 \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner
echo "Restore from $FILE complete."