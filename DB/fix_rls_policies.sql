-- 1. Update the validation trigger function to be SECURITY DEFINER
-- This allows it to see tenant_users regardless of the caller's RLS permissions.
CREATE OR REPLACE FUNCTION ensure_user_belongs_to_tenant()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tenant_users
        WHERE id = NEW.user_id
        AND tenant_id = NEW.tenant_id
    ) THEN
        RAISE EXCEPTION 'User does not belong to tenant';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS is enabled on all accessory tables
ALTER TABLE tenant_business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_tax_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

-- 3. Ensure RLS is enabled on the mapping table
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing conflicting policies to ensure idempotency
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_business_info;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_company_details;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_tax_details;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_banking_details;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_system_config;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_integrations;

DROP POLICY IF EXISTS "tenant_business_info_isolation" ON tenant_business_info;
DROP POLICY IF EXISTS "tenant_company_details_isolation" ON tenant_company_details;
DROP POLICY IF EXISTS "tenant_tax_details_isolation" ON tenant_tax_details;
DROP POLICY IF EXISTS "tenant_banking_details_isolation" ON tenant_banking_details;
DROP POLICY IF EXISTS "tenant_system_config_isolation" ON tenant_system_config;
DROP POLICY IF EXISTS "tenant_integrations_isolation" ON tenant_integrations;

DROP POLICY IF EXISTS "users_read_own_mapping" ON tenant_users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tenant_users;
DROP POLICY IF EXISTS "Users can view their own tenant data" ON tenant_users;

-- 5. Create policy for tenant_users so that the subquery lookup works for the user themselves
CREATE POLICY "users_read_own_mapping" ON tenant_users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 6. Create Strict Tenant Isolation Policies for Accessory Tables
-- We use a SECURITY DEFINER function for the subquery to ensure it always succeeds for the auth.uid() 
-- even if RLS on tenant_users is complex.

CREATE OR REPLACE FUNCTION get_auth_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM tenant_users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "tenant_business_info_isolation" ON tenant_business_info
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());

CREATE POLICY "tenant_company_details_isolation" ON tenant_company_details
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());

CREATE POLICY "tenant_tax_details_isolation" ON tenant_tax_details
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());

CREATE POLICY "tenant_banking_details_isolation" ON tenant_banking_details
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());

CREATE POLICY "tenant_system_config_isolation" ON tenant_system_config
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());

CREATE POLICY "tenant_integrations_isolation" ON tenant_integrations
FOR ALL TO authenticated
USING (tenant_id = get_auth_user_tenant_id())
WITH CHECK (tenant_id = get_auth_user_tenant_id());


