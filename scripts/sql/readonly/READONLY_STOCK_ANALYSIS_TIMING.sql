-- READ-ONLY. Run in SSMS on SSS_copy. Shows how long each source scan takes and how big the tables are.
SET STATISTICS TIME ON;
SELECT 'rows' AS what, (SELECT COUNT(*) FROM dbo.salsntry) AS salsntry, (SELECT COUNT(*) FROM dbo.purentrydetails) AS purentrydetails, (SELECT COUNT(*) FROM dbo.stockdetails) AS stockdetails;
SELECT COUNT(*) FROM (SELECT LTRIM(RTRIM(barcode)) bc, SUM(TRY_CAST(qty AS float)) q, SUM(TRY_CAST(net_amount AS float)) v FROM dbo.salsntry WHERE [status] <> '1' GROUP BY LTRIM(RTRIM(barcode))) x;
SELECT COUNT(*) FROM (SELECT LTRIM(RTRIM(barcode)) bc, SUM(TRY_CAST(qty AS float)) q FROM dbo.purentrydetails WHERE STATUS IS NULL GROUP BY LTRIM(RTRIM(barcode))) x;
SELECT COUNT(*) FROM (SELECT LTRIM(RTRIM(barcode)) bc, SUM(TRY_CAST(qty AS float)) q FROM dbo.stockdetails GROUP BY LTRIM(RTRIM(barcode))) x;
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='salsntry' AND COLUMN_NAME IN ('date','qty','net_amount','barcode','status');
SET STATISTICS TIME OFF;
