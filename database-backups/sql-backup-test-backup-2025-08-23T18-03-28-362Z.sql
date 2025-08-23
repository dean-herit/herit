-- SQL Database Backup
-- Generated: 2025-08-23T18:03:28.363Z
-- Name: test-backup
-- 
-- This backup can be restored using: psql "$POSTGRES_URL" < sql-backup-test-backup-2025-08-23T18-03-28-362Z.sql

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

BEGIN;

-- Failed to backup table: app_refresh_tokens
-- Error: Error: Failed query: SELECT * FROM "app_refresh_tokens"
params: 

-- Failed to backup table: app_users
-- Error: Error: Failed query: SELECT * FROM "app_users"
params: 

-- Failed to backup table: assets
-- Error: Error: Failed query: SELECT * FROM "assets"
params: 

-- Failed to backup table: audit_events
-- Error: Error: Failed query: SELECT * FROM "audit_events"
params: 

-- Failed to backup table: beneficiaries
-- Error: Error: Failed query: SELECT * FROM "beneficiaries"
params: 

-- Failed to backup table: signature_usage
-- Error: Error: Failed query: SELECT * FROM "signature_usage"
params: 

-- Failed to backup table: signatures
-- Error: Error: Failed query: SELECT * FROM "signatures"
params: 

-- Failed to backup table: users
-- Error: Error: Failed query: SELECT * FROM "users"
params: 

-- Failed to backup table: wills
-- Error: Error: Failed query: SELECT * FROM "wills"
params: 


-- Restore sequences
SELECT setval(pg_get_serial_sequence('assets', 'id'), COALESCE(MAX(id), 1)) FROM assets WHERE id IS NOT NULL;
SELECT setval(pg_get_serial_sequence('beneficiaries', 'id'), COALESCE(MAX(id), 1)) FROM beneficiaries WHERE id IS NOT NULL;

COMMIT;

-- Backup completed: 2025-08-23T18:03:28.985Z
