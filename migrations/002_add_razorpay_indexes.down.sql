-- 002_add_razorpay_indexes.down.sql
-- Rollback for 002_add_razorpay_indexes.sql
-- Drops indexes created by the migration. Safe to run multiple times.

DROP INDEX IF EXISTS idx_users_razorpay_customer;
DROP INDEX IF EXISTS idx_users_razorpay_subscription;

DROP INDEX IF EXISTS idx_subscriptions_razorpay_payment;
DROP INDEX IF EXISTS idx_subscriptions_razorpay_order;
DROP INDEX IF EXISTS idx_subscriptions_razorpay_subscription;

DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_current_period_end;
DROP INDEX IF EXISTS idx_subscriptions_current_period_start;
