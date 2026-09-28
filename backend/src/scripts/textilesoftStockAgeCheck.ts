/* eslint-disable no-console */
import { parseArgs } from "util";
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import Item from "../modules/inventory/models/Item.js";
import { SESSION_PREFIX, buildItemsDerived } from "../integrations/textilesoft/mapping.js";
import { closeSqlItemSource, getMapping, getPool } from "../integrations/textilesoft/sqlItemSource.js";
import { sqlStockAgeBuckets } from "../integrations/textilesoft/sqlStockReports.js";

dotenv.config();

/**
 * Verifies the Aged Stock month-bucket report against the shop database (read-only).
 *   npm run check:stock-age -- --tenant <tenantId>
 *
 *   1. One barcode = one purchase?  (purentrydetails rows per barcode)
 *   2. Bucket totals add up to the report total (every in-stock lot counted once, no cap)
 *   3. Shop stock vs report stock (difference = ERP-side movements)
 *   4. Report stock vs the MongoDB mirror for the same barcodes
 *   5. Two oldest lots per bucket, to check by hand in Textilesoft
 */
async function main() {
    const { values } = parseArgs({ options: { tenant: { type: "string" } } });
    if (!values.tenant) throw new Error("--tenant <tenantId> is required");
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
    await mongoose.connect(process.env.MONGO_URI);
    const pool = await getPool();
    const sql = async (text: string, params: { name: string; value: unknown }[] = []) => {
        const req = pool.request();
        for (const p of params) req.input(p.name, p.value);
        const res = await req.query(SESSION_PREFIX + text);
        return res ? res.recordset : [];
    };
    let failed = false;

    try {
        // 1. One barcode = one purchase
        const [dup] = await sql(
            "SELECT COUNT(*) AS barcodes, ISNULL(SUM(n), 0) AS rowsTotal FROM (SELECT [barcode], COUNT(*) AS n FROM dbo.[purentrydetails] WHERE [STATUS] IS NULL GROUP BY [barcode] HAVING COUNT(*) > 1) AS d",
        );
        const dupCount = Number(dup?.barcodes ?? 0);
        console.log(`\n1. Barcodes with more than one purchase row: ${dupCount}`);
        if (dupCount > 0) {
            const ex = await sql(
                "SELECT TOP 10 [barcode], COUNT(*) AS n, CONVERT(varchar(10), MIN([entry_date]), 23) AS first, CONVERT(varchar(10), MAX([entry_date]), 23) AS last " +
                "FROM dbo.[purentrydetails] WHERE [STATUS] IS NULL GROUP BY [barcode] HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC",
            );
            console.table(ex);
            console.log("   -> These lots are aged from their EARLIEST entry. Check whether they are re-used barcodes.");
        } else {
            console.log("   OK: one barcode = one purchase holds.");
        }

        // 2. Buckets reconcile with the total
        const report = await sqlStockAgeBuckets(values.tenant, { refresh: "1", limit: "200" });
        if (!report.asOf) throw new Error("No sales in the shop data (asOf is empty)");
        console.log(`\n2. Report as of ${report.asOf}`);
        console.table(report.buckets.map((b: any) => ({ bucket: b.label, months: b.range, lots: b.lots, qty: b.qty, value: b.value })));
        const sumQty = report.buckets.reduce((a: number, b: any) => a + b.qty, 0);
        const sumLots = report.buckets.reduce((a: number, b: any) => a + b.lots, 0);
        const qtyOk = Math.abs(sumQty - report.totals.qty) < 0.01;
        const lotsOk = sumLots === report.totals.lots;
        console.log(`   Sum of buckets: ${sumLots} lots / ${sumQty.toFixed(3)} qty  vs  total: ${report.totals.lots} lots / ${report.totals.qty} qty  -> ${qtyOk && lotsOk ? "OK" : "MISMATCH"}`);
        if (!qtyOk || !lotsOk) failed = true;

        // 3. Shop stock vs report stock
        const derived = buildItemsDerived(getMapping());
        const [shop] = await sql(
            `SELECT COUNT(*) AS lots, ISNULL(SUM(TRY_CAST(it.[stockQty] AS float)), 0) AS qty FROM (${derived.text}) AS it WHERE TRY_CAST(it.[stockQty] AS float) > 0`,
            derived.params,
        );
        const shopQty = Number(shop?.qty ?? 0);
        console.log(`\n3. Shop DB in-stock: ${shop?.lots} lots / ${shopQty.toFixed(3)} qty   Report (shop + ERP): ${report.totals.lots} lots / ${report.totals.qty} qty`);
        console.log(`   Difference ${(report.totals.qty - shopQty).toFixed(3)} qty = stock moved in the ERP (sales/returns/adjustments not in Textilesoft).`);

        // 4. Report vs Mongo mirror, for the first 200 lots of every bucket
        const rows: any[] = [];
        for (const b of report.buckets) {
            if (b.lots === 0) continue;
            const page = await sqlStockAgeBuckets(values.tenant, { bucket: b.key, limit: "200" });
            rows.push(...page.items);
        }
        const docs: any[] = await Item.find({ tenantId: new Types.ObjectId(values.tenant), barcode: { $in: rows.map((r) => r.barcode) } }, { barcode: 1, stockQty: 1 }).lean();
        const mongoQty = new Map(docs.map((d) => [String(d.barcode), Number(d.stockQty) || 0]));
        const mirrored = rows.filter((r) => mongoQty.has(r.barcode));
        const mismatched = mirrored.filter((r) => Math.abs((mongoQty.get(r.barcode) ?? 0) - r.remainingQty) > 0.001);
        console.log(`\n4. Mongo mirror check: ${rows.length} lots sampled, ${mirrored.length} mirrored, ${mismatched.length} with different stock`);
        if (mismatched.length) {
            console.table(mismatched.slice(0, 10).map((r) => ({ barcode: r.barcode, report: r.remainingQty, mongo: mongoQty.get(r.barcode) })));
            console.log("   -> Mirror is refreshed on read; run `npm run mirror:textilesoft -- --tenant <id>` and re-check before treating this as a bug.");
        }

        // 5. Spot checks
        console.log("\n5. Oldest two lots per bucket (verify purchase date and stock in Textilesoft):");
        const spot: any[] = [];
        for (const b of report.buckets) {
            for (const r of rows.filter((x) => x.bucket === b.key).slice(0, 2)) {
                spot.push({ bucket: b.label, barcode: r.barcode, name: r.name.slice(0, 30), purchased: r.purchaseDate, supplier: r.supplier.slice(0, 20), bought: r.purchasedQty, sold: r.soldQty, returned: r.returnedQty, unsold: r.remainingQty });
            }
        }
        console.table(spot);
    } finally {
        await closeSqlItemSource();
        await mongoose.disconnect();
    }
    if (failed) {
        console.log("\nRESULT: reconciliation FAILED");
        process.exitCode = 1;
    } else {
        console.log("\nRESULT: reconciliation OK");
    }
}

main().catch((e) => {
    console.error("Stock age check failed:", e instanceof Error ? e.message : e);
    process.exit(1);
});
