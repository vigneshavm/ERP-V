-- Migration: Populate system_modules table
-- Description: Inserts core, sales, finance, hr, and analytics modules into the system.
-- Idempotency: Uses ON CONFLICT (code) to update existing entries.

INSERT INTO system_modules (code, name, category, description, dependencies, price_monthly)
VALUES
    -- 1. Core Operations
    ('INVENTORY', 'Inventory Management', 'Operations', 'Product tracking, warehousing, stock adjustments, and batch management.', '[]', 20.00),

    -- 2. Sales Channels
    ('POS', 'Point of Sale', 'Sales', 'Frontend billing interface with barcode scanning and receipt printing.', '["INVENTORY", "FINANCE"]', 30.00),
    ('ECOMMERCE', 'Web Storefront', 'Sales', 'Public-facing online store synchronized with inventory.', '["INVENTORY", "FINANCE"]', 50.00),

    -- 3. Finance & Accounting
    ('FINANCE', 'Finance & Accounting', 'Finance', 'General ledger, tax management, P&L, and expense tracking.', '[]', 40.00),
    ('DAILY_TRACKER', 'Daily Tracker', 'Finance', 'Cash register closure, day-end reconciliation, and petty cash tracking.', '["FINANCE"]', 10.00),

    -- 4. Procurement & Intelligence
    ('PURCHASE_AI', 'Purchase & AI', 'Procurement', 'Vendor management, purchase orders, and AI-driven stock forecasting.', '["INVENTORY", "FINANCE"]', 35.00),

    -- 5. Human Resources
    ('HRM', 'Staff & Payroll', 'HR', 'Employee shifts, attendance tracking, and payroll processing.', '["FINANCE"]', 25.00),

    -- 6. Reporting
    ('SALES_HISTORY', 'Sales History', 'Analytics', 'Detailed transaction logs, customer purchase history, and trend analysis.', '["POS", "ECOMMERCE"]', 15.00)
ON CONFLICT (code) 
DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    dependencies = EXCLUDED.dependencies,
    price_monthly = EXCLUDED.price_monthly;
