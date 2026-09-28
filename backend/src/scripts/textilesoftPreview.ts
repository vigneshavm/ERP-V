/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { buildSelect, validateMapping } from "../integrations/textilesoft/mapping.js";
import { loadDbConfig, openPool, queryAll, streamRows, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";
import { transformRow } from "../integrations/textilesoft/transform.js";
import type { ShopItem } from "../integrations/textilesoft/types.js";

dotenv.config();

/**
 * Dry preview of a mapping against the real shop DB (no MongoDB involved, read-only).
 *   npm run preview:textilesoft [-- --mapping textilesoft.mapping.json]
 * Writes textilesoft-discovery/preview.json with row counts, stock sanity numbers and sample items.
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
type Row = Record<string, unknown>;
const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;
const arg = (name: string): string | undefined => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
};
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | { error: string }> {
    try {
        return await fn();
    } catch (e) {
        console.log(`  ! ${label}: ${(e as Error).message}`);
        return { error: (e as Error).message };
    }
}
const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ value: k, count: v }));

async function main() {
    const file = path.resolve(process.cwd(), arg("mapping") ?? "textilesoft.mapping.json");
    const mapping = validateMapping(JSON.parse(fs.readFileSync(file, "utf8")));
    const report: Record<string, unknown> = { generatedAt: new Date().toISOString(), mappingFile: file };
    const pool = await openPool(loadDbConfig());
    try {
        // 1) Real run of the mapping.
        console.log("1/3 running the mapping ...");
        const t0 = Date.now();
        const items: ShopItem[] = [];
        const skipped = new Map<string, number>();
        const warnings = new Map<string, number>();
        let read = 0;
        for await (const rows of streamRows(pool, buildSelect(mapping), 1000)) {
            for (const row of rows) {
                read++;
                const r = transformRow(row, mapping);
                if (!r.ok) skipped.set(r.reason.replace(/"[^"]*"/g, '"…"'), (skipped.get(r.reason.replace(/"[^"]*"/g, '"…"')) ?? 0) + 1);
                else {
                    items.push(r.item);
                    for (const w of r.warnings) warnings.set(w.replace(/"[^"]*"/g, '"…"'), (warnings.get(w.replace(/"[^"]*"/g, '"…"')) ?? 0) + 1);
                }
            }
        }
        const byCategory = new Map<string, number>();
        const names = new Set<string>();
        let dupNames = 0;
        let stockSum = 0;
        for (const it of items) {
            byCategory.set(it.category ?? "(none)", (byCategory.get(it.category ?? "(none)") ?? 0) + 1);
            if (names.has(it.name.toLowerCase())) dupNames++;
            names.add(it.name.toLowerCase());
            stockSum += it.stockQty ?? 0;
        }
        report.result = {
            seconds: (Date.now() - t0) / 1000, rowsRead: read, itemsOk: items.length, skipped: top(skipped, 10), warnings: top(warnings, 10),
            duplicateNames: dupNames, totalStockQty: Math.round(stockSum * 1000) / 1000,
            stockValueAtCost: Math.round(items.reduce((a, i) => a + (i.stockQty ?? 0) * i.costPrice, 0)),
            stockValueAtMrp: Math.round(items.reduce((a, i) => a + (i.stockQty ?? 0) * i.sellingPrice, 0)),
            categories: top(byCategory, 15),
            sampleItems: items.slice(0, 8), highestStock: [...items].sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0)).slice(0, 5),
        };

        // 2) Stock sign distribution WITHOUT the in-stock filter (how many lots go negative?).
        if (mapping.stock) {
            console.log("2/3 stock sign distribution ...");
            const wide = { ...mapping, stock: { ...mapping.stock, inStockOnly: false } };
            let pos = 0, zero = 0, neg = 0, negQty = 0, posQty = 0;
            for await (const rows of streamRows(pool, buildSelect(wide), 2000)) {
                for (const r of rows) {
                    const v = Number(r.stockQty);
                    if (v > 0) { pos++; posQty += v; } else if (v === 0) zero++; else { neg++; negQty += v; }
                }
            }
            report.stockSigns = { positiveLots: pos, zeroLots: zero, negativeLots: neg, positiveQty: posQty, negativeQty: negQty };
        }

        // 3) Which sales rows count? (status flags, blank barcodes, barcodes with no purchase lot)
        console.log("3/3 sales diagnostics ...");
        const flag = (table: string, col: string) => safe(`${table}.${col}`, () => q(pool, `SELECT ${col} AS v, COUNT(*) AS n, SUM(TRY_CAST(qty AS float)) AS qty FROM dbo.${table} GROUP BY ${col} ORDER BY COUNT(*) DESC`));
        report.salesFlags = {
            "salsntry.status": await flag("salsntry", "status"),
            "salsntry.BillStatus": await flag("salsntry", "BillStatus"),
            "salsntry.edit_status": await flag("salsntry", "edit_status"),
            "salsntry.bil_cl_qty": await flag("salsntry", "bil_cl_qty"),
            "superbill1.status": await flag("superbill1", "status"),
            "superbill1.BillStatus": await flag("superbill1", "BillStatus"),
        };
        report.salesHeaderFlags = await safe("sales2 flags", () => q(pool, `SELECT status AS v, SBillStatus AS s, CASE WHEN cancel_bilno IS NULL OR cancel_bilno='' THEN 'no' ELSE 'yes' END AS cancelled, COUNT(*) AS n FROM dbo.sales2 GROUP BY status, SBillStatus, CASE WHEN cancel_bilno IS NULL OR cancel_bilno='' THEN 'no' ELSE 'yes' END ORDER BY COUNT(*) DESC`));
        report.blankBarcodeSales = await safe("blank barcode", () => q(pool, `SELECT SUM(TRY_CAST(qty AS float)) AS qty, COUNT(*) AS lines FROM dbo.salsntry WHERE barcode IS NULL OR LTRIM(RTRIM(barcode)) = ''`));
        report.soldButNoLot = await safe("sold no lot", () => q(pool, `SELECT COUNT(DISTINCT s.barcode) AS barcodes, SUM(TRY_CAST(s.qty AS float)) AS qty FROM dbo.salsntry s WHERE s.barcode <> '' AND NOT EXISTS (SELECT 1 FROM dbo.stockdetails d WHERE d.barcode = s.barcode)`));
        report.superbillOverlap = await safe("superbill overlap", () => q(pool, `SELECT COUNT(*) AS superbillLines, SUM(CASE WHEN EXISTS (SELECT 1 FROM dbo.salsntry s WHERE s.cmny_bill = b.cmny_bill AND s.barcode = b.barcode AND s.srl_no = b.srl_no) THEN 1 ELSE 0 END) AS alsoInSalsntry FROM dbo.superbill1 b`));
        report.dateRanges = await safe("date ranges", () => q(pool, `SELECT (SELECT MIN(date) FROM dbo.salsntry) AS salsntryFrom, (SELECT MAX(date) FROM dbo.salsntry) AS salsntryTo, (SELECT MIN(date) FROM dbo.superbill1) AS superbillFrom, (SELECT MAX(date) FROM dbo.superbill1) AS superbillTo`));
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, "preview.json");
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nDone. Report written to ${out}\nTell Claude it is ready.`);
}

main().catch((e) => {
    console.error("Preview failed:", e.message);
    process.exit(1);
});
