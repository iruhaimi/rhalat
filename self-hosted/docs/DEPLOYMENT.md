# Deployment

1. Provision Ubuntu 22.04 VPS, point DNS to IP.
2. `curl -fsSL https://get.docker.com | sh`
3. `git clone <repo> /opt/visafaster && cd /opt/visafaster/self-hosted`
4. `cp .env.example .env` and fill secrets.
5. `docker compose up -d` (migrations run automatically).
6. Promote first super_admin:
   ```bash
   docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
     "INSERT INTO user_roles (user_id, role) SELECT id, 'super_admin' FROM users WHERE email='you@visafaster.com';"
   ```
7. Optional monitoring: `cd infrastructure/monitoring && docker compose -f docker-compose.monitoring.yml up -d`
8. Cron backup: `echo "0 3 * * * root /opt/visafaster/self-hosted/infrastructure/backups/backup.sh" | sudo tee /etc/cron.d/vf-backup`
9. CI: set Gitea secrets `DEPLOY_KEY`, `DEPLOY_USER`, `DEPLOY_HOST`.