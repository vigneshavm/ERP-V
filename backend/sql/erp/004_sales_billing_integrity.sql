-- Sales billing retry protection and precise return-to-sale-line allocations.
-- Applied only by the administrator-run erp:migrate command; no dbo schema changes.

IF OBJECT_ID('erp.sales_idempotency') IS NULL
CREATE TABLE erp.sales_idempotency (
  id BIGINT IDENTITY PRIMARY KEY,
  scope NVARCHAR(160) NOT NULL,
  idempotency_key NVARCHAR(200) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  sysidandbill NVARCHAR(100) NOT NULL,
  billno NVARCHAR(50) NOT NULL,
  mode NVARCHAR(50) NOT NULL,
  counter_name NVARCHAR(100) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  bill_datetime NVARCHAR(40) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_sales_idempotency_scope_key UNIQUE (scope, idempotency_key));
GO

IF OBJECT_ID('erp.sales_return_allocation') IS NULL
CREATE TABLE erp.sales_return_allocation (
  id BIGINT IDENTITY PRIMARY KEY,
  source_sysidandbill NVARCHAR(100) NOT NULL,
  source_sale_line_no BIGINT NOT NULL,
  return_sysidandbill NVARCHAR(100) NOT NULL,
  return_sale_line_no BIGINT NOT NULL,
  barcode NVARCHAR(100) NOT NULL,
  quantity DECIMAL(18,3) NOT NULL CHECK (quantity > 0),
  paid_amount DECIMAL(18,2) NOT NULL,
  gst_rate DECIMAL(9,4) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_sales_return_allocation_return_line UNIQUE (return_sysidandbill, return_sale_line_no));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_sales_return_allocation_source' AND object_id=OBJECT_ID('erp.sales_return_allocation'))
CREATE INDEX IX_sales_return_allocation_source ON erp.sales_return_allocation(source_sysidandbill, source_sale_line_no);
GO
