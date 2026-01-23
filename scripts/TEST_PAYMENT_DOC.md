Test Payment Flow - Documentation

Prerequisites
- Supabase: ensure `database-schema.sql` and migrations have been applied. OPTIONAL: create `webhook_events` table:

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

- Environment variables (for local testing):
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - RAZORPAY_WEBHOOK_SECRET
  - RAZORPAY_KEY_ID (for validate-env)
  - RAZORPAY_KEY_SECRET (for validate-env)
  - WEBHOOK_URL (optional) — default: http://localhost:3001/api/razorpay/webhook

Scripts
- Validate environment:

  node scripts/validate-env.js

- Run payment flow tests (simulates webhooks and validates DB):

  NODE_OPTIONS=--experimental-fetch node scripts/test-payment-flow.js

Test cases covered
1. Successful one-time payment (payment.captured)
2. Duplicate webhook handling (idempotency)
3. Subscription created/activated
4. Failed payment (marks subscription past_due)

Notes
- The handler uses an optional `webhook_events` table for idempotency; create it in Supabase if you want persisted event records.
- The handler will attempt up to 3 retries for DB writes and call `ALERT_WEBHOOK_URL` (if set) when critical failures occur.
- For full end-to-end verification, run the app server or point `WEBHOOK_URL` to your deployed webhook endpoint.
