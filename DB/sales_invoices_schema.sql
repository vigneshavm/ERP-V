-- Sales Invoices Ledger Schema
-- This table acts as a high-performance flattened view of sales for accounting and reporting.

CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY, -- Maps 1:1 to sales.id
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID, -- Cast from text if needed, or keep as UUID if cleaned up
    
    -- Invoice Details
    invoice_no TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Customer Details (Snapshot)
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    
    -- Financials
    gross_amount NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    round_off NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0, -- Final bill amount
    
    -- Payments
    paid_amount NUMERIC DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    payment_mode TEXT, -- 'CASH', 'UPI', 'MIXED', etc.
    payment_status TEXT DEFAULT 'PAID', -- 'PAID', 'PARTIAL', 'DUE'
    
    -- Meta
    status TEXT DEFAULT 'ISSUED', -- 'DRAFT', 'ISSUED', 'CANCELLED'
    type TEXT DEFAULT 'INVOICE', -- 'INVOICE', 'POS', 'CREDIT_NOTE' (if merged here)
    is_returned BOOLEAN DEFAULT FALSE,
    return_status TEXT DEFAULT 'NONE', -- 'NONE', 'PARTIAL', 'FULL'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID -- User who made the sale
);

-- Indexes for Searching & Filtering
CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant ON sales_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_branch ON sales_invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_search ON sales_invoices USING GIN(to_tsvector('english', invoice_no || ' ' || COALESCE(customer_name, '') || ' ' || COALESCE(customer_phone, '')));


-- Trigger Function to Sync Sales -> Sales Invoices
CREATE OR REPLACE FUNCTION sync_sales_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_gross NUMERIC := 0;
    v_discount NUMERIC := 0;
    v_tax NUMERIC := 0;
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_items JSONB;
    v_branch_uuid UUID;
BEGIN
    -- Attempt to fetch latest customer details if customer_id is present
    IF NEW.customer_id IS NOT NULL THEN
        SELECT name, mobile INTO v_customer_name, v_customer_phone
        FROM customers WHERE id = NEW.customer_id;
    END IF;

    -- Safely cast branch_id
    BEGIN
        v_branch_uuid := NEW.branch_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_branch_uuid := NULL;
    END;

    -- Calculate Totals from Items JSONB (Simplified logic)
    -- Assuming items structure: [{price, qty, tax, discount, ...}]
    -- This is a fallback calculation; usually `total` in sales is net_amount.
    -- We'll assume NEW.total is the Net Amount.
    
    -- Insert or Update
    INSERT INTO sales_invoices (
        id, tenant_id, branch_id,
        invoice_no, date, 
        customer_id, customer_name, customer_phone,
        net_amount, paid_amount, balance_amount,
        payment_mode, status, type,
        gross_amount -- Placeholder calculation or passed
    )
    VALUES (
        NEW.id,
        NEW.tenant_id,
        v_branch_uuid,
        -- Generate invoice no if missing, or use ID segment
        COALESCE(NEW.branch_id || '-' || SUBSTRING(NEW.id::text, 1, 8), 'INV-' || SUBSTRING(NEW.id::text, 1, 8)), 
        NEW.date,
        NEW.customer_id,
        v_customer_name,
        v_customer_phone,
        NEW.total, -- Net Amount
        NEW.total, -- Paid Amount (Assuming POS is immediate payment usually)
        0, -- Balance
        NEW.payment_method,
        'ISSUED', -- Status
        'POS', -- Type
        NEW.total -- Gross approx for now
    )
    ON CONFLICT (id) DO UPDATE SET
        net_amount = EXCLUDED.net_amount,
        paid_amount = EXCLUDED.paid_amount,
        customer_name = EXCLUDED.customer_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger AND Run Backfill
-- DROP TRIGGER IF EXISTS trg_sync_sales_to_ledger ON sales;

-- CREATE TRIGGER trg_sync_sales_to_ledger
-- AFTER INSERT OR UPDATE ON sales
-- FOR EACH ROW EXECUTE FUNCTION sync_sales_to_ledger();

-- Backfill Query (Run manually if needed)
-- UPDATE sales SET id = id; 
