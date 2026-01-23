-- 003_razorpay_transaction.sql
-- Idempotent migration to add RPC for atomically processing Razorpay payments
-- and support tables for webhook event idempotency and dead-letter queue.

-- Notes:
-- - This file is safe to run multiple times.
-- - The function uses SECURITY DEFINER; ensure the role running migrations is a DB admin.

-- Create or replace RPC used by webhook handler to atomically update subscription and user rows.
CREATE OR REPLACE FUNCTION public.process_razorpay_payment(
  p_order_id text,
  p_payment_id text,
  p_plan_name text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub_id uuid;
  v_user_id uuid;
BEGIN
  -- Find subscription by order id
  SELECT id, user_id INTO v_sub_id, v_user_id FROM subscriptions WHERE razorpay_order_id = p_order_id LIMIT 1;

  IF v_sub_id IS NULL THEN
    RAISE NOTICE 'process_razorpay_payment: subscription not found for order %', p_order_id;
    RETURN 'no_subscription';
  END IF;

  -- Update subscription atomically
  UPDATE subscriptions
    SET razorpay_payment_id = p_payment_id,
        status = 'active',
        current_period_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = v_sub_id;

  -- Update user subscription_plan if present on subscription
  IF p_plan_name IS NOT NULL THEN
    UPDATE users SET subscription_plan = p_plan_name, updated_at = NOW() WHERE id = v_user_id;
  ELSE
    -- attempt to copy from subscriptions.plan_name
    UPDATE users SET subscription_plan = s.plan_name, updated_at = NOW()
    FROM subscriptions s WHERE s.id = v_sub_id AND users.id = v_user_id;
  END IF;

  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  -- Bubble up error to caller; caller should capture and record in dead-letter queue
  RAISE;
END;
$$;

-- Dead-letter table for failed webhook processing
CREATE TABLE IF NOT EXISTS public.webhook_dead_letters (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table for idempotency tracking
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Ensure indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_created_at ON public.webhook_dead_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);
