-- Migration: Remove theme and primary_color from tenants table
-- These are now managed in tenant_user_visual_identity

ALTER TABLE tenants DROP COLUMN IF EXISTS theme;
ALTER TABLE tenants DROP COLUMN IF EXISTS primary_color;
