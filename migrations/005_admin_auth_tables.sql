-- 005_admin_auth_tables.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'db-admin',
  must_change_password BOOLEAN DEFAULT FALSE,
  last_password_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token TEXT PRIMARY KEY,
  admin_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consumed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS admin_failed_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  ip TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
