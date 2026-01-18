-- Tanzify AI Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gifcauimoiiiimsdjlz/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 30,
  minutes_used INTEGER DEFAULT 0,
  subscription_plan TEXT,
  stripe_customer_id TEXT,
  razorpay_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  duration DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  razorpay_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can view own transcriptions" ON transcriptions
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE firebase_uid = auth.uid()::text
  ));

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE firebase_uid = auth.uid()::text
  ));

-- Create indexes for better performance
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Insert test data (optional - remove in production)
-- INSERT INTO users (firebase_uid, email, name, credits) VALUES
-- ('test-uid-123', 'test@example.com', 'Test User', 30);