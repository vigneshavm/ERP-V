/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Is superbill1 a second copy of salsntry (double counting) or a separate sales ledger?
 * Compares three stock formulas lot by lot.   npm run analyze:textilesoft:overlap
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
type Row = Record<string, unknown>;
const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;
const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | { error: string }> {
    try {
        return await fn();
    } catch (e) {
        console.log(`  ! ${label}: ${(e as Error).message}`);
        return { error: (e as Error).message };
    }
}

const CTE = `WITH s AS (SELECT barcode, SUM(TRY_CAST(qty AS float)) AS q FROM dbo.stockdetails GROUP BY barcode),
  a AS (SELECT barcode, SUM(TRY_CAST(qty AS float)) AS q FROM dbo.salsntry WHERE status <> '1' GROUP BY barcode),
  b AS (SELECT barcode, SUM(TRY_CAST(qty AS float)) AS q FROM dbo.superbill1 WHERE status <> '1' GROUP BY barcode),
  r AS (SELECT barcode, SUM(TRY_CAST(qty AS float)) AS q FROM dbo.purretrun GROUP BY barcode)`;
const scenario = (name: string, expr: string) =>
    `SELECT '${name}' AS scenario, SUM(CASE WHEN v > 0 THEN 1 ELSE 0 END) AS positiveLots, SUM(CASE WHEN v = 0 THEN 1 ELSE 0 END) AS zeroLots,
     SUM(CASE WHEN v < 0 THEN 1 ELSE 0 END) AS negativeLots, SUM(CASE WHEN v > 0 THEN v ELSE 0 END) AS positiveQty, SUM(CASE WHEN v < 0 THEN v ELSE 0 END) AS negativeQty
     FROM (SELECT ${expr} AS v FROM s LEFT JOIN a ON a.barcode = s.barcode LEFT JOIN b ON b.barcode = s.barcode LEFT JOIN r ON r.barcode = s.barcode) x`;

async function main() {
    const pool = await openPool(loadDbConfig());
    try {
        console.log("1/3 stock under three formulas ...");
        out.scenarios = await safe("scenarios", () =>
            q(pool, `${CTE} ${scenario("A: purchased - salsntry - returns", "ISNULL(s.q,0)-ISNULL(a.q,0)-ISNULL(r.q,0)")}
              UNION ALL ${scenario("B: A - superbill1", "ISNULL(s.q,0)-ISNULL(a.q,0)-ISNULL(b.q,0)-ISNULL(r.q,0)")}
              UNION ALL ${scenario("C: purchased - superbill1 - returns", "ISNULL(s.q,0)-ISNULL(b.q,0)-ISNULL(r.q,0)")}`),
        );

        console.log("2/3 do superbill1 lines repeat salsntry lines? ...");
        out.overlapByBillLine = await safe("overlap by bill line", () =>
            q(pool, `SELECT COUNT(*) AS superbillLines, SUM(CASE WHEN m.k IS NOT NULL THEN 1 ELSE 0 END) AS sameBillLineInSalsntry
              FROM dbo.superbill1 b LEFT JOIN (SELECT DISTINCT cmny_bill, barcode, srl_no, 1 AS k FROM dbo.salsntry) m
              ON m.cmny_bill = b.cmny_bill AND m.barcode = b.barcode AND m.srl_no = b.srl_no`),
        );
        out.overlapByBillNo = await safe("overlap by bill number", () =>
            q(pool, `SELECT COUNT(*) AS superbillLines, SUM(CASE WHEN m.k IS NOT NULL THEN 1 ELSE 0 END) AS sameBillNoAndDateInSalsntry
              FROM dbo.superbill1 b LEFT JOIN (SELECT DISTINCT mode, [date], 1 AS k FROM dbo.salsntry) m ON m.mode = b.mode AND m.[date] = b.[date]`),
        );
        out.noRanges = await safe("No ranges", () =>
            q(pool, `SELECT (SELECT MIN([No]) FROM dbo.salsntry) AS salsntryMinNo, (SELECT MAX([No]) FROM dbo.salsntry) AS salsntryMaxNo,
              (SELECT MIN([No]) FROM dbo.superbill1) AS superbillMinNo, (SELECT MAX([No]) FROM dbo.superbill1) AS superbillMaxNo`),
        );

        console.log("3/3 sales by year in each table ...");
        out.byYear = await safe("by year", () =>
            q(pool, `SELECT 'salsntry' AS t, YEAR([date]) AS y, COUNT(*) AS lines, SUM(TRY_CAST(qty AS float)) AS qty FROM dbo.salsntry GROUP BY YEAR([date])
              UNION ALL SELECT 'superbill1', YEAR([date]), COUNT(*), SUM(TRY_CAST(qty AS float)) FROM dbo.superbill1 GROUP BY YEAR([date]) ORDER BY 1, 2`),
        );
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "overlap.json");
    fs.writeFileSync(file, JSON.stringify(out, null, 2), "utf8");
    console.log(`\nDone. Report written to ${file}\nTell Claude it is ready.`);
}

main().catch((e) => {
    console.error("Analysis failed:", e.message);
    process.exit(1);
});
