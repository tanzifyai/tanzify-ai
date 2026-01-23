-- 003_razorpay_transaction.down.sql
-- Rollback for 003_razorpay_transaction.sql
-- Removes RPC and supporting tables for webhook idempotency and dead-letter queue.
-- WARNING: Dropping the dead-letter table will lose records. Review before running in production.

-- Drop RPC
DROP FUNCTION IF EXISTS public.process_razorpay_payment(text, text, text);

-- Optionally drop webhook support tables
-- Be cautious: these may contain historical records required for audits.
-- Uncomment to drop in non-production or after archiving.

-- DROP TABLE IF EXISTS public.webhook_dead_letters;
-- DROP TABLE IF EXISTS public.webhook_events;
