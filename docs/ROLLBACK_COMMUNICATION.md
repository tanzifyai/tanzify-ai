# Rollback Communication Template

Use this template to notify stakeholders before/during/after a rollback.

Before rollback
- Channel: #status (tag @oncall and @engineering)
- Subject: "Planned DB rollback: <short reason>"
- Body:
  - Reason for rollback
  - Expected impact (read-only, outages)
  - Start time window
  - Contact person and phone/rotation

During rollback
- Post status updates every 15 minutes to #status
- Escalate to on-call if rollback exceeds 15 minutes

After rollback
- Confirm success, link to verification artifacts
- Schedule post-mortem if needed
