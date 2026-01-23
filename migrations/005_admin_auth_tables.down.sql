-- rollback for 005_admin_auth_tables.sql
DROP TABLE IF EXISTS admin_failed_logins;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS admin_password_history;
DROP TABLE IF EXISTS admin_users;
