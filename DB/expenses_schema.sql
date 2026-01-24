-- Expenses Extension Schema

-- 1. Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid, -- Optional, if branch specific
  expense_number text NOT NULL, -- Format: EXP-YYYY-NNNN
  date date NOT NULL,
  category text NOT NULL, -- 'Travel', 'Rent', 'Electricity', etc.
  description text,
  payment_method text NOT NULL, -- 'Cash', 'Bank', 'UPI', 'Card'
  amount numeric NOT NULL CHECK (amount > 0),
  tax_percent numeric DEFAULT 0,
  vendor_id uuid, -- Link to vendors table if needed
  reference text, -- Bill no, transaction ID
  created_by uuid, -- User ID
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced boolean DEFAULT false, -- For offline usage/sync status
  
  -- Constraints
  CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT expenses_uniq_number_tenant UNIQUE (tenant_id, expense_number)
);

-- 2. Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- View: Users can view expenses of their tenant
CREATE POLICY "Users can view expenses of their tenant" ON expenses
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Insert: Users can insert expenses for their tenant
CREATE POLICY "Users can insert expenses for their tenant" ON expenses
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Update: Users can update pending/today's expenses (Business logic usually restricts this in app, but policy can be broad)
CREATE POLICY "Users can update expenses of their tenant" ON expenses
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Delete: Only owners/admins usually (handled via app logic or role check, keeping broad tenant check for now)
CREATE POLICY "Users can delete expenses of their tenant" ON expenses
  FOR DELETE USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));


-- 4. Sync Function to Daily Finance
-- Need to ensure daily_finance table exists and has 'total_expenses' and 'expenses' (jsonb) or similar.
-- Assuming daily_finance structure:
-- date, tenant_id, total_sales, total_expenses, cash_in_hands, etc.

CREATE OR REPLACE FUNCTION sync_expense_to_daily_finance()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Upsert Daily Record
  INSERT INTO daily_finance (tenant_id, date, total_expenses, updated_at)
  VALUES (
    NEW.tenant_id, 
    NEW.date, 
    NEW.amount,
    now()
  )
  ON CONFLICT (tenant_id, date) DO UPDATE 
  SET 
    total_expenses = daily_finance.total_expenses + (NEW.amount - COALESCE(OLD.amount, 0)),
    updated_at = now();

  -- 2. If Payment Method is CASH, Update Cash In Hand?
  -- Optional: If daily_finance tracks cash_in_hand
  IF NEW.payment_method = 'Cash' THEN
     UPDATE daily_finance 
     SET cash_in_hand = COALESCE(cash_in_hand, 0) - (NEW.amount - COALESCE(OLD.amount, 0))
     WHERE tenant_id = NEW.tenant_id AND date = NEW.date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger
DROP TRIGGER IF EXISTS on_expense_change ON expenses;
CREATE TRIGGER on_expense_change
AFTER INSERT OR UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION sync_expense_to_daily_finance();

-- 6. Trigger for Delete
CREATE OR REPLACE FUNCTION sync_expense_delete_to_daily_finance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_finance 
  SET 
    total_expenses = GREATEST(0, total_expenses - OLD.amount),
    updated_at = now()
  WHERE tenant_id = OLD.tenant_id AND date = OLD.date;
  
  IF OLD.payment_method = 'Cash' THEN
     UPDATE daily_finance 
     SET cash_in_hand = COALESCE(cash_in_hand, 0) + OLD.amount
     WHERE tenant_id = OLD.tenant_id AND date = OLD.date;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_expense_delete ON expenses;
CREATE TRIGGER on_expense_delete
AFTER DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION sync_expense_delete_to_daily_finance();
