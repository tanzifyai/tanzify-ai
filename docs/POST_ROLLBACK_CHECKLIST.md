# Post-Rollback Validation Checklist

- Run `npm run db:verify` and ensure schema matches expected state.
- Run smoke tests for payments, subscriptions, and webhook processing.
- Validate critical table counts (payments, subscriptions) and sample rows.
- Verify that `webhook_events` and `webhook_dead_letters` are intact.
- Re-run integration tests and CI: `npm test`.
- Monitor error tracking (Sentry) and metrics for 1-2 hours.
- Communicate result to stakeholders.
