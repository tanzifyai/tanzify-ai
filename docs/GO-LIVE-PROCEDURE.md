**Go-Live Procedure (Zero-Downtime)**

1) Pre-launch (24 hours before, checklist)
- Notify stakeholders and on-call of planned window and rollback plan.
- Ensure maintenance-free time: choose low-traffic window; confirm with analytics.
- Run final CI pipeline against release branch; build artifact.
- Create final DB backup and verify restore point.
- Verify all feature flags default to off for new features if toggles exist.
- Ensure read-only replicas are healthy (for cutover if needed).
- Confirm third-party quotas and API limits (Razorpay, email, SMS).

2) Launch window (step-by-step)
- Step 0: Put non-critical background jobs into paused mode (if applicable).
- Step 1: Deploy application artifact to canary/one instance.
  - Verify health endpoint and logs for errors for 5–10 minutes.
- Step 2: Promote build to remaining instances (rolling deploy).
  - Use health checks to only promote healthy instances.
  - Keep old version available until new version passes all smoke checks.
- Step 3: Apply DB migrations following zero-downtime rules:
  - Use backward-compatible migrations: add columns with defaults NULL; avoid destructive changes.
  - If changing columns used by reads/writes, use multi-step migration (add column -> deploy -> backfill -> switch reads -> drop old column).
  - Run migrations on a single node or a migration job; monitor queries and locks.
- Step 4: Switch feature flags ON incrementally (if used).
- Step 5: Run smoke tests (end-to-end payment, login, critical flows).

3) Post-launch validation (immediate)
- Verify health endpoints and DB replica lag.
- Check error rate in Sentry and APM for new alerts.
- Verify webhook processing: send a test webhook (Razorpay test) and confirm DB changes.
- Validate notifications (email/SMS) and invoice generation.
- Confirm background jobs resumed and working.

4) Monitoring (first 48 hours)
- Dedicated engineer on-call for first 48 hours; rotate responsibility.
- Strict alert thresholds for error rates, latency, 5xx, DB connections, and queue backlogs.
- Daily short sync after 6 and 24 hours to capture issues and decisions.

Roll-forward criteria
- All smoke tests green, error rate at or below baseline, and webhook/payment processing confirmed.

Rollback criteria
- New critical errors causing user-facing failures, failed migrations, or critical third-party breakage.
- If rollback required, follow `ROLLBACK-EMERGENCY-PLAN.md`.

Notes: Prefer rolling updates and backward-compatible DB changes to achieve zero downtime.