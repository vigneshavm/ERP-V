-- Migration: Cleanup legacy modules column

ALTER TABLE tenants DROP COLUMN IF EXISTS modules;
