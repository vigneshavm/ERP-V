-- Migration: Add missing columns to tenants table

-- Ensure login branding columns exist
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_bg_url TEXT;

-- Business Info
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nature_of_business TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trade_description TEXT;

-- Complex Configs (JSONB)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_details JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_details JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS banking_details JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS system_config JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS loyalty_config JSONB DEFAULT '{}';

-- Optional: If you want to migrate data from the accessory tables back to the main table, 
-- you can run these (uncomment if needed):
/*
UPDATE tenants t
SET 
  business_type = b.business_type,
  nature_of_business = b.nature_of_business,
  trade_description = b.trade_description
FROM tenant_business_info b
WHERE t.id = b.tenant_id;

UPDATE tenants t
SET 
  company_details = to_jsonb(c) - 'tenant_id' - 'updated_at'
FROM tenant_company_details c
WHERE t.id = c.tenant_id;
*/
