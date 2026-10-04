-- READ-ONLY checks (SELECT only). Run in SSMS against the shop database (SSS_copy / SSS).
-- Nothing here creates, alters or writes anything.

-- 0) Which database is this running in? It must be the shop database, NOT master.
--    If it says master, pick the shop database in the SSMS dropdown (or uncomment the USE line) and re-run.
-- USE [SSS_copy];
SELECT DB_NAME() AS current_database,
       (SELECT COUNT(*) FROM sys.tables WHERE name = 'newuser') AS has_newuser_table;

-- 1) Do the erp.* objects the POS writer / tax master need already exist?
SELECT s.name AS [schema], t.name AS [table]
  FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
 WHERE s.name = 'erp'
 ORDER BY t.name;
-- Needed by the POS: erp.sales_idempotency, erp.sales_return_allocation (migration 004 must NOT be run).

-- 2) Columns of the Textilesoft tables used by the recent ERP changes
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE,
       COLUMNPROPERTY(OBJECT_ID('dbo.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS is_identity
  FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA = 'dbo'
   AND TABLE_NAME IN ('newuser','specialcondion','companydetail','supplierdetail',
                      'customercmyname','agentdetail','cashiername','CustomerGroup')
 ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 3) Duplicate barcodes (one barcode should identify one purchase lot)
SELECT 'purentrydetails' AS tbl, COUNT(*) AS duplicate_barcodes FROM (
  SELECT LTRIM(RTRIM(barcode)) b FROM dbo.purentrydetails
   WHERE NULLIF(LTRIM(RTRIM(barcode)),'') IS NOT NULL
   GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*) > 1) x
UNION ALL
SELECT 'stockdetails', COUNT(*) FROM (
  SELECT LTRIM(RTRIM(barcode)) b FROM dbo.stockdetails
   WHERE NULLIF(LTRIM(RTRIM(barcode)),'') IS NOT NULL
   GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*) > 1) y;

-- 4) Can the current login change the schema? (Task 0.1: it should NOT be able to)
SELECT HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') AS can_create_table,
       HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'ALTER ANY SCHEMA') AS can_alter_schema,
       IS_MEMBER('db_owner') AS is_db_owner,
       IS_MEMBER('db_ddladmin') AS is_ddl_admin;
