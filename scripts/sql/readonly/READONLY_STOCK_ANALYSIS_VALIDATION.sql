-- READ-ONLY. Run in SSMS with database SSS_copy selected. Changes nothing.
-- Reconciles the Inventory / Stock Aging & Sales Analysis report against the raw legacy tables.
-- Set the as-of date (the report's "As-of date", default = newest sale date).
DECLARE @asOf date = (SELECT CAST(MAX([date]) AS date) FROM dbo.sales2);
DECLARE @bc varchar(50) = '';   -- <-- put a sample barcode here to trace one item (leave '' to skip)

-- 0. Column check for the things the report assumes (should list every column below)
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE (TABLE_NAME='salsntry' AND COLUMN_NAME IN ('barcode','date','qty','net_amount','status','billno','p_name','brand','ProGroupName'))
   OR (TABLE_NAME='stockdetails' AND COLUMN_NAME IN ('barcode','pname','code','brand','size','color','prate','mrp','qty'))
   OR (TABLE_NAME='purentrydetails' AND COLUMN_NAME IN ('barcode','entry_date','grn_no','qty','fqty','STATUS'))
   OR (TABLE_NAME='newproduct' AND COLUMN_NAME IN ('code','group_name','sub_group_name'))
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 0b. Columns that might hold gender / age group / style / lead time (for the BLOCKED items)
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE '%gender%' OR COLUMN_NAME LIKE '%age%grp%' OR COLUMN_NAME LIKE '%agegroup%' OR COLUMN_NAME LIKE '%lead%'
   OR COLUMN_NAME LIKE '%safety%' OR COLUMN_NAME LIKE '%occasion%' OR COLUMN_NAME LIKE '%style%' OR COLUMN_NAME LIKE '%branch%';
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('salsntryReturn','salbillReturns','prosubgroup') ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 1. Totals (compare with the report's KPI cards: stock qty / cost value)
;WITH sal AS (SELECT LTRIM(RTRIM(barcode)) bc, SUM(ISNULL(TRY_CAST(qty AS float),0)) sq FROM dbo.salsntry WHERE [status] <> '1' AND [date] < DATEADD(day,1,@asOf) GROUP BY LTRIM(RTRIM(barcode))),
ret AS (SELECT bc, SUM(q) rq FROM (SELECT LTRIM(RTRIM(barcode)) bc, ISNULL(TRY_CAST(qty AS float),0) q FROM dbo.purretrun WHERE [date] < DATEADD(day,1,@asOf)
        UNION ALL SELECT LTRIM(RTRIM(barcode)), ISNULL(TRY_CAST(qty AS float),0) FROM dbo.PurchaseReturnDetails WHERE entry_date < DATEADD(day,1,@asOf)) r GROUP BY bc),
sd AS (SELECT LTRIM(RTRIM(barcode)) bc, SUM(ISNULL(TRY_CAST(qty AS float),0)) q, MAX(TRY_CAST(prate AS float)) prate FROM dbo.stockdetails GROUP BY LTRIM(RTRIM(barcode)))
SELECT COUNT(*) AS barcodes_with_stock, SUM(x.stk) AS stock_qty, SUM(x.stk * ISNULL(x.prate,0)) AS stock_cost_value
FROM (SELECT sd.q - ISNULL(sal.sq,0) - ISNULL(ret.rq,0) AS stk, sd.prate FROM sd LEFT JOIN sal ON sal.bc=sd.bc LEFT JOIN ret ON ret.bc=sd.bc) x WHERE x.stk > 0;

-- 2. Purchase / sales / returns totals up to the as-of date
SELECT 'purchased (active rows)' AS what, SUM(ISNULL(TRY_CAST(qty AS float),0)+ISNULL(TRY_CAST(fqty AS float),0)) AS qty FROM dbo.purentrydetails WHERE STATUS IS NULL AND entry_date < DATEADD(day,1,@asOf)
UNION ALL SELECT 'sold (not cancelled)', SUM(ISNULL(TRY_CAST(qty AS float),0)) FROM dbo.salsntry WHERE [status] <> '1' AND [date] < DATEADD(day,1,@asOf)
UNION ALL SELECT 'purchase returns', (SELECT SUM(ISNULL(TRY_CAST(qty AS float),0)) FROM dbo.purretrun WHERE [date] < DATEADD(day,1,@asOf)) + (SELECT SUM(ISNULL(TRY_CAST(qty AS float),0)) FROM dbo.PurchaseReturnDetails WHERE entry_date < DATEADD(day,1,@asOf));

-- 3. Does stockdetails.qty equal the active purchase rows? (largest differences first)
SELECT TOP 30 sd.bc, sd.q AS stockdetails_qty, pe.pq AS purchase_rows_qty, sd.q - ISNULL(pe.pq,0) AS diff FROM
 (SELECT LTRIM(RTRIM(barcode)) bc, SUM(ISNULL(TRY_CAST(qty AS float),0)) q FROM dbo.stockdetails GROUP BY LTRIM(RTRIM(barcode))) sd
 LEFT JOIN (SELECT LTRIM(RTRIM(barcode)) bc, SUM(ISNULL(TRY_CAST(qty AS float),0)+ISNULL(TRY_CAST(fqty AS float),0)) pq FROM dbo.purentrydetails WHERE STATUS IS NULL GROUP BY LTRIM(RTRIM(barcode))) pe ON pe.bc = sd.bc
 WHERE ABS(sd.q - ISNULL(pe.pq,0)) > 0.0001 ORDER BY ABS(sd.q - ISNULL(pe.pq,0)) DESC;

-- 4. Trace one barcode through every source (fill @bc above)
IF @bc <> '' BEGIN
  SELECT 'purchase' src, barcode, entry_date, grn_no, qty, fqty, STATUS FROM dbo.purentrydetails WHERE LTRIM(RTRIM(barcode)) = @bc;
  SELECT 'stockdetails' src, barcode, pname, code, size, color, prate, mrp, qty FROM dbo.stockdetails WHERE LTRIM(RTRIM(barcode)) = @bc;
  SELECT 'sale line' src, barcode, [date], billno, qty, net_amount, [status] FROM dbo.salsntry WHERE LTRIM(RTRIM(barcode)) = @bc ORDER BY [date];
  SELECT 'purchase return' src, barcode, [date], qty FROM dbo.purretrun WHERE LTRIM(RTRIM(barcode)) = @bc;
  SELECT 'purchase return (details)' src, barcode, entry_date, qty FROM dbo.PurchaseReturnDetails WHERE LTRIM(RTRIM(barcode)) = @bc;
END

-- 5. Data-quality counts
SELECT (SELECT COUNT(*) FROM (SELECT LTRIM(RTRIM(barcode)) b FROM dbo.stockdetails GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*)>1) d) AS barcodes_duplicated_in_stockdetails,
       (SELECT COUNT(*) FROM (SELECT LTRIM(RTRIM(barcode)) b FROM dbo.purentrydetails WHERE STATUS IS NULL GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*)>1) d) AS barcodes_with_several_purchase_rows,
       (SELECT COUNT(*) FROM dbo.salsntry WHERE [status] IS NULL) AS sale_lines_with_null_status;

-- 6. Price distribution (to sanity-check the derived Value / Regular / Premium cut points)
SELECT TOP 20 CAST(ROUND(TRY_CAST(mrp AS float), -2) AS int) AS mrp_rounded_100, COUNT(*) AS barcodes FROM dbo.stockdetails GROUP BY CAST(ROUND(TRY_CAST(mrp AS float), -2) AS int) ORDER BY COUNT(*) DESC;
