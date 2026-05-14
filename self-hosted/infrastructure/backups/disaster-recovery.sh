#!/usr/bin/env bash
# Full DR: bootstrap fresh VPS to working stack in <30 min.
set -euo pipefail
curl -fsSL https://get.docker.com | sh
git clone "${REPO_URL:?}" /opt/visafaster
cd /opt/visafaster/self-hosted
cp "${ENV_BACKUP:?}" .env
docker compose up -d postgres redis minio minio-init
sleep 20
export RESTIC_REPOSITORY RESTIC_PASSWORD AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
LATEST_DB=$(restic snapshots --tag db --json | jq -r '.[-1].id')
LATEST_MINIO=$(restic snapshots --tag minio --json | jq -r '.[-1].id')
restic restore "$LATEST_DB" --target /tmp/dr-db
restic restore "$LATEST_MINIO" --target /
./infrastructure/backups/restore.sh "$(ls /tmp/dr-db/var/backups/visafaster/db-*.dump.gz | tail -1)"
docker compose up -d
echo "DR complete."