-- Vendor Management Schema

-- 1. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    gstin TEXT,
    address TEXT,
    contact_person TEXT,
    opening_balance DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Vendor Transactions (Ledger)
CREATE TABLE IF NOT EXISTS vendor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'PURCHASE', 'PAYMENT', 'RETURN', 'ADJUSTMENT'
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    reference_id TEXT, -- Can be Purchase Order ID or Payment ID
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add vendor_id to purchase_orders
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='vendor_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable all for authenticated users" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON vendor_transactions FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS vendors_updated_at_trigger ON vendors;
CREATE TRIGGER vendors_updated_at_trigger
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
