-- READ-ONLY. SSMS, database SSS_copy. Shows table sizes, indexes, and how long each report query takes.
SET NOCOUNT ON; SET STATISTICS TIME ON;
SELECT t.name, SUM(p.rows) AS row_count FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
WHERE t.name IN ('sales2','salsntry','purentrydetails','stockdetails','newproduct') GROUP BY t.name;
-- indexes that exist on the sales tables (the ERP is not allowed to add any)
SELECT OBJECT_NAME(i.object_id) tbl, i.name idx, i.type_desc, COL_NAME(ic.object_id, ic.column_id) col
FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
WHERE OBJECT_NAME(i.object_id) IN ('sales2','salsntry') ORDER BY 1,2,ic.key_ordinal;
SELECT DATA_TYPE, COLUMN_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('sales2','salsntry') AND COLUMN_NAME IN ('date','datetime','status','systemidbill','sysidandbill');
-- the report's queries (period 2026-10-01 .. 2026-10-04); read the "elapsed time" in Messages
SELECT COUNT(*) FROM dbo.sales2 WHERE ISNULL([status],'')<>'1' AND [date] >= CAST('2026-10-01' AS date) AND [date] < DATEADD(day,1,CAST('2026-10-04' AS date));
SELECT MAX([date]) FROM dbo.sales2;
SELECT MAX([date]) FROM dbo.salsntry;
SELECT TOP 15 UPPER(LTRIM(RTRIM(ISNULL(l.p_name,'')))) n, SUM(ISNULL(TRY_CAST(l.qty AS float),0)) q
FROM dbo.salsntry l WHERE ISNULL(l.[status],'')<>'1' AND l.[date] >= CAST('2026-10-01' AS date) AND l.[date] < DATEADD(day,1,CAST('2026-10-04' AS date))
GROUP BY UPPER(LTRIM(RTRIM(ISNULL(l.p_name,'')))) ORDER BY 2 DESC;
