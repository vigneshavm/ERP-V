-- ERP Supabase Schema
-- Run this in the Supabase SQL Editor to sync your tables.

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS labor_payments;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS cheques;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS tenants;

-- 1. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    modules JSONB DEFAULT '[]', -- Using JSONB for arrays/objects
    is_active BOOLEAN DEFAULT true,
    region JSONB DEFAULT '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}',
    sector TEXT,
    theme TEXT DEFAULT 'light',
    layout TEXT DEFAULT 'standard',
    domain TEXT,
    primary_color TEXT DEFAULT '#f97316',
    locations JSONB DEFAULT '[]', -- Complex nested locations/branches
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Branches Table (Optional but good for normalization, though frontend uses locations JSONB above)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT, -- Keep as TEXT if it refers to legacy IDs or UUID
    sku TEXT,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(12,2) DEFAULT 0,
    cost DECIMAL(12,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sector TEXT,
    barcode TEXT,
    product_type TEXT,
    last_restocked TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    composition TEXT,
    unit TEXT,
    brand TEXT,
    hsn_code TEXT,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT,
    name TEXT NOT NULL,
    role TEXT,
    daily_rate DECIMAL(12,2) DEFAULT 0,
    sector TEXT,
    system_role TEXT, -- 'Admin', 'Manager', 'Staff'
    pin TEXT, -- For POS login
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Transactions Table (Income/Expense)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT,
    type TEXT NOT NULL, -- 'INCOME', 'EXPENSE'
    category TEXT,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    sector TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Cheques Table
CREATE TABLE cheques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    bank_name TEXT,
    payee TEXT,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'CLEARED', 'BOUNCED'
    type TEXT, -- 'RECEIVED', 'ISSUED'
    sector TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Sales Table (History)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    date TIMESTAMPTZ DEFAULT now(),
    total DECIMAL(12,2) DEFAULT 0,
    sector TEXT,
    payment_method TEXT,
    tax_mode TEXT, -- 'INCLUSIVE', 'EXCLUSIVE'
    status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'PREORDER', 'FULFILLED', 'CANCELLED'
    payment_status TEXT DEFAULT 'PAID', -- 'PAID', 'PENDING', 'PARTIAL'
    items JSONB DEFAULT '[]', -- Items snapshots
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Purchase Orders Table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id TEXT,
    vendor TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    sector TEXT,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Labor Payments Table
CREATE TABLE labor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    type TEXT, -- 'SALARY', 'ADVANCE'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_payments ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allowing all for authenticated users for now)
-- In a real production app, you would filter by tenant_id or user role.
CREATE POLICY "Enable all for authenticated users" ON tenants FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON branches FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON cheques FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON purchase_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON labor_payments FOR ALL TO authenticated USING (true);
