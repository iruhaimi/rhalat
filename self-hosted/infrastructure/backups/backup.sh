#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S); OUT=/var/backups/visafaster; mkdir -p "$OUT"
docker exec visafaster-postgres-1 pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$OUT/db-$TS.dump"
gzip -f "$OUT/db-$TS.dump"
export RESTIC_REPOSITORY RESTIC_PASSWORD AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
restic snapshots >/dev/null 2>&1 || restic init
restic backup /var/lib/docker/volumes/visafaster_minio_data --tag "minio-$TS"
restic backup "$OUT" --tag "db-$TS"
restic forget --prune --keep-daily 7 --keep-weekly 4 --keep-monthly 6
find "$OUT" -name "db-*.dump.gz" -mtime +14 -delete
echo "Backup $TS complete."