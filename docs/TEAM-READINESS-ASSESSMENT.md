**Team Readiness Assessment**

- **Support team training**
  - Run a 60–90 minute pre-launch walkthrough covering:
    - How to verify health checks and basic logs
    - How to escalate to on-call engineer and incident lead
    - How to use response templates for customer-facing communications
  - Provide short playbook PDF and quick runbook links.

- **Admin access distribution**
  - Ensure admin accounts for critical systems (DB, deploy, monitoring) are granted using least privilege.
  - Two-person control for sensitive operations (DB restore, secret rotation).

- **Emergency contact list**
  - Primary on-call engineer (name, mobile)
  - Secondary on-call (name, mobile)
  - Product owner
  - Release manager
  - Support lead
  - Pager/alert contact (PagerDuty channel)

- **Documentation**
  - Incident runbook and deployment guide accessible in `docs/DEPLOYMENT-GUIDE.md`.
  - Rollback playbook and migration checklist available in `docs/ROLLBACK-EMERGENCY-PLAN.md`.
  - Contact list and escalation policy posted to internal wiki.

- **Readiness sign-off**
  - Engineering lead: ___________________
  - Product owner: ______________________
  - Support lead: _______________________
  - On-call lead (first 48h): ___________

Notes: Run a rehearsal (fire-drill) for incident response before launch; time it and capture gaps.