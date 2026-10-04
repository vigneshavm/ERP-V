-- READ-ONLY. Run in SSMS (erp_readonly or your own login). Changes nothing.
-- Purpose: verify the real columns/values before the POS "edit bill" feature is built.
-- Change @bill to a real bill number of today (e.g. 'A2').
USE SSS_copy;
SET NOCOUNT ON;
DECLARE @bill varchar(30) = 'A2';

-- 1. Columns (type/length) of the bill tables
SELECT 'sales2' AS tbl, c.name, t.name AS type, c.max_length FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id WHERE c.object_id=OBJECT_ID('dbo.sales2') ORDER BY c.column_id;
SELECT 'salsntry' AS tbl, c.name, t.name AS type, c.max_length FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id WHERE c.object_id=OBJECT_ID('dbo.salsntry') ORDER BY c.column_id;
SELECT 'newcustomer' AS tbl, c.name, t.name AS type FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id WHERE c.object_id=OBJECT_ID('dbo.newcustomer') ORDER BY c.column_id;

-- 2. The bill header and its lines (all columns), today only
SELECT * FROM dbo.sales2 WHERE mode=@bill AND [date]=CAST(GETDATE() AS date);
SELECT * FROM dbo.salsntry WHERE mode=@bill AND [date]=CAST(GETDATE() AS date) ORDER BY [No];

-- 3. Has the old edit screen ever been used? (editbillno marker) -- ignore the error if the column doesn't exist
SELECT TOP 5 mode, editbillno, status, date1 FROM dbo.sales2 WHERE editbillno IS NOT NULL AND LTRIM(RTRIM(editbillno)) <> '' ORDER BY [No] DESC;

-- 4. Customer points / credit columns for the bill's customer
SELECT n.* FROM dbo.newcustomer n WHERE n.card_number IN (SELECT cus_card FROM dbo.sales2 WHERE mode=@bill AND [date]=CAST(GETDATE() AS date));

-- 5. Write permissions of the POS login on the tables an edit would touch
SELECT o.name AS tbl,
  HAS_PERMS_BY_NAME('erp_pos_writer','OBJECT::'+QUOTENAME(SCHEMA_NAME(o.schema_id))+'.'+QUOTENAME(o.name),'UPDATE') AS can_update,
  HAS_PERMS_BY_NAME('erp_pos_writer','OBJECT::'+QUOTENAME(SCHEMA_NAME(o.schema_id))+'.'+QUOTENAME(o.name),'INSERT') AS can_insert
FROM sys.objects o WHERE o.name IN ('sales2','salsntry','newcustomer','CustomerCreditPaymentEntry');
