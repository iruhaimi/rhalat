#!/usr/bin/env bash
set -euo pipefail
mc alias set local "http://${MINIO_ENDPOINT}:${MINIO_PORT}" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
for b in documents avatars public; do mc mb -p "local/$b" || true; done
mc anonymous set download local/public
mc encrypt set sse-s3 local/documents
mc encrypt set sse-s3 local/avatars