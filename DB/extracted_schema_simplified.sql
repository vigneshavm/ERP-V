-- Extracted Database Schema (Inferred via Supabase Client)

-- Table: tenants
CREATE TABLE tenants (
    id TEXT,
    name TEXT,
    subdomain TEXT,
    domain JSONB,
    country_code TEXT,
    currency_code TEXT,
    timezone_id TEXT,
    is_active TEXT,
    created_at TEXT
);

-- Table: branches
CREATE TABLE branches (
    id TEXT,
    tenant_id TEXT,
    company_id JSONB,
    code TEXT,
    name TEXT,
    address_id JSONB
);

-- Table: customers
-- Table customers exists but is empty or schema information is unavailable.

-- Table: products
-- Table products exists but is empty or schema information is unavailable.

-- Table: transactions
CREATE TABLE transactions (
    id TEXT,
    tenant_id TEXT,
    branch_id TEXT,
    type TEXT,
    category TEXT,
    amount TEXT,
    date TEXT,
    description TEXT,
    sector TEXT,
    created_at TEXT
);

-- Table: cheques
CREATE TABLE cheques (
    id TEXT,
    tenant_id TEXT,
    number TEXT,
    bank_name TEXT,
    payee TEXT,
    amount TEXT,
    date JSONB,
    status TEXT,
    type TEXT,
    sector TEXT,
    created_at TEXT
);

-- Table: sales
CREATE TABLE sales (
    id TEXT,
    tenant_id TEXT,
    branch_id TEXT,
    customer_id TEXT,
    date TEXT,
    total TEXT,
    sector TEXT,
    payment_method TEXT,
    tax_mode TEXT,
    items JSONB,
    created_at TEXT
);

-- Table: purchase_orders
CREATE TABLE purchase_orders (
    id TEXT,
    tenant_id TEXT,
    branch_id TEXT,
    vendor TEXT,
    date TEXT,
    total TEXT,
    status TEXT,
    sector TEXT,
    items JSONB,
    created_at TEXT,
    vendor_id JSONB
);

-- Table: labor_payments
CREATE TABLE labor_payments (
    id TEXT,
    tenant_id TEXT,
    employee_id TEXT,
    amount TEXT,
    date TEXT,
    type TEXT,
    note JSONB,
    created_at TEXT
);

-- Table: tenant_users
CREATE TABLE tenant_users (
    id TEXT,
    tenant_id TEXT,
    role_id TEXT,
    full_name TEXT,
    mobile TEXT,
    email TEXT,
    password_hash TEXT,
    pin_hash TEXT,
    assigned_branch_id JSONB,
    daily_rate TEXT,
    system_role TEXT,
    is_active TEXT,
    created_at TEXT
);

-- Table: roles
CREATE TABLE roles (
    id TEXT,
    code TEXT,
    description TEXT
);

-- Table: tenant_business_info
-- Table tenant_business_info exists but is empty or schema information is unavailable.

-- Table: tenant_company_details
-- Table tenant_company_details exists but is empty or schema information is unavailable.

-- Table: tenant_tax_details
-- Table tenant_tax_details exists but is empty or schema information is unavailable.

-- Table: tenant_banking_details
-- Table tenant_banking_details exists but is empty or schema information is unavailable.

-- Table: tenant_system_config
-- Table tenant_system_config exists but is empty or schema information is unavailable.

-- Table: tenant_integrations
-- Table tenant_integrations exists but is empty or schema information is unavailable.

-- Table: tenant_user_visual_identity
-- Table tenant_user_visual_identity exists but is empty or schema information is unavailable.

