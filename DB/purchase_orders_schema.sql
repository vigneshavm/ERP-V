-- Purchase Orders Schema

-- 1. Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid,
  po_number text NOT NULL, -- Format: PO-YYYY-NNNN
  po_date date NOT NULL,
  expected_delivery date,
  supplier_id uuid NOT NULL, -- references vendors(id)
  status text NOT NULL DEFAULT 'Draft', -- Draft, Pending, Approved, Converted, Cancelled
  notes text,
  
  -- Financials
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,

  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT purchase_orders_tenant_uniq UNIQUE (tenant_id, po_number),
  CONSTRAINT purchase_orders_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  -- CONSTRAINT purchase_orders_supplier_fkey FOREIGN KEY (supplier_id) REFERENCES vendors(id) -- Assuming vendors table exists
);

-- 2. Create Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL, -- references products(id)
  quantity numeric NOT NULL CHECK (quantity > 0),
  rate numeric NOT NULL DEFAULT 0,
  tax_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  line_total numeric NOT NULL,

  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Purchase Orders
CREATE POLICY "Users can view POs of their tenant" ON purchase_orders
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert POs for their tenant" ON purchase_orders
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update POs of their tenant" ON purchase_orders
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete Draft POs" ON purchase_orders
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()) 
    AND status = 'Draft'
  );

-- Purchase Order Items
CREATE POLICY "Users can view PO items of their tenant" ON purchase_order_items
  FOR SELECT USING (
    po_id IN (SELECT id FROM purchase_orders WHERE tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can manage PO items of their tenant" ON purchase_order_items
  FOR ALL USING (
    po_id IN (SELECT id FROM purchase_orders WHERE tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
  );

-- 5. RPC to Convert PO to Purchase (Optional, or handled by frontend passing data to Purchase Entry RPC)
-- We will handle conversion by pre-filling the Purchase Entry form in the frontend to allow final adjustments before save.
-- However, we need a way to mark PO as 'Converted' securely.

CREATE OR REPLACE FUNCTION mark_po_converted(po_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE purchase_orders
  SET status = 'Converted', updated_at = now()
  WHERE id = po_id AND status = 'Approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
