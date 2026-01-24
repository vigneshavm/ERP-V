-- Purchase Entry Schema Enhancements

-- 1. Enhance Purchases Table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS invoice_no TEXT, -- Supplier Invoice Number
ADD COLUMN IF NOT EXISTS purchase_number TEXT, -- Internal PO Number
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS round_off NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'COMPLETED', 'CANCELLED'
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PARTIAL', 'PAID'
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES tenant_users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Enhance Purchase Items Table
ALTER TABLE purchase_items 
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS batch_no TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_total NUMERIC DEFAULT 0;

-- 3. Create or Update RPC for Process Purchase
-- This function handles the Transactional Save:
-- 1. Insert/Update Purchase Header
-- 2. Insert/Update Purchase Items
-- 3. Update Inventory (Stock Qty & Cost Price if needed) IF status is COMPLETED
-- 4. Update Vendor Ledger (Optional, if using vendor_transactions)

CREATE OR REPLACE FUNCTION process_purchase_entry(
    p_purchase_id UUID,
    p_tenant_id UUID,
    p_branch_id UUID,
    p_vendor_id UUID,
    p_details JSONB, -- {invoice_no, date, totals...}
    p_items JSONB,   -- [{product_id, qty, cost, tax...}]
    p_status TEXT    -- 'DRAFT' or 'COMPLETED'
)
RETURNS JSONB AS $$
DECLARE
    v_purchase_id UUID;
    v_item JSONB;
    v_old_status TEXT;
    v_purchase_number TEXT;
BEGIN
    -- 1. Get or Generate ID
    v_purchase_id := COALESCE(p_purchase_id, gen_random_uuid());
    
    -- Check old status if updating
    SELECT status INTO v_old_status FROM purchases WHERE id = v_purchase_id;

    -- Generate Internal Purchase Number if new
    IF p_purchase_id IS NULL THEN
        -- Simple auto-increment-like logic or timestamp based
        v_purchase_number := 'PO-' || to_char(now(), 'YYYYMMDD') || '-' || substring(v_purchase_id::text, 1, 4);
    ELSE
         SELECT purchase_number INTO v_purchase_number FROM purchases WHERE id = v_purchase_id;
    END IF;

    -- 2. Upsert Purchase Header
    INSERT INTO purchases (
        id, tenant_id, branch_id, vendor_id, 
        purchase_number, invoice_no, purchase_date,
        subtotal, tax_amount, discount_amount, shipping_amount, round_off, total_amount,
        status, notes, created_at, updated_at
    ) VALUES (
        v_purchase_id, p_tenant_id, p_branch_id, p_vendor_id,
        v_purchase_number, (p_details->>'invoice_no')::text, (p_details->>'date')::timestamp,
        (p_details->>'subtotal')::numeric, (p_details->>'tax_amount')::numeric, (p_details->>'discount_amount')::numeric, 
        (p_details->>'shipping_amount')::numeric, (p_details->>'round_off')::numeric, (p_details->>'total_amount')::numeric,
        p_status, (p_details->>'notes')::text, now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
        invoice_no = EXCLUDED.invoice_no,
        purchase_date = EXCLUDED.purchase_date,
        subtotal = EXCLUDED.subtotal,
        tax_amount = EXCLUDED.tax_amount,
        discount_amount = EXCLUDED.discount_amount,
        shipping_amount = EXCLUDED.shipping_amount,
        round_off = EXCLUDED.round_off,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = now();

    -- 3. Handle Items (Delete existing and re-insert for simplicity in this MVP, or smart merge)
    -- For data integrity, full replacement is safer for edits unless we track line IDs carefully.
    DELETE FROM purchase_items WHERE purchase_id = v_purchase_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO purchase_items (
            purchase_id, product_id, unit_id, quantity, unit_cost, 
            tax_percent, tax_amount, line_total
        ) VALUES (
            v_purchase_id,
            (v_item->>'product_id')::uuid,
            (v_item->>'unit_id')::uuid,
            (v_item->>'quantity')::numeric,
            (v_item->>'rate')::numeric,
            (v_item->>'tax_percent')::numeric,
            (v_item->>'tax_amount')::numeric,
            (v_item->>'amount')::numeric
        );

        -- 4. Inventory Updates
        -- ONLY if new status is COMPLETED
        -- AND (old status was DRAFT or NULL)
        -- If editing an already COMPLETED purchase, we need to Reverse old qty and Add new qty. 
        -- To keep MVP safe: We might block editing COMPLETED purchases or handle reversal logic.
        -- HERE: We only increment if transiting to COMPLETED. 
        -- Reversal logic is complex; assuming for now we are just creating/saving draft to complete.
        
        IF p_status = 'COMPLETED' AND (v_old_status IS NULL OR v_old_status = 'DRAFT') THEN
            -- Update Branch Product Stock
            UPDATE branch_products 
            SET stock_qty = COALESCE(stock_qty, 0) + (v_item->>'quantity')::numeric
            WHERE branch_id = p_branch_id AND product_id = (v_item->>'product_id')::uuid;

            -- If row doesn't exist?
            IF NOT FOUND THEN
                INSERT INTO branch_products (id, tenant_id, branch_id, product_id, stock_qty, selling_price)
                VALUES (gen_random_uuid(), p_tenant_id, p_branch_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::numeric, 0); -- Price 0 initially
            END IF;
        END IF;

    END LOOP;

    -- Return the ID
    RETURN jsonb_build_object('id', v_purchase_id, 'purchase_number', v_purchase_number);
END;
$$ LANGUAGE plpgsql;
