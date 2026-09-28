/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * One-shot, read-only analysis of the shop DB to decide the item/stock mapping.
 *   npm run analyze:textilesoft
 * Writes textilesoft-discovery/analysis.json (gitignored). Contains sample product/stock rows from
 * the shop DB but no customer or account data unless a sampled table holds it - review before sharing.
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
const FIXED = ["newproduct", "barqty", "stockdetails", "BarcodeBalStockMinQtyInsert"];
const NAME_HINT = /stock|bal|qty|sale|bill|barcode|product|item|grn|purch|rack|godown/i;

type Row = Record<string, unknown>;
const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | { error: string }> {
    try {
        return await fn();
    } catch (e) {
        console.log(`  ! ${label}: ${(e as Error).message}`);
        return { error: (e as Error).message };
    }
}

const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;

const clip = (row: Row): Row =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && v.length > 60 ? v.slice(0, 60) + "…" : v instanceof Date ? v.toISOString() : v]));

async function sample(pool: ShopDbPool, table: string) {
    const cols = await q(pool, `SELECT COLUMN_NAME AS name, DATA_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='${table}' ORDER BY ORDINAL_POSITION`);
    const rows = await q(pool, `SELECT TOP 5 * FROM dbo.[${table}]`);
    // Non-empty column list is more useful than 60 mostly-null columns.
    const used = cols.filter((c) => rows.some((r) => r[String(c.name)] !== null && r[String(c.name)] !== "" && r[String(c.name)] !== undefined)).map((c) => c.name);
    return { columns: cols.map((c) => `${c.name}:${c.type}`), nonEmptyInSample: used, rows: rows.map(clip) };
}

async function main() {
    const pool = await openPool(loadDbConfig());
    try {
        console.log("1/5 table row counts ...");
        const counts = (await q(pool, `SELECT t.name AS name, SUM(p.rows) AS n FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY t.name HAVING SUM(p.rows)>0 ORDER BY SUM(p.rows) DESC`)) as { name: string; n: number }[];
        out.topTablesByRows = counts.slice(0, 40);
        out.hintedTables = counts.filter((c) => NAME_HINT.test(c.name)).slice(0, 60);

        console.log("2/5 tables that have a barcode column ...");
        out.tablesWithBarcodeColumn = await safe("barcode tables", () =>
            q(pool, `SELECT c.TABLE_NAME AS name, c.COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.TABLE_SCHEMA='dbo' AND c.COLUMN_NAME LIKE '%barcode%' ORDER BY c.TABLE_NAME`),
        );

        console.log("3/5 sampling key tables ...");
        const wanted = new Set(FIXED.filter((t) => counts.some((c) => c.name.toLowerCase() === t.toLowerCase())));
        for (const c of counts.filter((c) => /stock|bal/i.test(c.name)).slice(0, 6)) wanted.add(c.name);
        const samples: Record<string, unknown> = {};
        for (const t of wanted) {
            if (!/^[A-Za-z0-9_]+$/.test(t)) continue;
            samples[t] = await safe(`sample ${t}`, () => sample(pool, t));
        }
        out.samples = samples;

        console.log("4/5 stockdetails counters ...");
        out.stockdetailsCounters = await safe("stockdetails counters", () =>
            q(pool, `SELECT COUNT(*) AS totalRows, COUNT(DISTINCT barcode) AS barcodes, COUNT(DISTINCT pname) AS productNames,
              SUM(CASE WHEN TRY_CAST(tot_qty AS float)<>0 THEN 1 ELSE 0 END) AS totQtyNonZero,
              SUM(CASE WHEN TRY_CAST(sales_qty AS float)<>0 THEN 1 ELSE 0 END) AS salesQtyNonZero,
              SUM(CASE WHEN TRY_CAST(stock_aj AS float)<>0 THEN 1 ELSE 0 END) AS stockAjNonZero,
              SUM(CASE WHEN TRY_CAST(sreturn_qty AS float)<>0 THEN 1 ELSE 0 END) AS sreturnNonZero,
              SUM(CASE WHEN TRY_CAST(preturn_qty AS float)<>0 THEN 1 ELSE 0 END) AS preturnNonZero,
              SUM(TRY_CAST(qty AS float)) AS sumQty, SUM(TRY_CAST(tot_qty AS float)) AS sumTotQty, SUM(TRY_CAST(sales_qty AS float)) AS sumSalesQty
              FROM dbo.stockdetails`),
        );

        console.log("5/5 newproduct vs stockdetails link ...");
        out.linkChecks = await safe("link checks", async () => ({
            newproductRows: (await q(pool, `SELECT COUNT(*) AS n FROM dbo.newproduct`))[0],
            stockBarcodesInNewproductBarcode: await q(pool, `SELECT COUNT(DISTINCT s.barcode) AS n FROM dbo.stockdetails s WHERE EXISTS (SELECT 1 FROM dbo.newproduct p WHERE CAST(p.barcode AS varchar(60)) = CAST(s.barcode AS varchar(60)))`).catch((e) => ({ error: e.message })),
            stockCodesInNewproductCode: await q(pool, `SELECT COUNT(DISTINCT s.code) AS n FROM dbo.stockdetails s WHERE EXISTS (SELECT 1 FROM dbo.newproduct p WHERE CAST(p.code AS varchar(60)) = CAST(s.code AS varchar(60)))`).catch((e) => ({ error: e.message })),
        }));
    } finally {
        await pool.close();
    }

    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "analysis.json");
    fs.writeFileSync(file, JSON.stringify(out, null, 2), "utf8");
    console.log(`\nDone. Report written to ${file}\nTell Claude it is ready - no need to paste anything.`);
}

main().catch((e) => {
    console.error("Analysis failed:", e.message);
    process.exit(1);
});
