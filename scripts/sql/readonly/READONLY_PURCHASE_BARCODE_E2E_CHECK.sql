-- READ-ONLY. Run as erp_readonly against SSS_copy AFTER saving a test purchase in the ERP. Changes nothing.
-- Set @grn to the GRN number the ERP showed after saving (e.g. VJ114129).
DECLARE @grn varchar(50) = 'VJ114129';
SET NOCOUNT ON;

PRINT '--- 1. header ---';
SELECT grn_no, cmy_name, suplier_name, invoce_date, entry_date FROM dbo.purgrnentry WHERE LTRIM(RTRIM(grn_no)) = @grn;

PRINT '--- 2. lines: every line has its own barcode; barcode = orgbar; barLen = prefix length ---';
SELECT sl_no, LTRIM(RTRIM(barcode)) AS barcode, LTRIM(RTRIM(orgbar)) AS orgbar, barLen, [date] AS purchase_day, pname, qty
FROM dbo.purentrydetails WHERE LTRIM(RTRIM(grn_no)) = @grn ORDER BY TRY_CAST(sl_no AS int);

PRINT '--- 3. expected prefix for that day (reversed yy + reversed month + reversed day + counter serial of SERVER) ---';
DECLARE @day varchar(20) = (SELECT TOP 1 [date] FROM dbo.purentrydetails WHERE LTRIM(RTRIM(grn_no)) = @grn);
DECLARE @d date = TRY_CONVERT(date, @day, 103);
DECLARE @serial varchar(10) = (SELECT TOP 1 LTRIM(RTRIM(sl_no)) FROM dbo.countername WHERE LTRIM(RTRIM(counter_name)) = 'SERVER');
SELECT @day AS purchase_day,
       LEFT(REVERSE(CAST(YEAR(@d) AS varchar(4))), 2) + REVERSE(CAST(MONTH(@d) AS varchar(2))) + REVERSE(CAST(DAY(@d) AS varchar(2))) + ISNULL(@serial, '1') AS expected_prefix;

PRINT '--- 4. PASS = every barcode starts with the expected prefix and the numbers after it are 1..n without gaps/repeats across the day ---';
WITH p AS (
  SELECT LEFT(REVERSE(CAST(YEAR(@d) AS varchar(4))), 2) + REVERSE(CAST(MONTH(@d) AS varchar(2))) + REVERSE(CAST(DAY(@d) AS varchar(2))) + ISNULL(@serial, '1') AS pre)
)
SELECT LTRIM(RTRIM(d.barcode)) AS barcode,
       CASE WHEN LEFT(LTRIM(RTRIM(d.barcode)), LEN(p.pre)) = p.pre THEN 'prefix OK' ELSE 'PREFIX MISMATCH' END AS prefix_check,
       TRY_CAST(SUBSTRING(LTRIM(RTRIM(d.barcode)), LEN(p.pre) + 1, 20) AS bigint) AS running_no
FROM dbo.purentrydetails d CROSS JOIN p WHERE LTRIM(RTRIM(d.grn_no)) = @grn ORDER BY running_no;

PRINT '--- 5. duplicates anywhere (expect 0 rows) ---';
SELECT LTRIM(RTRIM(barcode)) AS barcode, COUNT(*) AS n FROM dbo.purentrydetails
WHERE LTRIM(RTRIM(barcode)) IN (SELECT LTRIM(RTRIM(barcode)) FROM dbo.purentrydetails WHERE LTRIM(RTRIM(grn_no)) = @grn)
GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*) > 1;

PRINT '--- 6. stock copy: one stockdetails row per barcode (expect same count as lines) ---';
SELECT (SELECT COUNT(*) FROM dbo.purentrydetails WHERE LTRIM(RTRIM(grn_no)) = @grn) AS purchase_lines,
       (SELECT COUNT(*) FROM dbo.stockdetails s WHERE LTRIM(RTRIM(s.barcode)) IN (SELECT LTRIM(RTRIM(barcode)) FROM dbo.purentrydetails WHERE LTRIM(RTRIM(grn_no)) = @grn)) AS stock_rows;
