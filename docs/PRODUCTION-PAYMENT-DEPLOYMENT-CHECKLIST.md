# Production Payment Deployment Checklist

Pre-deploy (prepare)
- Verify env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SENTRY_DSN`, `ALERT_WEBHOOK_URL`.
- Ensure backups working: run `pg_dump` against production DB and verify a restore to a staging DB.
- Confirm migrations applied in staging using `npm run db:verify` and `npm run db:migrate` on staging.

Deployment steps
- Deploy code to a staging environment and run the full payment E2E test (see `scripts/test-payment-flow.js`).
- Smoke-test subscription creation and payment capture flows.
- Validate idempotency by sending duplicate signed webhook events.

Post-deploy (production)
- Apply migrations during a maintenance window. Use `node scripts/run-migrations.js --dry-run` then run without `--dry-run`.
- Create a backup before applying migrations (runner does this automatically if `pg_dump` available).
- After deploy, run `curl https://<your-domain>/api/health` and validate checks.
- Monitor `webhook_dead_letters` and `webhook_events` tables for unusual errors.

Monitoring & alerts
- Add an uptime check to hit `/api/health` every minute.
- Create alerts for:
  - `/api/health` returning non-200
  - Sentry errors tagged `razorpay-webhook` or `payment-processing`
  - Increasing trend in `webhook_dead_letters`

Rollback guidance
- If a migration causes failures, use the migration runner rollback flow: `node scripts/run-migrations.js --rollback`.
- Follow `docs/ROLLBACK-RUNBOOK.md` and notify the team via `docs/ROLLBACK_COMMUNICATION.md`.

Contact points
- Billing on-call: add slack channel and paging escalation in `ALERT_WEBHOOK_URL` integration.
