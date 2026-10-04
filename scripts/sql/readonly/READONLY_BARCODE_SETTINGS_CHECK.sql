-- READ-ONLY. Run as erp_readonly against SSS_copy. Changes nothing.
-- Purpose: decode what grndetail's date/barcode settings (date_con, date_pos, month_con, month_pos, year_con,
-- year_pos, reverse_con, month_gen, month_year, barcode) mean, by comparing them with the barcodes
-- Textilesoft actually produced. The ERP currently uses one fixed format (reversed year/month/day + counter serial).
SET NOCOUNT ON;

PRINT '--- 1. grndetail: one row per company (all settings columns) ---';
SELECT * FROM dbo.grndetail;

PRINT '--- 2. counter serial used as the last prefix digit ---';
SELECT counter_name, sl_no FROM dbo.countername;

PRINT '--- 3. barcodes per purchase day: length, prefix length (barLen), count; newest 40 day/length groups ---';
SELECT TOP 40 [date] AS purchase_day, LEN(LTRIM(RTRIM(barcode))) AS barcode_len, ISNULL(TRY_CAST(barLen AS int), -1) AS barLen,
       MIN(LTRIM(RTRIM(barcode))) AS first_barcode, MAX(LTRIM(RTRIM(barcode))) AS last_barcode, COUNT(*) AS lines
FROM dbo.purentrydetails
WHERE NULLIF(LTRIM(RTRIM(barcode)), '') IS NOT NULL
GROUP BY [date], LEN(LTRIM(RTRIM(barcode))), ISNULL(TRY_CAST(barLen AS int), -1)
ORDER BY MAX(TRY_CAST(entry_date AS datetime)) DESC;

PRINT '--- 4. same-day samples: does the prefix follow the ERP rule (reversed yy, month, day + serial)? ---';
SELECT TOP 30 [date] AS purchase_day, LTRIM(RTRIM(barcode)) AS barcode, LTRIM(RTRIM(orgbar)) AS orgbar, barLen, grn_no
FROM dbo.purentrydetails
WHERE NULLIF(LTRIM(RTRIM(barcode)), '') IS NOT NULL
ORDER BY TRY_CAST(entry_date AS datetime) DESC;
