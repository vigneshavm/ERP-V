/* eslint-disable no-console */
import dotenv from "dotenv";
import { SESSION_PREFIX } from "../integrations/textilesoft/mapping.js";
import { getPool } from "../integrations/textilesoft/sqlItemSource.js";
import { shopBillCosts, shopPurchases, shopSalesBills } from "../integrations/textilesoft/sqlFinance.js";
import { billProfit, profitTotals, shopBillSplit } from "../modules/finance/services/financeMath.js";

// Env is read lazily when the pool opens, so loading it here (after the hoisted imports) is enough.
dotenv.config();

/**
 * Read-only check of the shop-database side of the financial reports, for one period.
 *   npm run check:finance -- --from 2026-08-01 --to 2026-08-31
 *
 * Compare the sales and payment totals with Textilesoft's own daily collection / sales summary for the same dates,
 * and the gross profit with its profit report. If they match, the financial reports can be moved from
 * "Data validation" to "Live data" in reportRegistry.ts.
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
    const F = (c: string) => `ISNULL(SUM(TRY_CAST(s.[${c}] AS float)), 0)`;
    console.log(`Finance check ${from} to ${to} (shop database, read-only)\n`);

    const [p] = await raw(
        `SELECT COUNT(*) AS bills, ${F("tot_netamnt")} AS total, ${F("s_recevied_cashamt")} AS cashRecorded, ${F("s_card_amt")} AS card, ` +
            `${F("s_googlepay")} AS upi, ${F("s_credit_amt")} AS creditAmt, ${F("s_selfamt")} AS self FROM dbo.[sales2] AS s WHERE ISNULL(s.[status], '') <> '1' AND ${range}`,
        from, to,
    );
    console.log("1. Payment columns on live bills (as stored):");
    for (const [k, v] of Object.entries(p)) console.log(`   ${k.padEnd(14)} ${typeof v === "number" && k !== "bills" ? inr(v) : v}`);

    const bills = await shopSalesBills({ from, to });
    let cash = 0, bank = 0, overpaid = 0;
    for (const b of bills) {
        const sp = shopBillSplit(b.total, b.card, b.upi, b.creditAmt, b.self);
        cash += sp.cash; bank += sp.bank; if (sp.overpaid) overpaid += 1;
    }
    console.log("\n2. Split the reports use (cash = bill total minus card, UPI, s_credit_amt and s_selfamt):");
    console.log(`   cash ${inr(cash)}   bank ${inr(bank)}   bills whose split exceeds the total: ${overpaid}`);
    console.log(`   s_recevied_cashamt totals ${inr(Number(p.cashRecorded))}; a large gap suggests it holds the tendered amount (with change).`);

    console.log("\n3. GRN pay_type values (CASH = paid when received; anything else is treated as not yet paid):");
    for (const r of await raw(
        `SELECT UPPER(LTRIM(RTRIM(ISNULL(g.[pay_type], '')))) AS v, COUNT(DISTINCT g.[grn_no]) AS n FROM dbo.[purgrnentry] AS g ` +
            `WHERE g.[entry_date] >= CAST(@from AS date) AND g.[entry_date] < DATEADD(day, 1, CAST(@to AS date)) GROUP BY UPPER(LTRIM(RTRIM(ISNULL(g.[pay_type], ''))))`,
        from, to,
    )) console.log(`   ${String(r.v || "<blank>").padEnd(10)} ${r.n} GRNs`);
    const purchases = await shopPurchases({ from, to });
    const pv = purchases.docs.filter((d) => d.kind === "purchase").reduce((a, d) => a + d.value, 0);
    console.log(`   GRN value in period (GST-inclusive lines): ${inr(pv)}`);

    const costs = await shopBillCosts({ from, to });
    const t = profitTotals(bills.map((b) => {
        const c = costs.get(b.id) ?? { lineValue: 0, uncosted: 0, cost: 0 };
        return billProfit(b.total, b.gst, c.lineValue, c.uncosted, c.cost);
    }));
    console.log("\n4. Gross profit (Party P&L rule: qty × lot purchase rate; uncosted lines left out):");
    console.log(`   net sales ${inr(t.netSales)}   costed ${inr(t.costedSales)} (${t.coveragePct}%)   cost ${inr(t.cost)}   gross profit ${inr(t.grossProfit)}   margin ${t.marginPct ?? "—"}%`);

    console.log("\nDone. Nothing was written.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Finance check failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
});
