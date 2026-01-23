-- ============================================
-- RAZORPAY COMPLETE MIGRATION SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- STEP 1: Verify current schema
-- List tables in public schema
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Inspect `users` table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Inspect `subscriptions` table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Add missing columns to users table (idempotent)
-- Adds Razorpay customer/subscription identifiers
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- STEP 3: Add missing columns to subscriptions table (idempotent)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- STEP 4: Create/Rebuild all indexes (DROP if exists then CREATE)
-- Users indexes
DROP INDEX IF EXISTS idx_users_razorpay_customer;
CREATE INDEX IF NOT EXISTS idx_users_razorpay_customer ON users(razorpay_customer_id);

DROP INDEX IF EXISTS idx_users_razorpay_subscription;
CREATE INDEX IF NOT EXISTS idx_users_razorpay_subscription ON users(razorpay_subscription_id);

-- Subscriptions indexes
DROP INDEX IF EXISTS idx_subscriptions_razorpay_payment;
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_payment ON subscriptions(razorpay_payment_id);

DROP INDEX IF EXISTS idx_subscriptions_razorpay_order;
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order ON subscriptions(razorpay_order_id);

DROP INDEX IF EXISTS idx_subscriptions_razorpay_subscription;
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription ON subscriptions(razorpay_subscription_id);

DROP INDEX IF EXISTS idx_subscriptions_user_id;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

DROP INDEX IF EXISTS idx_subscriptions_status;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

DROP INDEX IF EXISTS idx_subscriptions_current_period_end;
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

DROP INDEX IF EXISTS idx_subscriptions_current_period_start;
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_start ON subscriptions(current_period_start);

-- STEP 5: Verification queries
-- Confirm new columns exist on users
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE 'razorpay_%';

-- Confirm new columns exist on subscriptions
SELECT column_name FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name LIKE 'razorpay_%';

-- Check indexes present
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('users', 'subscriptions');

-- STEP 6: (Commented) Rollback statements
-- If something goes wrong, you can run the following rollback statements carefully.
-- NOTE: Dropping columns will delete data. Use with caution.
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_subscriptions_current_period_start;
-- DROP INDEX IF EXISTS idx_subscriptions_current_period_end;
-- DROP INDEX IF EXISTS idx_subscriptions_status;
-- DROP INDEX IF EXISTS idx_subscriptions_user_id;
-- DROP INDEX IF EXISTS idx_subscriptions_razorpay_subscription;
-- DROP INDEX IF EXISTS idx_subscriptions_razorpay_order;
-- DROP INDEX IF EXISTS idx_subscriptions_razorpay_payment;
-- DROP INDEX IF EXISTS idx_users_razorpay_subscription;
-- DROP INDEX IF EXISTS idx_users_razorpay_customer;
--
-- -- Drop columns (destructive)
-- ALTER TABLE subscriptions
--   DROP COLUMN IF EXISTS razorpay_order_id,
--   DROP COLUMN IF EXISTS razorpay_payment_id,
--   DROP COLUMN IF EXISTS razorpay_subscription_id;
--
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS razorpay_customer_id,
--   DROP COLUMN IF EXISTS razorpay_subscription_id;

-- End of migration
