-- RPC for Processing Sales Returns Transactions
CREATE OR REPLACE FUNCTION process_sales_return(
    p_return_data JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_return_id UUID;
    v_item JSONB;
    v_total_refund NUMERIC;
    v_refund_method TEXT;
    v_tenant_id UUID;
    v_branch_id UUID;
    v_customer_id UUID;
    v_new_wallet_balance NUMERIC;
BEGIN
    -- Extract key fields
    v_tenant_id := (p_return_data->>'tenantId')::UUID;
    v_branch_id := (p_return_data->>'branchId')::UUID;
    v_customer_id := (p_return_data->>'customerId')::UUID;
    v_total_refund := (p_return_data->>'totalRefundAmount')::NUMERIC;
    v_refund_method := p_return_data->>'refundMethod';

    -- 1. Insert Sales Return Record
    INSERT INTO sales_returns (
        tenant_id, branch_id, invoice_id, customer_id, 
        return_date, subtotal, tax_amount, total_refund_amount, 
        status, refund_method, refund_status, return_reason, notes, created_by
    ) VALUES (
        v_tenant_id,
        v_branch_id,
        (p_return_data->>'invoiceId')::UUID,
        v_customer_id,
        (p_return_data->>'returnDate')::TIMESTAMP,
        (p_return_data->>'subtotal')::NUMERIC,
        (p_return_data->>'taxAmount')::NUMERIC,
        v_total_refund,
        'completed', -- Assuming immediate completion for now
        v_refund_method,
        'processed', 
        p_return_data->>'returnReason',
        p_return_data->>'notes',
        (p_return_data->>'createdBy')::UUID
    ) RETURNING id INTO v_return_id;

    -- 2. Insert Sales Return Items and Update Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO sales_return_items (
            sales_return_id, product_id, variant_id, 
            quantity, unit_price, line_total, condition, reason
        ) VALUES (
            v_return_id,
            (v_item->>'productId')::UUID,
            CASE WHEN (v_item->>'variantId') IS NULL THEN NULL ELSE (v_item->>'variantId')::UUID END,
            (v_item->>'quantity')::NUMERIC,
            (v_item->>'unitPrice')::NUMERIC,
            (v_item->>'lineTotal')::NUMERIC,
            v_item->>'condition',
            v_item->>'reason'
        );

        -- Update Inventory if Resellable
        IF (v_item->>'condition') = 'resellable' THEN
            UPDATE branch_products
            SET stock_qty = stock_qty + (v_item->>'quantity')::NUMERIC
            WHERE branch_id = v_branch_id AND product_id = (v_item->>'productId')::UUID;
            -- Note: If we had variant tracking in branch_products, filtering would differ. 
            -- Assuming branch_products is product-level for now based on visible schema.
        END IF;
    END LOOP;

    -- 3. Handle Wallet / Customers Balance
    IF v_refund_method = 'wallet' AND v_customer_id IS NOT NULL THEN
        UPDATE customers
        SET wallet_balance = COALESCE(wallet_balance, 0) + v_total_refund
        WHERE id = v_customer_id
        RETURNING wallet_balance INTO v_new_wallet_balance;
    END IF;

    -- 4. Create Credit Note Record (if applicable method or just always for tracking?)
    -- Only if method is 'wallet' (conceptually a credit) or strict 'credit_note' logic.
    -- For now, we only insert into credit_notes table if maybe explicitly requested or if we want a record of it.
    -- Let's just return the ID for now.

    RETURN jsonb_build_object(
        'success', true, 
        'returnId', v_return_id,
        'newWalletBalance', v_new_wallet_balance
    );

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
