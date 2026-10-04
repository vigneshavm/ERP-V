-- READ-ONLY. Run in SSMS with database SSS_copy selected. Changes nothing.
USE SSS_copy;
GO
SELECT DB_NAME() AS running_in_database;  -- must say SSS_copy

-- Does the database itself restrict who can cancel a bill (status = '1' on sales2 / salsntry)?

-- 1. Triggers on the bill tables (a trigger could block or log a cancel)
SELECT OBJECT_NAME(parent_id) AS table_name, name AS trigger_name, is_disabled, OBJECT_DEFINITION(object_id) AS definition
FROM sys.triggers WHERE OBJECT_NAME(parent_id) IN ('sales2','salsntry','salbill','Escsave');

-- 2. What each ERP login may do on the bill tables
SELECT 'erp_pos_writer' AS login_name, t.tbl,
       HAS_PERMS_BY_NAME(t.tbl,'OBJECT','UPDATE') AS can_update, HAS_PERMS_BY_NAME(t.tbl,'OBJECT','DELETE') AS can_delete
FROM (VALUES ('dbo.sales2'),('dbo.salsntry'),('dbo.Escsave')) AS t(tbl);
-- (run the block above again while connected as erp_readonly / erp_pos_writer to see each login's own result)

-- 3. Check constraints and column defaults on the status columns
SELECT OBJECT_NAME(cc.parent_object_id) AS table_name, cc.name, cc.definition
FROM sys.check_constraints cc WHERE OBJECT_NAME(cc.parent_object_id) IN ('sales2','salsntry');

-- 4. Is there a role / permission column in the legacy user tables?
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('UserDetails','userdetail','newuser','logindetails','LoginDetail','usermaster','Users')
   OR (COLUMN_NAME LIKE '%role%' OR COLUMN_NAME LIKE '%permission%' OR COLUMN_NAME LIKE '%usertype%' OR COLUMN_NAME LIKE '%rights%')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 5. Are there existing cancelled bills, and who cancelled them (if a user column exists)?
SELECT COUNT(*) AS cancelled_bills FROM dbo.sales2 WHERE [status] = '1';
SELECT TOP 5 * FROM dbo.sales2 WHERE [status] = '1' ORDER BY [date] DESC;
