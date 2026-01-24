-- Migration: Consolidate Logo Configuration

-- 1. Rename column in tenant_user_visual_identity
ALTER TABLE tenant_user_visual_identity 
RENAME COLUMN dashboard_logo_url TO login_logo_url;

-- 2. Drop the redundant column from tenants (if it somehow exists or for cleanup)
-- Note: We know it's missing in some environments, but we want to ensure it's gone for consistency.
ALTER TABLE tenants DROP COLUMN IF EXISTS login_logo_url;
ALTER TABLE tenants DROP COLUMN IF EXISTS login_bg_url;
