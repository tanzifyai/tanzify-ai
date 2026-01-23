# Rollback Runbook

This runbook describes when and how to rollback database migrations, safety checks, and recovery steps.

## When to rollback vs fix-forward
- Rollback when migration caused data corruption or schema changes that block critical functionality and a tested rollback exists.
- Fix-forward when the change is additive or when rollback risk is higher than migration fix.

## Pre-flight checklist
1. Ensure a valid backup exists. `backups/` should contain a recent dump. If not, run:

```bash
node scripts/backup-rotate.js
```

2. Verify no active user-critical traffic (prefer maintenance window).
3. Verify disk space and DB health.
4. Notify stakeholders and prepare communication channels.

## Rolling back
1. Run a dry-run to see what would be rolled back:

```bash
node scripts/run-migrations.js --rollback --dry-run
```

2. Create a fresh backup (the runner will attempt one automatically). To manually create:

```bash
node scripts/backup-rotate.js
```

3. Run rollback interactively (will prompt for confirmation):

```bash
node scripts/run-migrations.js --rollback
```

4. For automated rollback to a specific migration:

```bash
node scripts/run-migrations.js --rollback-to 002_add_razorpay_indexes.sql --yes
```

## Emergency recovery
If rollback fails or data is lost, restore from the pre-rollback backup:

```bash
node scripts/emergency-recovery.js --backup backups/pre_rollback_2024-01-01T00-00-00.sql
```

After restore, validate data consistency and notify stakeholders.

## Post-rollback validation
- Run `npm run db:verify` to ensure migrations match expected state.
- Run integration tests and smoke tests for affected features (payments, subscriptions).
- Monitor metrics for regressions.

## Communication plan
- Before rollback: announce to #status and pager duty.
- During rollback: update every 15 minutes.
- After rollback: confirm success and schedule a post-mortem.

## Notes
- Rollbacks may be destructive for data written after migration. Always prefer backups and tested rollback scripts.
- Maintain your backup retention policy and rotate backups offsite for safety.

## Safety enhancements (override and audit)

- Peak-hours prevention enforced by `scripts/run-migrations.js` using `safety-config.json` (default 09:00-18:00 Mon-Fri).
- For emergency rollbacks during business hours, request an override:
	- Create a request token: `node scripts/request-override.js` (share token with admin).
	- Admin approves: `node scripts/approve-override.js <token>` (adds token to `safety/approved_overrides.json`).
- All rollback attempts are appended to `logs/rollback_audit.log` with timestamp, user, options, and result.

