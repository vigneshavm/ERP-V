/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Second, focused read-only analysis: how is on-hand stock really tracked (purchase lots vs sales)?
 *   npm run analyze:textilesoft:stock   ->  textilesoft-discovery/analysis-stock.json
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
const clip = (row: Row): Row =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && v.length > 60 ? v.slice(0, 60) + "…" : v instanceof Date ? v.toISOString() : v]));

async function sample(pool: ShopDbPool, table: string) {
    const cols = await q(pool, `SELECT COLUMN_NAME AS name, DATA_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='${table}' ORDER BY ORDINAL_POSITION`);
    const rows = await q(pool, `SELECT TOP 5 * FROM dbo.[${table}] ORDER BY 1 DESC`);
    const used = cols.filter((c) => rows.some((r) => r[String(c.name)] !== null && r[String(c.name)] !== "" && r[String(c.name)] !== undefined)).map((c) => c.name);
    const trimmed = rows.map((r) => Object.fromEntries(used.map((k) => [String(k), clip(r)[String(k)]])));
    return { columns: cols.map((c) => `${c.name}:${c.type}`), rows: trimmed };
}

const lot = (table: string) => `(SELECT barcode, SUM(TRY_CAST(qty AS float)) AS q FROM dbo.[${table}] GROUP BY barcode)`;

async function main() {
    const pool = await openPool(loadDbConfig());
    try {
        console.log("1/4 sampling ledger tables ...");
        const samples: Record<string, unknown> = {};
        for (const t of ["purentrydetails", "salsntry", "superbill1", "salsntryReturn", "purretrun", "sales2", "purgrnentry"]) {
            samples[t] = await safe(`sample ${t}`, () => sample(pool, t));
        }
        out.samples = samples;

        console.log("2/4 stockdetails qty distribution ...");
        out.stockQtyDistribution = await safe("distribution", () =>
            q(pool, `SELECT COUNT(*) AS lots, SUM(CASE WHEN TRY_CAST(qty AS float)>0 THEN 1 ELSE 0 END) AS qtyPositive,
              SUM(CASE WHEN TRY_CAST(qty AS float)=0 THEN 1 ELSE 0 END) AS qtyZero, SUM(CASE WHEN TRY_CAST(qty AS float)<0 THEN 1 ELSE 0 END) AS qtyNegative,
              SUM(CASE WHEN TRY_CAST(qty AS float) IS NULL THEN 1 ELSE 0 END) AS qtyNotNumber,
              SUM(TRY_CAST(qty AS float)) AS sumQty FROM dbo.stockdetails`),
        );

        console.log("3/4 stockdetails vs purchases ...");
        out.stockVsPurchases = await safe("stock vs purchases", () =>
            q(pool, `SELECT COUNT(*) AS matchedLots, SUM(CASE WHEN s.q < p.q THEN 1 ELSE 0 END) AS stockLower, SUM(CASE WHEN s.q = p.q THEN 1 ELSE 0 END) AS stockEqual,
              SUM(CASE WHEN s.q > p.q THEN 1 ELSE 0 END) AS stockHigher, SUM(s.q) AS sumStock, SUM(p.q) AS sumPurchased
              FROM ${lot("stockdetails")} s JOIN ${lot("purentrydetails")} p ON p.barcode = s.barcode`),
        );
        out.purchaseBarcodesNotInStock = await safe("purchase not in stock", () =>
            q(pool, `SELECT COUNT(*) AS n, SUM(p.q) AS purchasedQty FROM ${lot("purentrydetails")} p WHERE NOT EXISTS (SELECT 1 FROM dbo.stockdetails s WHERE s.barcode = p.barcode)`),
        );

        console.log("4/4 sales vs stock reconciliation ...");
        out.salesTotals = await safe("sales totals", () => q(pool, `SELECT COUNT(DISTINCT barcode) AS barcodesSold, SUM(TRY_CAST(qty AS float)) AS soldQty, COUNT(*) AS lines FROM dbo.salsntry`));
        out.reconcile = await safe("reconcile", () =>
            q(pool, `SELECT COUNT(*) AS lots,
              SUM(CASE WHEN ABS(s.q - (p.q - ISNULL(l.q,0))) < 0.001 THEN 1 ELSE 0 END) AS stockEqualsPurchasedMinusSold,
              SUM(CASE WHEN ABS(s.q - p.q) < 0.001 THEN 1 ELSE 0 END) AS stockEqualsPurchased,
              SUM(CASE WHEN l.q IS NOT NULL THEN 1 ELSE 0 END) AS lotsWithSales,
              SUM(p.q) AS purchased, SUM(ISNULL(l.q,0)) AS sold, SUM(s.q) AS stockQty, SUM(p.q - ISNULL(l.q,0)) AS purchasedMinusSold
              FROM ${lot("stockdetails")} s JOIN ${lot("purentrydetails")} p ON p.barcode = s.barcode LEFT JOIN ${lot("salsntry")} l ON l.barcode = s.barcode`),
        );
        out.reconcileExamples = await safe("examples", () =>
            q(pool, `SELECT TOP 15 s.barcode, s.q AS stockQty, p.q AS purchasedQty, l.q AS soldQty
              FROM ${lot("stockdetails")} s JOIN ${lot("purentrydetails")} p ON p.barcode = s.barcode JOIN ${lot("salsntry")} l ON l.barcode = s.barcode ORDER BY l.q DESC`),
        );
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "analysis-stock.json");
    fs.writeFileSync(file, JSON.stringify(out, null, 2), "utf8");
    console.log(`\nDone. Report written to ${file}\nTell Claude it is ready.`);
}

main().catch((e) => {
    console.error("Analysis failed:", e.message);
    process.exit(1);
});
