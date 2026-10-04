import { listSqlExpenses } from "../../../integrations/textilesoft/sqlExpenses.js";
import {
    shopBillCosts, shopCancelledBills, shopFinanceAsOf, shopPurchases, shopSalesBills, shopTopItems, type ShopRange,
} from "../../../integrations/textilesoft/sqlFinance.js";
import { tableQuery, type TableQuery } from "../../core/services/tableQuery.js";
import {
    ENTRY_TYPE_LABEL, all, billProfit, byDay, byType, chronological, flowTotals, inflow, modeOf, outflow,
    profitTotals, round2, shopBillSplit, type BillProfit, type EntryType, type FinanceEntry, type Mode,
} from "./financeMath.js";
import { istDate, istTime, todayIst, parseISODateRange } from "../../../utils/dateUtils.js";
import { toNumber as n, toString as s } from "../../../utils/typeConversion.js";

/**
 * Financial reports: Day Book, All Transactions, Cash Flow, P&L and Bill-wise Profit.
 *
 * Sources
 *   shop database (Textilesoft)  sales bills (payment split), GRNs and purchase returns, lot costs, expenses (dbo.expenseentry)
 *   SQL only: no MongoDB. Counter bills made in the ERP are written to the same Textilesoft tables, so they are included.
 * Profit
 *   Cost = quantity × the lot's purchase rate (excl. GST). Shop lines and ERP lines of shop items use the barcode's
 *   rate from the shop database; other ERP lines use the item's cost price. Uncosted lines are left out of both sales
 *   and cost and reported as coverage (the Party P&L rule).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const sourceOf = (): "sql" => "sql";

export interface FinanceRange { from: string; to: string }

export const parseFinanceRange = (from: unknown, to: unknown): FinanceRange | null => parseISODateRange(from, to);

const whenOf = (d: unknown) => {
    const date = d instanceof Date ? d : new Date(String(d));
    return Number.isNaN(date.getTime()) ? { date: "", time: null } : { date: istDate(date), time: istTime(date) };
};

/* ------------------------------------------------------------------------------------------------ Shop entries */

interface ShopData {
    entries: FinanceEntry[];
    overpaidBills: number;
    returnsAvailable: boolean;
    asOf: string | null;
}

async function shopEntries(range: ShopRange): Promise<ShopData> {
    const [bills, purchases, asOf] = await Promise.all([shopSalesBills(range), shopPurchases(range), shopFinanceAsOf()]);
    let overpaid = 0;
    const entries: FinanceEntry[] = [];
    for (const b of bills) {
        const split = shopBillSplit(b.total, b.card, b.upi, b.creditAmt, b.self);
        if (split.overpaid) overpaid += 1;
        entries.push(inflow({ source: "shop", type: "sale", date: b.date, time: b.time, ref: b.billNo, party: b.customer, amount: round2(b.total), note: "" }, split));
    }
    for (const p of purchases.docs) {
        const base = { source: "shop" as const, date: p.date, time: null, ref: p.doc, party: p.supplier, amount: round2(p.value), note: p.payType ? `Pay type: ${p.payType}` : "" };
        if (p.kind === "purchase") {
            // A GRN's pay_type says how it was paid; unknown or credit terms mean nothing was paid yet.
            const mode: Mode = p.payType ? modeOf(p.payType) : "credit";
            entries.push(outflow({ ...base, type: "purchase" }, all(round2(p.value), mode)));
        } else {
            // How a purchase return was settled is not recorded: it reduces what is owed, not cash.
            entries.push(inflow({ ...base, type: "purchase-return", note: "Settlement not recorded" }, all(round2(p.value), "credit")));
        }
    }
    return { entries, overpaidBills: overpaid, returnsAvailable: purchases.returnsAvailable, asOf };
}

async function allEntries(_tenantId: string, range: FinanceRange) {
    const shop = await shopEntries(range);
    return { entries: [...shop.entries].sort(chronological), shop };
}

const shopChecks = (shop: ShopData) => ({
    /** Shop bills whose card/UPI/other split exceeds the bill total (capped at the total). */
    overpaidShopBills: shop.overpaidBills,
    returnsAvailable: shop.returnsAvailable,
});

/* ------------------------------------------------------------------------------------------------ Transactions */

export interface TransactionQuery extends TableQuery {
    type?: string;
    mode?: string;
    source?: string;
}

function filterEntries(list: FinanceEntry[], q: TransactionQuery): FinanceEntry[] {
    let out = list;
    if (q.type && q.type in ENTRY_TYPE_LABEL) out = out.filter((e) => e.type === q.type);
    if (q.source === "shop" || q.source === "erp") out = out.filter((e) => e.source === q.source);
    if (q.mode === "cash") out = out.filter((e) => e.cashIn > 0 || e.cashOut > 0);
    if (q.mode === "bank") out = out.filter((e) => e.bankIn > 0 || e.bankOut > 0);
    if (q.mode === "credit") out = out.filter((e) => e.credit > 0);
    return out;
}

const withLabel = (e: FinanceEntry) => ({ ...e, typeLabel: ENTRY_TYPE_LABEL[e.type] });

export async function buildTransactions(tenantId: string, range: FinanceRange, q: TransactionQuery) {
    const { entries, shop } = await allEntries(tenantId, range);
    const filtered = filterEntries(entries, q);
    const t = tableQuery(filtered, q, {
        searchIn: (e) => [e.ref, e.party, e.note, ENTRY_TYPE_LABEL[e.type]],
        sortable: {
            date: (e) => `${e.date} ${e.time ?? ""}`, ref: (e) => e.ref, party: (e) => e.party, type: (e) => ENTRY_TYPE_LABEL[e.type],
            amount: (e) => e.amount, in: (e) => e.cashIn + e.bankIn, out: (e) => e.cashOut + e.bankOut,
        },
        fallback: (a, b) => -chronological(a, b),
        tieBreak: (e) => `${e.source}:${e.type}:${e.ref}`,
    });
    const matched = t.matched;
    return {
        range,
        totals: flowTotals(matched),
        byType: byType(matched),
        items: t.items.map(withLabel),
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Day Book */

export async function buildDayBook(tenantId: string, date?: string) {
    // Default: the latest day with shop data (the restored copy lags real time), else today.
    const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ((await shopFinanceAsOf()) ?? todayIst());
    const range = { from: day, to: day };
    const { entries, shop } = await allEntries(tenantId, range);
    return {
        date: day,
        totals: flowTotals(entries),
        byType: byType(entries),
        entries: entries.map(withLabel),
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Cash Flow */

export async function buildCashFlow(tenantId: string, range: FinanceRange) {
    const { entries, shop } = await allEntries(tenantId, range);
    const moving = entries.filter((e) => e.type !== "transfer");
    const t = flowTotals(moving);
    const types = byType(moving);
    const pick = (type: EntryType) => types.find((r) => r.type === type);
    return {
        range,
        totals: t,
        inflows: types.filter((r) => r.cashIn + r.bankIn > 0).map((r) => ({ type: r.type, label: r.label, cash: r.cashIn, bank: r.bankIn, total: round2(r.cashIn + r.bankIn), entries: r.entries })),
        outflows: types.filter((r) => r.cashOut + r.bankOut > 0).map((r) => ({ type: r.type, label: r.label, cash: r.cashOut, bank: r.bankOut, total: round2(r.cashOut + r.bankOut), entries: r.entries })),
        /** Billed but not paid in the period: sales given on credit, purchases taken on credit. */
        credit: { sales: round2(pick("sale")?.credit ?? 0), purchases: round2(pick("purchase")?.credit ?? 0) },
        transfers: entries.filter((e) => e.type === "transfer").length,
        byDay: byDay(moving).map((d) => ({ date: d.date, inflow: round2(d.cashIn + d.bankIn), outflow: round2(d.cashOut + d.bankOut), net: d.net, cashNet: round2(d.cashIn - d.cashOut), bankNet: round2(d.bankIn - d.bankOut) })),
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Profit */

export interface ProfitRow extends BillProfit {
    source: "shop" | "erp";
    kind: "bill" | "return";
    id: string;
    ref: string;
    date: string;
    time: string | null;
    party: string;
    total: number;
    gst: number;
}

async function profitRows(_tenantId: string, range: FinanceRange): Promise<{ rows: ProfitRow[]; asOf: string | null }> {
    const [bills, billCosts, asOf] = await Promise.all([
        shopSalesBills(range),
        shopBillCosts(range),
        shopFinanceAsOf(),
    ]);
    const rows: ProfitRow[] = [];

    for (const b of bills) {
        const c = billCosts.get(b.id) ?? { lineValue: 0, uncosted: 0, cost: 0 };
        rows.push({ source: "shop", kind: "bill", id: b.id, ref: b.billNo, date: b.date, time: b.time, party: b.customer, total: round2(b.total), gst: round2(b.gst), ...billProfit(b.total, b.gst, c.lineValue, c.uncosted, c.cost) });
    }
    return { rows, asOf };
}

export interface BillProfitQuery extends TableQuery {
    source?: string;
    show?: string; // 'loss' | 'uncosted'
}

export async function buildBillProfit(tenantId: string, range: FinanceRange, q: BillProfitQuery) {
    const { rows, asOf } = await profitRows(tenantId, range);
    let list = rows;
    if (q.source === "shop" || q.source === "erp") list = list.filter((r) => r.source === q.source);
    if (q.show === "loss") list = list.filter((r) => r.profit < 0);
    if (q.show === "uncosted") list = list.filter((r) => r.coverage < 1);
    const t = tableQuery(list, q, {
        searchIn: (r) => [r.ref, r.party],
        sortable: {
            date: (r) => `${r.date} ${r.time ?? ""}`, ref: (r) => r.ref, party: (r) => r.party, netSales: (r) => r.netSales,
            cost: (r) => r.cost, profit: (r) => r.profit, marginPct: (r) => r.marginPct, coverage: (r) => r.coverage,
        },
        fallback: (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
        tieBreak: (r) => `${r.source}:${r.kind}:${r.id}`,
    });
    const matched = t.matched;
    return {
        range,
        summary: profitTotals(matched),
        lossBills: matched.filter((r) => r.profit < 0).length,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ P&L */

export async function buildProfitLoss(tenantId: string, range: FinanceRange) {
    const [{ rows, asOf }, expenses] = await Promise.all([
        profitRows(tenantId, range),
        listSqlExpenses().then((entries) => entries.filter((entry) => {
            const day = istDate(entry.date);
            return day >= range.from && day <= range.to;
        })),
    ]);
    const sales = rows.filter((r) => r.kind === "bill");
    const rets = rows.filter((r) => r.kind === "return");
    const overall = profitTotals(rows);

    const byCategory = new Map<string, number>();
    for (const e of expenses as Doc[]) byCategory.set(s(e.category) || "Other", (byCategory.get(s(e.category) || "Other") ?? 0) + n(e.amount));
    const expenseTotal = round2([...byCategory.values()].reduce((a, b) => a + b, 0));

    const months = [...new Set([...rows.map((r) => r.date.slice(0, 7)), ...(expenses as Doc[]).map((e) => whenOf(e.date).date.slice(0, 7))])].filter(Boolean).sort();
    const byMonth = months.map((m) => {
        const t = profitTotals(rows.filter((r) => r.date.startsWith(m)));
        const exp = round2((expenses as Doc[]).filter((e) => whenOf(e.date).date.startsWith(m)).reduce((a, e) => a + n(e.amount), 0));
        return { month: m, netSales: t.netSales, costedSales: t.costedSales, cost: t.cost, grossProfit: t.grossProfit, expenses: exp, netProfit: round2(t.grossProfit - exp) };
    });

    return {
        range,
        sales: profitTotals(sales),
        returns: profitTotals(rets),
        total: overall,
        /** Net sales whose cost is unknown: included in net sales, not in gross profit. */
        uncostedSales: round2(overall.netSales - overall.costedSales),
        expenses: { total: expenseTotal, byCategory: [...byCategory].map(([category, amount]) => ({ category, amount: round2(amount) })).sort((a, b) => b.amount - a.amount) },
        netProfit: round2(overall.grossProfit - expenseTotal),
        bySource: { shop: profitTotals(rows.filter((r) => r.source === "shop")), erp: profitTotals(rows.filter((r) => r.source === "erp")) },
        byMonth,
        asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Sales Report */

export interface SalesBillRow {
    source: "shop" | "erp";
    id: string;
    ref: string;
    date: string;
    time: string | null;
    customer: string;
    /** Bill total including GST. */
    value: number;
    gst: number;
    netSales: number;
    cash: number;
    bank: number;
    credit: number;
}

export interface SalesQuery extends TableQuery {
    source?: string;
    mode?: string; // cash | bank | credit
}

const WALK_IN = /^(walk-?in|cash customer)?$/i;

/**
 * Sales Report: live Textilesoft SQL bills, with headline totals, a day-by-day series, top customers and items,
 * and the bill list. Cancelled bills are excluded from every figure and reported separately.
 */
export async function buildSalesReport(_tenantId: string, range: FinanceRange, q: SalesQuery) {
    const [bills, cancelledShop, topShopItems, asOf] = await Promise.all([
        shopSalesBills(range),
        shopCancelledBills(range),
        shopTopItems(range, 15),
        shopFinanceAsOf(),
    ]);

    let overpaid = 0;
    const rows: SalesBillRow[] = bills.map((b) => {
        const sp = shopBillSplit(b.total, b.card, b.upi, b.creditAmt, b.self);
        if (sp.overpaid) overpaid += 1;
        return { source: "shop", id: b.id, ref: b.billNo, date: b.date, time: b.time, customer: b.customer, value: round2(b.total), gst: round2(b.gst), netSales: round2(b.total - b.gst), cash: sp.cash, bank: sp.bank, credit: sp.credit };
    });
    // Summary over every live bill (filters below only narrow the table).
    const sum = (list: SalesBillRow[], k: keyof Pick<SalesBillRow, "value" | "gst" | "netSales" | "cash" | "bank" | "credit">) => round2(list.reduce((a, r) => a + r[k], 0));
    const lastDay = asOf && asOf < range.to ? (asOf < range.from ? range.from : asOf) : range.to;
    const days = Math.max(1, Math.round((Date.parse(`${lastDay}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000) + 1);
    const value = sum(rows, "value");

    const byDayMap = new Map<string, { date: string; value: number; bills: number }>();
    for (const r of rows) {
        const d = byDayMap.get(r.date) ?? { date: r.date, value: 0, bills: 0 };
        d.value += r.value; d.bills += 1;
        byDayMap.set(r.date, d);
    }
    const byDay = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, value: round2(d.value) }));
    const best = byDay.reduce<{ date: string; value: number; bills: number } | null>((a, d) => (!a || d.value > a.value ? d : a), null);

    const customers = new Map<string, { name: string; bills: number; value: number }>();
    let walkIn = { bills: 0, value: 0 };
    for (const r of rows) {
        if (WALK_IN.test(r.customer.trim())) { walkIn = { bills: walkIn.bills + 1, value: walkIn.value + r.value }; continue; }
        const key = r.customer.trim().toUpperCase();
        const c = customers.get(key) ?? { name: r.customer.trim(), bills: 0, value: 0 };
        c.bills += 1; c.value += r.value;
        customers.set(key, c);
    }
    const topCustomers = [...customers.values()].sort((a, b) => b.value - a.value).slice(0, 10).map((c) => ({ ...c, value: round2(c.value) }));

    const items = new Map<string, { name: string; qty: number; value: number }>();
    for (const it of topShopItems) {
        const cur = items.get(it.name) ?? { name: it.name, qty: 0, value: 0 };
        cur.qty += it.qty; cur.value += it.value;
        items.set(it.name, cur);
    }
    const topItems = [...items.values()].sort((a, b) => b.value - a.value).slice(0, 10).map((i) => ({ ...i, qty: Math.round(i.qty * 1000) / 1000, value: round2(i.value) }));

    // Table
    let list = rows;
    if (q.source === "shop" || q.source === "erp") list = list.filter((r) => r.source === q.source);
    if (q.mode === "cash") list = list.filter((r) => r.cash > 0);
    if (q.mode === "bank") list = list.filter((r) => r.bank > 0);
    if (q.mode === "credit") list = list.filter((r) => r.credit > 0);
    const t = tableQuery(list, q, {
        searchIn: (r) => [r.ref, r.customer],
        sortable: { date: (r) => `${r.date} ${r.time ?? ""}`, ref: (r) => r.ref, customer: (r) => r.customer, value: (r) => r.value, netSales: (r) => r.netSales, gst: (r) => r.gst },
        fallback: (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
        tieBreak: (r) => `${r.source}:${r.id}`,
    });

    return {
        range,
        summary: {
            bills: rows.length,
            value,
            gst: sum(rows, "gst"),
            netSales: sum(rows, "netSales"),
            cash: sum(rows, "cash"),
            bank: sum(rows, "bank"),
            credit: sum(rows, "credit"),
            days,
            avgPerDay: round2(value / days),
            avgBill: rows.length ? round2(value / rows.length) : 0,
            bestDay: best,
        },
        cancelled: { bills: cancelledShop.bills, value: round2(cancelledShop.value) },
        bySource: {
            shop: { bills: rows.filter((r) => r.source === "shop").length, value: sum(rows.filter((r) => r.source === "shop"), "value") },
            erp: { bills: rows.filter((r) => r.source === "erp").length, value: sum(rows.filter((r) => r.source === "erp"), "value") },
        },
        byDay,
        topCustomers,
        walkIn: { bills: walkIn.bills, value: round2(walkIn.value) },
        topItems,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: { overpaidShopBills: overpaid },
        asOf,
        source: sourceOf(),
    };
}
