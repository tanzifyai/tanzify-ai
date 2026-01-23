# Razorpay Webhook Configuration (Production)

Follow these steps to configure Razorpay webhooks for production safely.

1) Create webhook endpoint
- URL: `https://<your-domain>/api/razorpay/webhook`
- Method: `POST`
- Content type: `application/json`

2) Generate and store webhook secret
- In Razorpay dashboard create new webhook and note the `Webhook Secret`.
- Set in production environment: `RAZORPAY_WEBHOOK_SECRET`.

3) Subscribe to events (recommended)
- `payment.captured`, `payment.failed`, `subscription.created`, `subscription.activated`, `subscription.cancelled`, `subscription.paused`, `invoice.paid`

4) Configure retries & TLS
- Enable TLS and require HTTPS.
- Configure retry policy in Razorpay dashboard. Keep default exponential backoff.

5) Test on staging before production
- Use `scripts/test-payment-flow.js` to simulate signed webhooks. Example:
  - Set `WEBHOOK_URL` to your staging webhook URL.
  - Ensure `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are set.
  - Run: `NODE_OPTIONS=--experimental-fetch node scripts/test-payment-flow.js`

6) Production checklist (quick)
- Ensure `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` are set in env.
- Ensure `/api/health` and `/api/status` are accessible and monitored.
- Configure alerting (Sentry, Slack) for webhook failures and DLQ entries.
- Enable idempotency and DLQ retry in the webhook handler (already implemented in codebase).

7) On-call runbook
- If webhook processing fails repeatedly, check `webhook_dead_letters` table and use admin retry endpoint in the admin UI.
