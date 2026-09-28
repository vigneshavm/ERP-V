/* eslint-disable no-console */
import dotenv from "dotenv";
import { SESSION_PREFIX } from "../integrations/textilesoft/mapping.js";
import { getPool } from "../integrations/textilesoft/sqlItemSource.js";
import { shopInward, shopOutward } from "../integrations/textilesoft/sqlGstReports.js";
import { byRate, totals } from "../modules/finance/services/gstMath.js";

// Env is read lazily when the pool opens, so loading it here (after the hoisted imports) is enough.
dotenv.config();

/**
 * Read-only check of the GST figures the reports compute from the shop database, for one period.
 *   npm run check:gst -- --from 2026-08-01 --to 2026-08-31
 *
 * Compare the "Outward" block with the GST report Textilesoft prints for the same dates. If they match, the
 * GST reports can be moved from "Data validation" to "Live data" in reportRegistry.ts.
 */

const arg = (name: string, fallback: string): string => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const inr = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function raw(sql: string, from: string, to: string) {
    const req = (await getPool()).request();
    req.input("from", from);
    req.input("to", to);
    const res = await req.query(SESSION_PREFIX + sql);
    return (res ? res.recordset : []) as Record<string, unknown>[];
}

async function main() {
    const today = new Date().toISOString().slice(0, 10);
    const from = arg("from", `${today.slice(0, 7)}-01`);
    const to = arg("to", today);
    const range = `s.[date] >= CAST(@from AS date) AND s.[date] < DATEADD(day, 1, CAST(@to AS date))`;
    console.log(`GST check ${from} to ${to} (shop database, read-only)\n`);

    console.log("1. Bill status values (only '1' should mean cancelled):");
    for (const r of await raw(`SELECT ISNULL(s.[status], '<NULL>') AS v, COUNT(*) AS n FROM dbo.[sales2] AS s WHERE ${range} GROUP BY ISNULL(s.[status], '<NULL>')`, from, to)) {
        console.log(`   status ${String(r.v).padEnd(8)} ${r.n} bills`);
    }

    console.log("\n2. igstper values on bills (anything > 0 is treated as an inter-state IGST bill):");
    for (const r of await raw(`SELECT TOP 10 ISNULL(s.[igstper], '<NULL>') AS v, COUNT(*) AS n FROM dbo.[sales2] AS s WHERE ${range} GROUP BY ISNULL(s.[igstper], '<NULL>') ORDER BY COUNT(*) DESC`, from, to)) {
        console.log(`   igstper ${String(r.v).padEnd(8)} ${r.n} bills`);
    }

    console.log("\n3. Stored GST rates on bill lines (hdngst):");
    for (const r of await raw(`SELECT TOP 15 ISNULL(l.[hdngst], '<NULL>') AS v, COUNT(*) AS n FROM dbo.[sales2] AS s JOIN dbo.[salsntry] AS l ON l.[systemidbill] = s.[sysidandbill] WHERE ${range} GROUP BY ISNULL(l.[hdngst], '<NULL>') ORDER BY COUNT(*) DESC`, from, to)) {
        console.log(`   hdngst ${String(r.v).padEnd(8)} ${r.n} lines`);
    }

    const out = await shopOutward({ from, to });
    const t = totals(out.buckets);
    const lineTax = t.cgst + t.sgst + t.igst;
    console.log("\n4. Outward supplies (compare with Textilesoft's GST report for the same dates):");
    console.log(`   Live bills           ${out.bills}   (cancelled: ${out.cancelled.bills}, value ${inr(out.cancelled.value)})`);
    console.log(`   Invoice value        lines ${inr(t.value)}   bill headers ${inr(out.billValue)}`);
    console.log(`   Taxable value        ${inr(t.taxable)}`);
    console.log(`   GST                  lines ${inr(lineTax)}   bill headers (gst5..gst28) ${inr(out.headerTax)}   difference ${inr(lineTax - out.headerTax)}`);
    console.log(`   CGST / SGST / IGST   ${inr(t.cgst)} / ${inr(t.sgst)} / ${inr(t.igst)}`);
    console.log("   By rate:");
    for (const r of byRate(out.buckets)) {
        console.log(`     ${(r.rate < 0 ? "unknown" : `${r.rate}%`).padEnd(8)} taxable ${inr(r.taxable).padStart(16)}   tax ${inr(r.tax).padStart(14)}   ${r.lines} lines`);
    }
    const noHsn = out.buckets.filter((b) => !b.hsn).reduce((s, b) => s + b.lines, 0);
    console.log(`   Lines without an HSN code: ${noHsn}; HSN taken from the HSN master's group code: ${out.hsnViaGroupLines}`);
    console.log(`   Inter-state (IGST) bills: ${out.interStateBills}`);

    const inw = await shopInward({ from, to });
    const purchases = inw.rows.filter((r) => r.kind === "purchase");
    const returns = inw.rows.filter((r) => r.kind === "return");
    const pt = totals(purchases.map((r) => r.bucket));
    const rt = totals(returns.map((r) => r.bucket));
    const docs = new Set(purchases.map((r) => r.doc));
    const noGstin = new Set(purchases.filter((r) => !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(r.gstin)).map((r) => r.supplier));
    console.log("\n5. Inward supplies (GRN lines):");
    console.log(`   GRNs ${docs.size}, taxable ${inr(pt.taxable)}, GST ${inr(pt.tax)}; purchase returns: taxable ${inr(rt.taxable)}, GST ${inr(rt.tax)}${inw.returnsAvailable ? "" : " (return tables not readable)"}`);
    console.log(`   Suppliers without a valid GSTIN (their GST is not claimed as ITC): ${noGstin.size}${noGstin.size ? ` -- e.g. ${[...noGstin].slice(0, 5).join(", ")}` : ""}`);

    console.log("\nDone. Nothing was written.");
    process.exit(0);
}

main().catch((err) => {
    console.error("GST check failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
});
