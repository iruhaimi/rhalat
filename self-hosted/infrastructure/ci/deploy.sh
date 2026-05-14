#!/usr/bin/env bash
set -euo pipefail
cd /opt/visafaster && git pull --ff-only
cd self-hosted
docker compose pull && docker compose up -d --build
docker compose exec -T backend npx prisma migrate deploy
for i in $(seq 1 20); do curl -sf http://localhost/health >/dev/null && break || sleep 3; done
echo "Deploy OK."