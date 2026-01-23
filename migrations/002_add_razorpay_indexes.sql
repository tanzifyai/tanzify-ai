-- Create indexes for Razorpay columns for better query performance
CREATE INDEX IF NOT EXISTS idx_users_razorpay_customer ON users(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_razorpay_subscription ON users(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_payment ON subscriptions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order ON subscriptions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription ON subscriptions(razorpay_subscription_id);

-- Also add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_start ON subscriptions(current_period_start);
