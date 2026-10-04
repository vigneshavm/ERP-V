-- READ-ONLY. Run in SSMS with database SSS_copy selected. Changes nothing.
SELECT DB_NAME() AS db;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('newcustomer','customercmyname','mrpratechange','productwisediscount','BarcodeWiseDiscount','ratecha')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('newcustomer','customercmyname','mrpratechange','productwisediscount','BarcodeWiseDiscount','ratecha');
-- does the ERP write login already have UPDATE on these?
SELECT 'newcustomer' t, HAS_PERMS_BY_NAME('dbo.newcustomer','OBJECT','UPDATE') can_update
UNION ALL SELECT 'mrpratechange', HAS_PERMS_BY_NAME('dbo.mrpratechange','OBJECT','INSERT');
-- how many customers share a mobile or card (duplicates make a legacy-style UPDATE hit several rows)
SELECT COUNT(*) AS rows_, COUNT(DISTINCT mobile_nu) AS distinct_mobiles, COUNT(DISTINCT card_number) AS distinct_cards FROM dbo.newcustomer;
