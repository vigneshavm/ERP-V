-- backend/sql/erp/002_wave2_masters_settings.sql
-- Wave 2 (LEGACYTOMODERN_SQL_ONLY_STRATEGY.md section 8): settings & simple masters that have no
-- Textilesoft table equivalent. Single-shop: no tenant_id column (see section 2, ground rule 7).

IF OBJECT_ID('erp.shop_settings') IS NULL
CREATE TABLE erp.shop_settings (
  id BIGINT IDENTITY PRIMARY KEY,
  shop_enabled BIT NOT NULL DEFAULT 0,
  custom_domain NVARCHAR(200) NOT NULL DEFAULT '',
  theme NVARCHAR(50) NOT NULL DEFAULT 'Basic',
  support_email NVARCHAR(200) NOT NULL DEFAULT '',
  [plan] NVARCHAR(20) NOT NULL DEFAULT 'Starter',
  products_limit INT NOT NULL DEFAULT 50,
  api_access BIT NOT NULL DEFAULT 0,
  white_labeling BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.system_config') IS NULL
CREATE TABLE erp.system_config (
  id BIGINT IDENTITY PRIMARY KEY,
  config_key NVARCHAR(200) NOT NULL UNIQUE,
  value NVARCHAR(MAX) NOT NULL, -- JSON
  description NVARCHAR(500) NOT NULL DEFAULT '',
  config_group NVARCHAR(20) NOT NULL DEFAULT 'GENERAL',
  updated_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_system_config_value_json CHECK (ISJSON(value) = 1));
GO

IF OBJECT_ID('erp.tax_master') IS NULL
CREATE TABLE erp.tax_master (
  id BIGINT IDENTITY PRIMARY KEY,
  tax_code NVARCHAR(50) NOT NULL UNIQUE,
  tax_name NVARCHAR(200) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  effective_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  end_date DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  gst_type_id BIGINT NULL,   -- erp.master_entry(id), type GST_TYPE (additive, reporting only)
  gst_group_id BIGINT NULL,  -- erp.master_entry(id), type GST_GROUP (additive, reporting only)
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

-- 28 MASTER_TYPES (see backend/src/modules/masters/masterTypes.ts); Textilesoft-tied types (PRODUCT_BRAND,
-- PRODUCT_SIZE, GST_GROUP, WAREHOUSE, ...) keep reading dbo via sqlMasters.ts (SQL_MASTER_TYPES) and are
-- NOT stored here -- this table is only for the remaining ERP-only types (CUSTOMER_GROUP, EXPENSE_GROUP, ...).
IF OBJECT_ID('erp.master_entry') IS NULL
CREATE TABLE erp.master_entry (
  id BIGINT IDENTITY PRIMARY KEY,
  entry_type NVARCHAR(50) NOT NULL,
  name NVARCHAR(200) NOT NULL,
  description NVARCHAR(500) NULL,
  parent_id BIGINT NULL REFERENCES erp.master_entry(id),
  meta NVARCHAR(MAX) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_master_entry_type_name UNIQUE (entry_type, name),
  CONSTRAINT CK_master_entry_meta_json CHECK (meta IS NULL OR ISJSON(meta) = 1));
GO

IF OBJECT_ID('erp.expense_category') IS NULL
CREATE TABLE erp.expense_category (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  monthly_budget DECIMAL(18,2) NOT NULL DEFAULT 0,
  approval_required BIT NOT NULL DEFAULT 0,
  is_cash_allowed BIT NOT NULL DEFAULT 1,
  is_active BIT NOT NULL DEFAULT 1,
  gst_eligible BIT NOT NULL DEFAULT 0,
  group_id BIGINT NULL REFERENCES erp.master_entry(id), -- type EXPENSE_GROUP
  created_by NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_expense_category_name UNIQUE (name));
GO

IF OBJECT_ID('erp.category') IS NULL
CREATE TABLE erp.category (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL UNIQUE,
  description NVARCHAR(500) NULL,
  color NVARCHAR(20) NOT NULL DEFAULT '#6366f1',
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 5,
  default_unit NVARCHAR(20) NOT NULL DEFAULT 'pcs',
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

-- Reference catalogs unioned with Item-derived values in the UI (see InventoryService.getFilterOptions);
-- kept separate from Textilesoft's own dbo.brand/size/color, which sqlMasters.ts already serves.
IF OBJECT_ID('erp.brand') IS NULL
CREATE TABLE erp.brand (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL UNIQUE,
  description NVARCHAR(500) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.color') IS NULL
CREATE TABLE erp.color (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL UNIQUE,
  hex_code NVARCHAR(20) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

IF OBJECT_ID('erp.size') IS NULL
CREATE TABLE erp.size (
  id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL UNIQUE,
  code NVARCHAR(50) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
