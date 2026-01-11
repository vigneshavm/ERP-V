-- Sales Return & Credit Note Schema

-- 1. Sales Returns Table
CREATE TABLE sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    invoice_id UUID REFERENCES invoices(id), -- Nullable if return is not linked to invoice (optional, but usually linked)
    customer_id UUID REFERENCES customers(id),
    return_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    total_refund_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'approved', 'completed', 'cancelled'
    refund_method TEXT NOT NULL, -- 'cash', 'card', 'wallet', 'exchange', 'upi', 'bank_transfer'
    refund_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed'
    return_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Sales Return Items Table
CREATE TABLE sales_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID, -- If you have variants
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    tax_amount NUMERIC DEFAULT 0,
    line_total NUMERIC NOT NULL,
    condition TEXT NOT NULL DEFAULT 'resellable', -- 'resellable', 'damaged', 'expired', 'defective'
    reason TEXT,
    restock_fee NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Credit Notes Table
CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    credit_note_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    sales_return_id UUID REFERENCES sales_returns(id), -- Link to source return
    amount NUMERIC NOT NULL,
    balance_amount NUMERIC NOT NULL, -- Track if used partially
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expiry_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'redeemed', 'expired', 'void'
    notes TEXT,
    created_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Add Wallet Balance to Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;

-- 5. Indexes for Performance
CREATE INDEX idx_sales_returns_tenant ON sales_returns(tenant_id);
CREATE INDEX idx_sales_returns_invoice ON sales_returns(invoice_id);
CREATE INDEX idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX idx_sales_return_items_return ON sales_return_items(sales_return_id);
CREATE INDEX idx_credit_notes_tenant ON credit_notes(tenant_id);
CREATE INDEX idx_credit_notes_customer ON credit_notes(customer_id);

-- 6. Helper Function (Optional but recommended): Update Wallet Balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- If credit note is issued to wallet or wallet refund
    -- Implementation depends on how you handle the transaction logic in app code vs DB triggers.
    -- For now, we will leave this logic to the application layer to keep control explicit.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
