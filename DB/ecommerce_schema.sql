-- E-commerce Module Schema
-- Table to store tenant-specific e-commerce configurations and subscription state

CREATE TABLE IF NOT EXISTS tenant_ecommerce (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    plan TEXT DEFAULT 'STARTER' CHECK (plan IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
    trial_ends_at TIMESTAMPTZ,
    domain TEXT,
    theme TEXT DEFAULT 'MODERN',
    payment_gateway_enabled BOOLEAN DEFAULT FALSE,
    customer_portal_enabled BOOLEAN DEFAULT FALSE,
    order_management_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Enable Row Level Security
ALTER TABLE tenant_ecommerce ENABLE ROW LEVEL SECURITY;

-- Policy for tenant isolation
CREATE POLICY "Tenants can only view their own ecommerce config"
    ON tenant_ecommerce FOR SELECT
    USING (tenant_id::text = auth.uid()::text OR auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Tenants can only update their own ecommerce config"
    ON tenant_ecommerce FOR UPDATE
    USING (tenant_id::text = auth.uid()::text OR auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ecommerce_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_ecommerce_timestamp
    BEFORE UPDATE ON tenant_ecommerce
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_timestamp();
