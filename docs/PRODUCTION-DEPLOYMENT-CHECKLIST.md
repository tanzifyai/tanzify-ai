**Production Deployment Checklist (consolidated)**

This single document contains the essential production checklist, go-live steps, rollback plan, and team readiness items for a minimal, foolproof, zero-downtime deployment.

1) Environment validation
- Required env vars (verify each in production secret manager):
  - `DATABASE_URL`
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
  - `ALERT_WEBHOOK_URL`, `SENTRY_DSN`, `NODE_ENV=production`
  - Any other service credentials used by the app (email, storage, CDN keys)
- Database backups and recovery:
  - Nightly logical backups configured and retained (>= 30 days).
  - Point-in-time recovery (PITR) enabled where possible.
  - Test restore to staging within last 7 days.
- SSL / Certificates:
  - TLS certs issued and auto-renewal tested for all domains.
  - Enforce HTTPS for application and webhook endpoints.
- CDN:
  - CDN configured; cache rules reviewed. Plan for cache invalidation.

2) Payment gateway (Razorpay)
- Configure production Razorpay webhook URL and set `RAZORPAY_WEBHOOK_SECRET` in secrets manager.
- Verify signature validation logic on staging using the same secret.
- Run controlled test payments and refunds; confirm DB side-effects and invoice flows.

3) Monitoring & Observability
- Health endpoints: `/api/health`, `/api/health/db` — set uptime checks.
- Error tracking: `SENTRY_DSN` configured; send a test error to Sentry.
- Performance/metrics: APM or metrics exporter configured; record staging baselines.
- Alerts: Slack/PagerDuty/email alerts configured and tested with runbooks.

4) CI / Release
- Ensure CI (release branch) passes unit + integration tests.
- Build and tag immutable release artifact (container image or build output).
- Run DB migration dry-run on a copy of production schema; review locks and long queries.

5) Zero-downtime Go-Live (minimal steps)
- Pre-launch (24 hours prior):
  - Notify stakeholders and on-call; take final DB backup.
  - Ensure feature flags for risky changes are OFF.
  - Pause non-critical background jobs where possible.
- Launch window (rolling deploy):
  1. Deploy artifact to a canary instance; verify `/api/health` and logs for 5–10 minutes.
  2. If canary healthy, roll deploy to remaining instances with health checks.
  3. Run DB migrations that are backward-compatible (additive). For destructive changes, follow multi-step migration plan.
  4. Run smoke tests (login, payment flow, webhook processing).
- Post-launch (immediate):
  - Confirm health endpoints, DB replica lag, and error rate.
  - Send a staged Razorpay test webhook and confirm processing.
  - Resume paused jobs.

6) Rollback / Emergency plan (fast and safe)
- Preferred: Code rollback (fast path)
  - Re-deploy previous stable artifact/tag via rolling deploy.
  - Validate on canary then promote.
- DB rollback (last resort)
  - If schema migration caused failure and can't be mitigated with feature flags, restore from verified backup (expect downtime).
  - Prepare reverse migration scripts for destructive changes before deployment.
- Communication
  - Incident lead notifies Product, Support, Engineering, and Operations.
  - Use pre-written customer/support message templates.

7) Team readiness
- Support training: 60–90 minute walkthrough and runbook PDF.
- Admin access: least-privilege admin accounts; two-person control for sensitive ops.
- Emergency contacts: list primary/secondary on-call, product owner, release manager, support lead.
- Sign-offs: engineering lead, product owner, support lead, on-call lead.

8) Operational checklist (final quick ticks)
- [ ] All env vars present & validated
- [ ] Latest DB backup created and verified
- [ ] Migration plan reviewed and dry-run completed
- [ ] Release artifact built and tagged
- [ ] Canary deploy successful
- [ ] Smoke tests (including Razorpay webhook) passed
- [ ] Alerts and Sentry verified

9) Exact production deployment commands (minimal viable)
Run these on a deployment host or CI job targeting production environment and the tagged artifact.

```bash
# build the production artifact
npm run build

# apply DB migrations
npm run db:migrate

# run verification checks (smoke tests / health checks)
npm run verify:all

# start the production process (or push the artifact to the runtime platform)
npm start

# verify health endpoint
curl https://yourapp.com/api/health
```

Notes: adapt `npm start` to your runtime (container push + orchestration commands may replace these). Keep the above as the minimal, copyable sequence for manual deploys.

---
Keep this file as the single source of truth for releases. Remove other deployment docs and reference this for sign-off and post-launch checks.