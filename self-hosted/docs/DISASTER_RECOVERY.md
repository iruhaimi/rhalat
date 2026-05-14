# Disaster Recovery

**RTO target:** < 30 minutes on a fresh VPS.

## Pre-conditions
- restic snapshots running daily and verified.
- `.env` backed up to encrypted offsite vault.

## Procedure
1. Spin up new Ubuntu 22.04 VPS.
2. Copy `.env` to `/tmp/.env`.
3. `export REPO_URL=... ENV_BACKUP=/tmp/.env`
4. Run `infrastructure/backups/disaster-recovery.sh`.
5. Update DNS A records.
6. Verify `curl https://DOMAIN/health`.

## Quarterly DR drill
Run the procedure on a throwaway VPS once per quarter; record time-to-restore in `docs/dr-drills.log`.