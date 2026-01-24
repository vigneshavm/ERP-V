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
    is_active BOOLEAN DEFAULT true,
    region JSONB DEFAULT '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}',
    sector TEXT,
    layout TEXT DEFAULT 'standard',
    domain TEXT,
    locations JSONB DEFAULT '[]', -- Complex nested locations/branches
    business_type TEXT,
    nature_of_business TEXT,
    trade_description TEXT,
    company_details JSONB DEFAULT '{}',
    tax_details JSONB DEFAULT '{}',
    banking_details JSONB DEFAULT '{}',
    system_config JSONB DEFAULT '{}',
    integrations JSONB DEFAULT '{}',
    loyalty_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Branches Table (Optional but good for normalization, though frontend uses locations JSONB above)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id, phone)
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
    phone_number TEXT,
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
    loyalty_points_earned INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    redemption_amount DECIMAL(12,2) DEFAULT 0,
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

-- Trigger function to auto-update updated_at timestamp on row modifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to keep updated_at in sync for tenants and branches
DROP TRIGGER IF EXISTS tenants_updated_at_trigger ON tenants;
CREATE TRIGGER tenants_updated_at_trigger
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS branches_updated_at_trigger ON branches;
CREATE TRIGGER branches_updated_at_trigger
BEFORE UPDATE ON branches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
- -   M i g r a t i o n :   C r e a t e   M o d u l a r   S y s t e m   T a b l e s 
 
 
 
 C R E A T E   T A B L E   s y s t e m _ m o d u l e s   ( 
 
         i d   U U I D   N O T   N U L L   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) , 
 
         c o d e   T E X T   N O T   N U L L   U N I Q U E ,               - -   C o n s t a n t   r e f e r e n c e   ( e . g . ,   ' P O S ' ,   ' H R M ' ) 
 
         n a m e   T E X T   N O T   N U L L ,                             - -   D i s p l a y   n a m e   ( e . g . ,   ' P o i n t   o f   S a l e ' ) 
 
         d e s c r i p t i o n   T E X T , 
 
         c a t e g o r y   T E X T ,                                       - -   e . g . ,   ' C o r e ' ,   ' F i n a n c e ' ,   ' O p e r a t i o n s ' 
 
         d e p e n d e n c i e s   J S O N B   D E F A U L T   ' [ ] ' ,   - -   L i s t   o f   m o d u l e   c o d e s   t h i s   m o d u l e   n e e d s   ( e . g . ,   [ " I N V E N T O R Y " ] ) 
 
         i s _ b e t a   B O O L E A N   D E F A U L T   f a l s e , 
 
         p r i c e _ m o n t h l y   N U M E R I C   D E F A U L T   0 ,   - -   F o r   b i l l i n g   c a l c u l a t i o n 
 
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) 
 
 ) ; 
 
 
 
 C R E A T E   T A B L E   t e n a n t _ a c t i v e _ m o d u l e s   ( 
 
         i d   U U I D   N O T   N U L L   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) , 
 
         t e n a n t _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   t e n a n t s ( i d )   O N   D E L E T E   C A S C A D E , 
 
         m o d u l e _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   s y s t e m _ m o d u l e s ( i d )   O N   D E L E T E   C A S C A D E , 
 
         
 
         s t a t u s   T E X T   D E F A U L T   ' A C T I V E ' ,                     - -   ' A C T I V E ' ,   ' S U S P E N D E D ' ,   ' T R I A L ' 
 
         v a l i d _ u n t i l   T I M E S T A M P   W I T H   T I M E   Z O N E ,     - -   S u b s c r i p t i o n   e x p i r y   d a t e 
 
         
 
         - -   T e n a n t - s p e c i f i c   c o n f i g u r a t i o n   f o r   t h i s   m o d u l e 
 
         c o n f i g   J S O N B   D E F A U L T   ' { } ' ,                         
 
         
 
         a c t i v a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) , 
 
         U N I Q U E ( t e n a n t _ i d ,   m o d u l e _ i d )                       - -   A   t e n a n t   c a n ' t   h a v e   t h e   s a m e   m o d u l e   t w i c e 
 
 ) ; 
 
 
 
 - -   S e e d   S y s t e m   M o d u l e s 
 
 I N S E R T   I N T O   s y s t e m _ m o d u l e s   ( c o d e ,   n a m e ,   c a t e g o r y ,   d e s c r i p t i o n ,   d e p e n d e n c i e s ,   p r i c e _ m o n t h l y )   V A L U E S 
 
 - -   C o r e   M o d u l e s 
 
 ( ' I N V E N T O R Y ' ,   ' I n v e n t o r y   M a n a g e m e n t ' ,   ' C o r e ' ,   ' T r a c k   s t o c k ,   w a r e h o u s e s ,   a n d   b a t c h e s ' ,   ' [ ] ' ,   2 0 . 0 0 ) , 
 
 ( ' C R M ' ,   ' C u s t o m e r   R e l a t i o n s h i p ' ,   ' C o r e ' ,   ' M a n a g e   c u s t o m e r s   a n d   l e a d s ' ,   ' [ ] ' ,   1 5 . 0 0 ) , 
 
 
 
 - -   S a l e s   M o d u l e s 
 
 ( ' P O S ' ,   ' P o i n t   o f   S a l e ' ,   ' S a l e s ' ,   ' F r o n t e n d   b i l l i n g   i n t e r f a c e ' ,   ' [ " I N V E N T O R Y " ,   " C R M " ] ' ,   3 0 . 0 0 ) , 
 
 ( ' E C O M M E R C E ' ,   ' O n l i n e   S t o r e ' ,   ' S a l e s ' ,   ' P u b l i c   f a c i n g   w e b s i t e   i n t e g r a t i o n ' ,   ' [ " I N V E N T O R Y " ] ' ,   5 0 . 0 0 ) , 
 
 
 
 - -   B a c k   O f f i c e 
 
 ( ' H R M ' ,   ' H u m a n   R e s o u r c e s ' ,   ' O p e r a t i o n s ' ,   ' E m p l o y e e   s h i f t s ,   p a y r o l l ,   a n d   a t t e n d a n c e ' ,   ' [ ] ' ,   2 5 . 0 0 ) , 
 
 ( ' A C C O U N T S ' ,   ' A c c o u n t i n g   &   F i n a n c e ' ,   ' F i n a n c e ' ,   ' G e n e r a l   L e d g e r ,   P & L ,   T a x   r e p o r t s ' ,   ' [ ] ' ,   4 0 . 0 0 ) ; 
 
 

-- Migration: Create Modular System Tables

CREATE TABLE system_modules (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,       -- Constant reference (e.g., 'POS', 'HRM')
    name TEXT NOT NULL,              -- Display name (e.g., 'Point of Sale')
    description TEXT,
    category TEXT,                   -- e.g., 'Core', 'Finance', 'Operations'
    dependencies JSONB DEFAULT '[]', -- List of module codes this module needs (e.g., ["INVENTORY"])
    is_beta BOOLEAN DEFAULT false,
    price_monthly NUMERIC DEFAULT 0, -- For billing calculation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_active_modules (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'ACTIVE',          -- 'ACTIVE', 'SUSPENDED', 'TRIAL'
    valid_until TIMESTAMP WITH TIME ZONE,  -- Subscription expiry date
    
    -- Tenant-specific configuration for this module
    config JSONB DEFAULT '{}',            
    
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, module_id)           -- A tenant can't have the same module twice
);

-- Seed System Modules
INSERT INTO system_modules (code, name, category, description, dependencies, price_monthly) VALUES
-- Core Modules
('INVENTORY', 'Inventory Management', 'Core', 'Track stock, warehouses, and batches', '[]', 20.00),
('CRM', 'Customer Relationship', 'Core', 'Manage customers and leads', '[]', 15.00),

-- Sales Modules
('POS', 'Point of Sale', 'Sales', 'Frontend billing interface', '["INVENTORY", "CRM"]', 30.00),
('ECOMMERCE', 'Online Store', 'Sales', 'Public facing website integration', '["INVENTORY"]', 50.00),

-- Operations & Finance
('HR', 'Human Resources', 'Operations', 'Employee shifts, payroll, and attendance', '[]', 25.00),
('FINANCE', 'Accounting & Finance', 'Finance', 'General Ledger, P&L, Tax reports', '[]', 40.00),
('ANALYTICS', 'Analytics & Reports', 'Operations', 'Advanced data visualization', '[]', 10.00);

