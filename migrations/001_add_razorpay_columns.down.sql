-- 001_add_razorpay_columns.down.sql
-- Rollback for 001_add_razorpay_columns.sql
-- This will remove the Razorpay-related columns from users and subscriptions tables.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS subscriptions
  DROP COLUMN IF EXISTS razorpay_order_id,
  DROP COLUMN IF EXISTS razorpay_payment_id,
  DROP COLUMN IF EXISTS razorpay_subscription_id;

ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS razorpay_customer_id,
  DROP COLUMN IF EXISTS razorpay_subscription_id;

-- Clean up indexes if present
DROP INDEX IF EXISTS idx_users_razorpay_customer;
DROP INDEX IF EXISTS idx_subscriptions_razorpay_payment;
DROP INDEX IF EXISTS idx_subscriptions_razorpay_order;
