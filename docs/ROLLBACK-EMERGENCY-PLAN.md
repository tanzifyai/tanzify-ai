**Rollback Emergency Plan**

1) Principles
- Aim for the least destructive rollback that restores customer-facing functionality.
- Prefer code rollback over DB rollback when possible; DB rollbacks are high-risk.
- Communicate clearly and early to customers and internal teams.

2) Code rollback (fast path)
- If the release is a container image or git tag, re-deploy the previous stable artifact/tag.
- Steps:
  1. Mark release as failed in release notes and incident tracker.
  2. Deploy previous artifact to a single instance (canary) and validate smoke tests.
  3. If canary passes, perform rolling deploy of previous artifact to all instances.
  4. Monitor logs, Sentry, and metrics closely during rollback.

3) Database rollback (when unavoidable)
- Preferred: restore service behavior without rolling DB back (use feature flags to ignore new columns/logic).
- If DB schema change caused the issue and requires rollback:
  - Stop write traffic or reduce to a minimum if necessary.
  - Restore DB from the most recent verified backup to a separate cluster for verification.
  - If acceptable, perform a controlled restore to production (expect downtime).
  - Communicate expected data loss or divergence.
- If a migration added destructive changes (DROP COLUMN), have a pre-built reverse migration ready.

4) Communication plan
- Incident lead notifies: Product, Support, Engineering, Legal (if needed), and Operations.
- Prepare public-facing message templates for Support to use (short outage message, ETA, instructions).
- Triage channel (Slack/Teams) and incident doc opened with timeline and decisions.

5) Post-mortem
- Create a post-mortem within 48 hours: timeline, root cause, remediation, and action owners.
- Adjust deployment and migration procedures to prevent recurrence.

6) Checklist for rollback readiness (pre-flight)
- [ ] Daily DB backups and recent restore test
- [ ] Backout scripts for DB migrations available
- [ ] Previous stable artifact tagged & available
- [ ] Incident communication templates ready
- [ ] Emergency contact list accessible

Notes: Treat DB restores as last resort — the cost is high. Prefer feature-flag driven rollbacks and code redeploys for zero-downtime recovery.