-- Full Database Schema Structure (Extracted via PostgREST OpenAPI)

CREATE TABLE brands (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    code TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE tenant_system_config (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    is_pos_enabled BOOLEAN,
    is_inventory_enabled BOOLEAN,
    is_loyalty_enabled BOOLEAN,
    is_multibranch_enabled BOOLEAN,
    is_ecommerce_enabled BOOLEAN,
    pricing_mode TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE walkthrough_documents (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    title TEXT NOT NULL,
    content TEXT,
    module TEXT,
    type TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    tenant_id TEXT NOT NULL
);

CREATE TABLE vendors (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    name TEXT NOT NULL,
    mobile TEXT,
    address_id UUID -- Note:
This is a Foreign Key to `addresses.id`.<fk table='addresses' column='id'/>
);

CREATE TABLE product_taxes (
    product_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `products.id`.<fk table='products' column='id'/>,
    tax_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `taxes.id`.<fk table='taxes' column='id'/>
);

CREATE TABLE customers (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    address_id UUID -- Note:
This is a Foreign Key to `addresses.id`.<fk table='addresses' column='id'/>,
    loyalty_points NUMERIC
);

CREATE TABLE companies (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    trade_name TEXT NOT NULL
);

CREATE TABLE tenant_banking_details (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    bank_name TEXT,
    account_number TEXT,
    account_holder_name TEXT,
    ifsc TEXT,
    books_start_date DATE,
    financial_year_closing TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE branch_products (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    branch_id UUID NOT NULL -- Note:
This is a Foreign Key to `branches.id`.<fk table='branches' column='id'/>,
    product_id UUID NOT NULL -- Note:
This is a Foreign Key to `products.id`.<fk table='products' column='id'/>,
    selling_price NUMERIC,
    stock_qty NUMERIC
);

CREATE TABLE implementation_plans (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    plan_content JSONB NOT NULL,
    status TEXT
);

CREATE TABLE transactions (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    branch_id TEXT,
    type TEXT NOT NULL,
    category TEXT,
    amount NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE invoice_items (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    invoice_id UUID NOT NULL -- Note:
This is a Foreign Key to `invoices.id`.<fk table='invoices' column='id'/>,
    product_id UUID NOT NULL -- Note:
This is a Foreign Key to `products.id`.<fk table='products' column='id'/>,
    unit_id UUID NOT NULL -- Note:
This is a Foreign Key to `units.id`.<fk table='units' column='id'/>,
    tax_id UUID -- Note:
This is a Foreign Key to `taxes.id`.<fk table='taxes' column='id'/>,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    tax_amount NUMERIC,
    line_total NUMERIC
);

CREATE TABLE tenant_integrations (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    payment_gateway_key TEXT,
    sms_provider_key TEXT,
    email_provider_key TEXT,
    webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE countries (
    code CHARACTER NOT NULL -- Note:
This is a Primary Key.<pk/>,
    name TEXT NOT NULL
);

CREATE TABLE labor_payments (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    employee_id UUID,
    amount NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    type TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE currencies (
    code CHARACTER NOT NULL -- Note:
This is a Primary Key.<pk/>,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL
);

CREATE TABLE tenant_tax_details (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    tax_system TEXT,
    gstin TEXT,
    pan TEXT,
    is_gst_enabled BOOLEAN,
    is_einvoice_enabled BOOLEAN,
    is_eway_bill_enabled BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE branches (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    company_id UUID -- Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/>,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    address_id UUID -- Note:
This is a Foreign Key to `addresses.id`.<fk table='addresses' column='id'/>
);

CREATE TABLE products (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    sku TEXT,
    name TEXT NOT NULL,
    category_id UUID -- Note:
This is a Foreign Key to `product_categories.id`.<fk table='product_categories' column='id'/>,
    brand_id UUID -- Note:
This is a Foreign Key to `brands.id`.<fk table='brands' column='id'/>,
    unit_id UUID NOT NULL -- Note:
This is a Foreign Key to `units.id`.<fk table='units' column='id'/>,
    is_active BOOLEAN
);

CREATE TABLE states (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    country_code CHARACTER -- Note:
This is a Foreign Key to `countries.code`.<fk table='countries' column='code'/>,
    name TEXT NOT NULL
);

CREATE TABLE taxes (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    rate NUMERIC NOT NULL
);

CREATE TABLE tenant_users (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    role_id UUID -- Note:
This is a Foreign Key to `roles.id`.<fk table='roles' column='id'/>,
    full_name TEXT NOT NULL,
    mobile CHARACTER VARYING NOT NULL,
    email TEXT,
    password_hash TEXT,
    pin_hash TEXT,
    assigned_branch_id UUID -- Note:
This is a Foreign Key to `branches.id`.<fk table='branches' column='id'/>,
    daily_rate NUMERIC,
    system_role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE cheques (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    number TEXT NOT NULL,
    bank_name TEXT,
    payee TEXT,
    amount NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    type TEXT,
    sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE units (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    code TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE timezones (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    name TEXT NOT NULL,
    utc_offset TEXT NOT NULL
);

CREATE TABLE purchases (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    branch_id UUID -- Note:
This is a Foreign Key to `branches.id`.<fk table='branches' column='id'/>,
    vendor_id UUID -- Note:
This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/>,
    purchase_date TIMESTAMP WITH TIME ZONE,
    total_amount NUMERIC
);

CREATE TABLE sales (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    branch_id TEXT,
    customer_id UUID,
    date TIMESTAMP WITH TIME ZONE,
    total NUMERIC,
    sector TEXT,
    payment_method TEXT,
    tax_mode TEXT,
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE invoices (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    branch_id UUID NOT NULL -- Note:
This is a Foreign Key to `branches.id`.<fk table='branches' column='id'/>,
    customer_id UUID -- Note:
This is a Foreign Key to `customers.id`.<fk table='customers' column='id'/>,
    invoice_date TIMESTAMP WITH TIME ZONE,
    total_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE purchase_items (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    purchase_id UUID NOT NULL -- Note:
This is a Foreign Key to `purchases.id`.<fk table='purchases' column='id'/>,
    product_id UUID NOT NULL -- Note:
This is a Foreign Key to `products.id`.<fk table='products' column='id'/>,
    unit_id UUID NOT NULL -- Note:
This is a Foreign Key to `units.id`.<fk table='units' column='id'/>,
    quantity NUMERIC,
    unit_cost NUMERIC,
    line_total NUMERIC
);

CREATE TABLE daily_finance (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    cash_sales NUMERIC,
    online_sales NUMERIC,
    total_sales NUMERIC,
    expenses NUMERIC,
    cash_in_drawer NUMERIC,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE cities (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    state_id UUID -- Note:
This is a Foreign Key to `states.id`.<fk table='states' column='id'/>,
    name TEXT NOT NULL
);

CREATE TABLE vendor_transactions (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    vendor_id UUID,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE tenant_user_visual_identity (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    user_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenant_users.id`.<fk table='tenant_users' column='id'/>,
    theme TEXT,
    primary_color TEXT,
    dashboard_logo_url TEXT,
    visual_identity_config JSONB,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE tenant_business_info (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    business_type TEXT,
    nature_of_business TEXT,
    trade_description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE cloth_product_master (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL,
    bill_code INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_name_regional_language TEXT,
    gst_percent NUMERIC NOT NULL,
    gst_name TEXT,
    hsn_code TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE tenants (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    domain TEXT,
    country_code CHARACTER NOT NULL -- Note:
This is a Foreign Key to `countries.code`.<fk table='countries' column='code'/>,
    currency_code CHARACTER NOT NULL -- Note:
This is a Foreign Key to `currencies.code`.<fk table='currencies' column='code'/>,
    timezone_id UUID NOT NULL -- Note:
This is a Foreign Key to `timezones.id`.<fk table='timezones' column='id'/>,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE addresses (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    line1 TEXT NOT NULL,
    city_id UUID -- Note:
This is a Foreign Key to `cities.id`.<fk table='cities' column='id'/>,
    postal_code TEXT
);

CREATE TABLE roles (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    code TEXT NOT NULL,
    description TEXT
);

CREATE TABLE tenant_company_details (
    tenant_id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
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
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE product_categories (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID NOT NULL -- Note:
This is a Foreign Key to `tenants.id`.<fk table='tenants' column='id'/>,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id UUID -- Note:
This is a Foreign Key to `product_categories.id`.<fk table='product_categories' column='id'/>
);

CREATE TABLE purchase_orders (
    id UUID NOT NULL -- Note:
This is a Primary Key.<pk/>,
    tenant_id UUID,
    branch_id TEXT,
    vendor TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    total NUMERIC,
    status TEXT,
    sector TEXT,
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    vendor_id UUID
);

