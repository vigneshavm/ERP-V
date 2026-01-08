-- Refactored SQL Migration: Separate tables for tenant details for scalability

-- 1. Business Info
CREATE TABLE IF NOT EXISTS tenant_business_info (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    business_type TEXT,
    nature_of_business TEXT,
    trade_description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Company Details
CREATE TABLE IF NOT EXISTS tenant_company_details (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    state_code TEXT,
    country TEXT,
    pincode TEXT,
    phone TEXT,
    alternate_phone TEXT,
    email TEXT,
    website TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tax Details
CREATE TABLE IF NOT EXISTS tenant_tax_details (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    tax_system TEXT DEFAULT 'NONE',
    gstin TEXT,
    pan TEXT,
    is_gst_enabled BOOLEAN DEFAULT false,
    is_einvoice_enabled BOOLEAN DEFAULT false,
    is_eway_bill_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Banking Details
CREATE TABLE IF NOT EXISTS tenant_banking_details (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    bank_name TEXT,
    account_number TEXT,
    account_holder_name TEXT,
    ifsc TEXT,
    books_start_date DATE,
    financial_year_closing TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. System Configuration
CREATE TABLE IF NOT EXISTS tenant_system_config (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    is_pos_enabled BOOLEAN DEFAULT true,
    is_inventory_enabled BOOLEAN DEFAULT true,
    is_loyalty_enabled BOOLEAN DEFAULT false,
    is_multibranch_enabled BOOLEAN DEFAULT false,
    is_ecommerce_enabled BOOLEAN DEFAULT false,
    pricing_mode TEXT DEFAULT 'EXCLUSIVE',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Integrations
CREATE TABLE IF NOT EXISTS tenant_integrations (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    payment_gateway_key TEXT,
    sms_provider_key TEXT,
    email_provider_key TEXT,
    webhook_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all new tables
ALTER TABLE tenant_business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_tax_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Enable all for authenticated users)
CREATE POLICY "Enable all for authenticated users" ON tenant_business_info FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON tenant_company_details FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON tenant_tax_details FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON tenant_banking_details FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON tenant_system_config FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON tenant_integrations FOR ALL TO authenticated USING (true);
