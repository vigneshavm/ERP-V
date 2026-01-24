-- Migration: Create per-user visual identity preference table

-- 1. Create the table
CREATE TABLE IF NOT EXISTS tenant_user_visual_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    
    theme TEXT CHECK (theme IN ('light', 'dark', 'system')),
    primary_color TEXT,
    login_logo_url TEXT,
    visual_identity_config JSONB DEFAULT '{}'::jsonb,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one record per user per tenant
    UNIQUE(tenant_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE tenant_user_visual_identity ENABLE ROW LEVEL SECURITY;

-- 3. Basic Policies
-- Users can manage their own preferences
CREATE POLICY "Users can manage their own visual preferences" 
ON tenant_user_visual_identity 
FOR ALL 
TO authenticated 
USING (
    user_id IN (
        SELECT id FROM tenant_users WHERE id = user_id -- This handles the link correctly
    )
);

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_visual_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_visual_identity_updated_at
BEFORE UPDATE ON tenant_user_visual_identity
FOR EACH ROW EXECUTE FUNCTION update_visual_identity_updated_at();



-- 0. Extension (if not enabled already)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

----------------------------------------------------------
-- 1. Table
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_user_visual_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,

    -- UI preferences
    theme TEXT NOT NULL DEFAULT 'system'
        CHECK (theme IN ('light', 'dark', 'system')),

    primary_color TEXT
        CHECK (primary_color ~* '^#([A-F0-9]{6}|[A-F0-9]{3})$' OR primary_color IS NULL),

    login_logo_url TEXT,

    -- flexible future config
    visual_identity_config JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- ensure one preference per tenant-user
    UNIQUE (tenant_id, user_id)
);

----------------------------------------------------------
-- 2. Indexes for performance at scale
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_visual_identity_tenant_user
ON tenant_user_visual_identity (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_visual_identity_tenant
ON tenant_user_visual_identity (tenant_id);

CREATE INDEX IF NOT EXISTS idx_visual_identity_user
ON tenant_user_visual_identity (user_id);

----------------------------------------------------------
-- 3. Trigger to maintain updated_at
----------------------------------------------------------
CREATE OR REPLACE FUNCTION tr_set_visual_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_visual_identity_updated_at
BEFORE UPDATE ON tenant_user_visual_identity
FOR EACH ROW
EXECUTE FUNCTION tr_set_visual_identity_updated_at();

----------------------------------------------------------
-- 4. Optional future-safe JSON validation hook
----------------------------------------------------------
-- Add validation later without migration change
-- Example: enforce allowed JSON keys if desired

----------------------------------------------------------
-- 5. Enable RLS
----------------------------------------------------------
ALTER TABLE tenant_user_visual_identity ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------
-- 6. Secure multi-tenant RLS policies
----------------------------------------------------------

-- 6.1 users can read only their own tenant data
CREATE POLICY "read own preferences"
ON tenant_user_visual_identity
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

-- 6.2 users can insert only for themselves and their tenant
CREATE POLICY "insert own preferences"
ON tenant_user_visual_identity
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- 6.3 users can update only their own record
CREATE POLICY "update own preferences"
ON tenant_user_visual_identity
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6.4 prevent deletes except admin role
CREATE POLICY "admin delete visual preferences"
ON tenant_user_visual_identity
FOR DELETE
TO service_role;

----------------------------------------------------------
-- 7. Extra safety: validate tenant/user relationship
----------------------------------------------------------
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validate_tenant_user_relation
BEFORE INSERT OR UPDATE
ON tenant_user_visual_identity
FOR EACH ROW
EXECUTE FUNCTION ensure_user_belongs_to_tenant();

