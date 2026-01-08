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
