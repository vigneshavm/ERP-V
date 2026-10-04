-- backend/sql/erp/003_wave3_wave4_safe_models.sql
-- Wave 3 (Sales) + Wave 4 (Purchase): models with NO existing Textilesoft table and NO live
-- transactional writes to dbo today (unlike Invoice/GRN/PurchaseReturn/PurchaseOrder/Supplier,
-- which already write live stock/numbering into dbo and are deliberately deferred -- see
-- LEGACYTOMODERN_SQL_ONLY_STRATEGY.md section 8). Single-shop: no tenant_id column.
--
-- References to not-yet-migrated entities (Customer, Item, Invoice, BankAccount, User/employee) are
-- plain NVARCHAR(64) ids (Mongo ObjectId hex or a Textilesoft "sql:*" id), not enforced FKs, since
-- those collections aren't SQL tables yet. Line-item arrays are stored as validated JSON (doc section
-- 6.1 point 6: "relational child tables for anything reported on" -- none of these are aggregated
-- in SQL today, so JSON is the pragmatic choice over a dozen extra child tables).

IF OBJECT_ID('erp.transaction') IS NULL
CREATE TABLE erp.[transaction] (
  id BIGINT IDENTITY PRIMARY KEY,
  txn_type NVARCHAR(20) NOT NULL CHECK (txn_type IN ('sale','due','payment','purchase','refund','return','due_adjustment')),
  customer_id NVARCHAR(64) NULL,
  invoice_id NVARCHAR(64) NULL,
  -- Denormalized from Invoice at write time (Invoice stays MongoDB this wave) so reads never need
  -- a cross-database join/populate -- see LEGACYTOMODERN_SQL_ONLY_STRATEGY.md section 6.1 point 6.
  invoice_no NVARCHAR(100) NULL,
  invoice_total_amount DECIMAL(18,2) NULL,
  invoice_payment_status NVARCHAR(30) NULL,
  return_id NVARCHAR(64) NULL,
  due_adjustment_id NVARCHAR(64) NULL,
  amount DECIMAL(18,2) NOT NULL,
  payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash',
  description NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.commission_rule') IS NULL
CREATE TABLE erp.commission_rule (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  employee_id NVARCHAR(64) NULL,
  scope NVARCHAR(20) NOT NULL DEFAULT 'ALL' CHECK (scope IN ('ITEM','CATEGORY','ALL')),
  item_id NVARCHAR(64) NULL,
  category NVARCHAR(200) NULL,
  rate_type NVARCHAR(20) NOT NULL DEFAULT 'PERCENT' CHECK (rate_type IN ('PERCENT','FLAT')),
  rate_value DECIMAL(18,2) NOT NULL CHECK (rate_value >= 0),
  status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.debit_note') IS NULL
CREATE TABLE erp.debit_note (
  id BIGINT IDENTITY PRIMARY KEY,
  note_id NVARCHAR(100) NOT NULL UNIQUE,
  debit_note_number NVARCHAR(100) NULL,
  source_id NVARCHAR(100) NULL,
  note_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  vendor_id NVARCHAR(64) NOT NULL,
  vendor_name NVARCHAR(200) NOT NULL,
  po_reference NVARCHAR(100) NULL,
  reason NVARCHAR(20) NOT NULL CHECK (reason IN ('RETURN','PRICE_DIFF','QUALITY','SHORTAGE','OTHER')),
  items NVARCHAR(MAX) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED')),
  branch_id NVARCHAR(100) NOT NULL DEFAULT 'Main',
  notes NVARCHAR(1000) NULL,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_debit_note_items_json CHECK (ISJSON(items) = 1));
GO

IF OBJECT_ID('erp.rate_revision') IS NULL
CREATE TABLE erp.rate_revision (
  id BIGINT IDENTITY PRIMARY KEY,
  item_id NVARCHAR(64) NOT NULL,
  item_name NVARCHAR(200) NULL,
  item_sku NVARCHAR(100) NULL,
  supplier_id NVARCHAR(64) NOT NULL,
  supplier_name NVARCHAR(200) NULL,
  batch_number NVARCHAR(100) NOT NULL,
  old_rate DECIMAL(18,2) NOT NULL,
  new_rate DECIMAL(18,2) NOT NULL,
  affected_qty DECIMAL(18,3) NOT NULL,
  diff_amount DECIMAL(18,2) NOT NULL,
  reason NVARCHAR(500) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_by NVARCHAR(64) NULL,
  created_by_name NVARCHAR(200) NULL,
  approved_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.supplier_group') IS NULL
CREATE TABLE erp.supplier_group (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL UNIQUE,
  description NVARCHAR(500) NULL,
  color NVARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  nature NVARCHAR(20) NOT NULL DEFAULT 'Raw Material' CHECK (nature IN ('Raw Material','Finished Goods','Services','Others')),
  region NVARCHAR(20) NOT NULL DEFAULT 'Local' CHECK (region IN ('Local','Outstation')),
  financial_category NVARCHAR(20) NOT NULL DEFAULT 'Credit' CHECK (financial_category IN ('Credit','Cash')),
  priority NVARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  tax_type NVARCHAR(10) NOT NULL DEFAULT 'GST' CHECK (tax_type IN ('GST','Non-GST')),
  payment_terms INT NOT NULL DEFAULT 30,
  credit_limit DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  icon NVARCHAR(50) NOT NULL DEFAULT 'truck',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.supplier_reconciliation') IS NULL
CREATE TABLE erp.supplier_reconciliation (
  id BIGINT IDENTITY PRIMARY KEY,
  supplier_id NVARCHAR(64) NOT NULL,
  transaction_type NVARCHAR(20) NOT NULL CHECK (transaction_type IN ('BILL','PAYMENT','DEBIT_NOTE')),
  transaction_id NVARCHAR(100) NOT NULL UNIQUE,
  reconciled_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  status NVARCHAR(20) NOT NULL DEFAULT 'RECONCILED' CHECK (status IN ('RECONCILED','DISPUTED')),
  notes NVARCHAR(500) NULL,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.sales_order') IS NULL
CREATE TABLE erp.sales_order (
  id BIGINT IDENTITY PRIMARY KEY,
  order_number NVARCHAR(100) NOT NULL UNIQUE,
  customer_id NVARCHAR(64) NOT NULL,
  order_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  expected_delivery_date DATETIME2 NULL,
  items NVARCHAR(MAX) NOT NULL,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  status NVARCHAR(30) NOT NULL DEFAULT 'Draft',
  notes NVARCHAR(1000) NULL,
  is_confirmed BIT NOT NULL DEFAULT 0,
  is_cancelled BIT NOT NULL DEFAULT 0,
  is_overdue BIT NOT NULL DEFAULT 0,
  prices_locked BIT NOT NULL DEFAULT 0,
  delivery_challan_ids NVARCHAR(MAX) NOT NULL DEFAULT '[]',
  invoice_ids NVARCHAR(MAX) NOT NULL DEFAULT '[]',
  created_by NVARCHAR(64) NULL,
  confirmed_at DATETIME2 NULL,
  confirmed_by NVARCHAR(64) NULL,
  cancelled_at DATETIME2 NULL,
  cancelled_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_sales_order_items_json CHECK (ISJSON(items) = 1));
GO

IF OBJECT_ID('erp.estimate') IS NULL
CREATE TABLE erp.estimate (
  id BIGINT IDENTITY PRIMARY KEY,
  estimate_no NVARCHAR(100) NOT NULL UNIQUE,
  customer_id NVARCHAR(64) NULL,
  items NVARCHAR(MAX) NOT NULL,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  notes NVARCHAR(1000) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_estimate_items_json CHECK (ISJSON(items) = 1));
GO

IF OBJECT_ID('erp.delivery_challan') IS NULL
CREATE TABLE erp.delivery_challan (
  id BIGINT IDENTITY PRIMARY KEY,
  challan_number NVARCHAR(100) NOT NULL UNIQUE,
  customer_id NVARCHAR(64) NOT NULL,
  challan_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  delivery_date DATETIME2 NULL,
  items NVARCHAR(MAX) NOT NULL,
  sales_order_id BIGINT NULL REFERENCES erp.sales_order(id),
  vehicle_no NVARCHAR(50) NULL,
  driver_name NVARCHAR(200) NULL,
  transport_mode NVARCHAR(20) NOT NULL DEFAULT 'road' CHECK (transport_mode IN ('road','rail','air','ship','courier')),
  notes NVARCHAR(1000) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Delivered','Converted')),
  converted_to_invoice_id NVARCHAR(64) NULL,
  converted_at DATETIME2 NULL,
  system_generated BIT NOT NULL DEFAULT 0,
  is_deleted BIT NOT NULL DEFAULT 0,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_delivery_challan_items_json CHECK (ISJSON(items) = 1));
GO

IF OBJECT_ID('erp.payment_in') IS NULL
CREATE TABLE erp.payment_in (
  id BIGINT IDENTITY PRIMARY KEY,
  receipt_number NVARCHAR(100) NOT NULL,
  customer_id NVARCHAR(64) NOT NULL,
  payment_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  total_amount DECIMAL(18,2) NOT NULL CHECK (total_amount > 0),
  payment_methods NVARCHAR(MAX) NOT NULL,
  allocated_invoices NVARCHAR(MAX) NOT NULL DEFAULT '[]',
  credit_applied DECIMAL(18,2) NOT NULL DEFAULT 0,
  excess_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  deposit_account NVARCHAR(100) NULL,
  notes NVARCHAR(1000) NULL,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_payment_in_receipt UNIQUE (receipt_number, created_by),
  CONSTRAINT CK_payment_in_methods_json CHECK (ISJSON(payment_methods) = 1),
  CONSTRAINT CK_payment_in_alloc_json CHECK (ISJSON(allocated_invoices) = 1));
GO

IF OBJECT_ID('erp.purchase_payment') IS NULL
CREATE TABLE erp.purchase_payment (
  id BIGINT IDENTITY PRIMARY KEY,
  payment_no NVARCHAR(100) NOT NULL UNIQUE,
  payment_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  supplier_id NVARCHAR(64) NOT NULL,
  payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','upi','card','cheque','bank_transfer')),
  amount DECIMAL(18,2) NOT NULL,
  notes NVARCHAR(1000) NULL,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.payment_out') IS NULL
CREATE TABLE erp.payment_out (
  id BIGINT IDENTITY PRIMARY KEY,
  payment_no NVARCHAR(100) NOT NULL UNIQUE,
  supplier_id NVARCHAR(64) NOT NULL,
  supplier_name NVARCHAR(200) NULL,
  payment_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  amount DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
  payment_mode NVARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash','Cheque','UPI','Bank Transfer','Discount Received')),
  reference_no NVARCHAR(100) NULL,
  bank_account_id NVARCHAR(64) NULL,
  bank_name NVARCHAR(200) NULL,
  bank_account_number NVARCHAR(50) NULL,
  cheque_date DATETIME2 NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'cleared' CHECK (status IN ('pending','cleared','bounced','cancelled')),
  allocations NVARCHAR(MAX) NOT NULL DEFAULT '[]',
  unallocated_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  notes NVARCHAR(1000) NULL,
  created_by NVARCHAR(64) NULL,
  created_by_name NVARCHAR(200) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_payment_out_alloc_json CHECK (ISJSON(allocations) = 1));
GO
