-- Rollback for 004_create_admin_sessions.sql
DROP INDEX IF EXISTS idx_admin_sessions_admin_id;
DROP TABLE IF EXISTS admin_sessions;
