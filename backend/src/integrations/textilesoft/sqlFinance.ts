import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlStockReports.js";

/**
 * ITEM_DATA_SOURCE=sql: money movements and cost of goods from the Textilesoft tables, read-only. Used by
 * FinanceReportService (Day Book, All Transactions, Cash Flow, P&L, Bill-wise Profit).
 *
 *   sales      dbo.sales2 (bill header: total, GST, payment split, date/time) + dbo.salsntry (lines: barcode, qty, value)
 *   purchases  dbo.purentrydetails (live GRN lines: STATUS NULL) + dbo.purgrnentry (supplier, pay_type)
 *   returns    dbo.PurchaseReturnDetails + dbo.PurchaseReturnHeader
 *   cost       dbo.stockdetails.prate per barcode (one barcode = one purchase lot, so it is that lot's cost, excl. GST)
 *
 * A bill is live unless status = '1' (NULL counts as live). The shop database keeps no expenses, supplier payments
 * or cash book: those come from the ERP (MongoDB) only.
 */

type Row = Record<string, unknown>;

const num = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const str = (v: unknown): string => String(v ?? "").trim();

async function run(text: string, params: QueryParam[] = []): Promise<Row[]> {
    const req = (await getPool()).request();
    for (const p of params) req.input(p.name, p.value);
    const res = await req.query(SESSION_PREFIX + text);
    return res ? res.recordset : [];
}

async function optional(text: string, params: QueryParam[] = []): Promise<{ ok: boolean; rows: Row[] }> {
    try {
        return { ok: true, rows: await run(text, params) };
    } catch {
        return { ok: false, rows: [] };
    }
}

export interface ShopRange { from: string; to: string }

const rangeParams = (r: ShopRange): QueryParam[] => [{ name: "from", value: r.from }, { name: "to", value: r.to }];
const inRange = (col: string) => `${col} >= CAST(@from AS date) AND ${col} < DATEADD(day, 1, CAST(@to AS date))`;
const F = (expr: string) => `ISNULL(TRY_CAST(${expr} AS float), 0)`;
const LIVE_BILL = "ISNULL(s.[status], '') <> '1'";

/* ------------------------------------------------------------------------------------------------ Cost map */

const COST_TTL_MS = 120_000;
let costCache: { at: number; value: Promise<Map<string, number>> } | undefined;

/** Barcode → purchase rate (excl. GST) of its lot. Cached: one pass over stockdetails every two minutes at most. */
export function shopBarcodeCosts(): Promise<Map<string, number>> {
    if (costCache && Date.now() - costCache.at < COST_TTL_MS) return costCache.value;
    const value = run(`SELECT [barcode] AS bc, MAX(NULLIF(TRY_CAST([prate] AS float), 0)) AS prate FROM dbo.[stockdetails] GROUP BY [barcode]`).then((rows) => {
        const map = new Map<string, number>();
        for (const r of rows) {
            const bc = str(r.bc);
            const p = num(r.prate);
            if (bc && p > 0) map.set(bc, p);
        }
        return map;
    });
    costCache = { at: Date.now(), value };
    value.catch(() => { costCache = undefined; });
    return value;
}

/* ------------------------------------------------------------------------------------------------ Sales */

export interface ShopBill {
    id: string;
    billNo: string;
    date: string;
    time: string | null;
    customer: string;
    total: number;
    gst: number;
    card: number;
    upi: number;
    creditAmt: number;
    self: number;
}

export interface ShopBillCost {
    /** Sum of GST-inclusive line values. */
    lineValue: number;
    /** Line value whose barcode has no purchase rate. */
    uncosted: number;
    cost: number;
}

export async function shopSalesBills(range: ShopRange): Promise<ShopBill[]> {
    const rows = await run(
        `SELECT s.[sysidandbill] AS id, s.[billno] AS billno, LTRIM(RTRIM(ISNULL(s.[mode], ''))) AS series, CONVERT(varchar(10), s.[date], 23) AS d, ` +
            `CONVERT(varchar(5), s.[datetime], 108) AS t, NULLIF(LTRIM(RTRIM(s.[cus_name])), '') AS name, NULLIF(NULLIF(LTRIM(RTRIM(s.[cus_card])), ''), '0') AS card, ` +
            `${F("s.[tot_netamnt]")} AS total, ${F("s.[gst5]")} + ${F("s.[gst12]")} + ${F("s.[gst18]")} + ${F("s.[gst28]")} AS gst, ` +
            `${F("s.[s_card_amt]")} AS cardAmt, ${F("s.[s_googlepay]")} AS upi, ${F("s.[s_credit_amt]")} AS creditAmt, ${F("s.[s_selfamt]")} AS selfAmt ` +
            `FROM dbo.[sales2] AS s WHERE ${LIVE_BILL} AND ${inRange("s.[date]")}`,
        rangeParams(range),
    );
    return rows.map((r) => ({
        id: str(r.id),
        billNo: `${str(r.series)}${str(r.billno)}`,
        date: str(r.d),
        time: str(r.t) || null,
        customer: str(r.name) || (str(r.card) ? `Card ${str(r.card)}` : "Walk-in"),
        total: num(r.total),
        gst: num(r.gst),
        card: num(r.cardAmt),
        upi: num(r.upi),
        creditAmt: num(r.creditAmt),
        self: num(r.selfAmt),
    }));
}

/** Per bill id: line value, uncosted value and cost (qty × lot purchase rate). */
export async function shopBillCosts(range: ShopRange): Promise<Map<string, ShopBillCost>> {
    const [lines, costs] = await Promise.all([
        run(
            `SELECT l.[systemidbill] AS id, LTRIM(RTRIM(ISNULL(l.[barcode], ''))) AS bc, SUM(${F("l.[qty]")}) AS qty, SUM(${F("l.[net_amount]")}) AS value ` +
                `FROM dbo.[sales2] AS s JOIN dbo.[salsntry] AS l ON l.[systemidbill] = s.[sysidandbill] ` +
                `WHERE ${LIVE_BILL} AND ${inRange("s.[date]")} GROUP BY l.[systemidbill], LTRIM(RTRIM(ISNULL(l.[barcode], '')))`,
            rangeParams(range),
        ),
        shopBarcodeCosts(),
    ]);
    const out = new Map<string, ShopBillCost>();
    for (const r of lines) {
        const id = str(r.id);
        const c = out.get(id) ?? { lineValue: 0, uncosted: 0, cost: 0 };
        const value = num(r.value);
        const prate = costs.get(str(r.bc));
        c.lineValue += value;
        if (prate === undefined) c.uncosted += value;
        else c.cost += num(r.qty) * prate;
        out.set(id, c);
    }
    return out;
}

/** Cancelled bills (status = '1') in the period: count and value. */
export async function shopCancelledBills(range: ShopRange): Promise<{ bills: number; value: number }> {
    const [r] = await run(
        `SELECT COUNT(*) AS bills, ISNULL(SUM(${F("s.[tot_netamnt]")}), 0) AS value FROM dbo.[sales2] AS s WHERE ISNULL(s.[status], '') = '1' AND ${inRange("s.[date]")}`,
        rangeParams(range),
    );
    return { bills: num(r?.bills), value: num(r?.value) };
}

/** Best-selling items by value on live bills (line name as billed, GST-inclusive value). */
export async function shopTopItems(range: ShopRange, limit = 10): Promise<{ name: string; qty: number; value: number }[]> {
    const top = Math.max(1, Math.min(50, Math.floor(limit)));
    const rows = await run(
        `SELECT TOP (${top}) UPPER(LTRIM(RTRIM(ISNULL(l.[p_name], '')))) AS name, SUM(${F("l.[qty]")}) AS qty, SUM(${F("l.[net_amount]")}) AS value ` +
            `FROM dbo.[sales2] AS s JOIN dbo.[salsntry] AS l ON l.[systemidbill] = s.[sysidandbill] ` +
            `WHERE ${LIVE_BILL} AND ${inRange("s.[date]")} AND NULLIF(LTRIM(RTRIM(l.[p_name])), '') IS NOT NULL ` +
            `GROUP BY UPPER(LTRIM(RTRIM(ISNULL(l.[p_name], '')))) ORDER BY SUM(${F("l.[net_amount]")}) DESC`,
        rangeParams(range),
    );
    return rows.map((r) => ({ name: str(r.name), qty: num(r.qty), value: num(r.value) }));
}

/* ------------------------------------------------------------------------------------------------ Purchases */

export interface ShopPurchaseDoc {
    kind: "purchase" | "return";
    doc: string;
    date: string;
    supplier: string;
    /** GST-inclusive value of the live lines. */
    value: number;
    gst: number;
    /** GRN header pay_type (e.g. CASH), '' when not recorded. */
    payType: string;
}

const purchaseSql = (lines: string, header: string, live: string, dateExpr: string) =>
    `SELECT p.[grn_no] AS doc, CONVERT(varchar(10), MIN(${dateExpr}), 23) AS d, MAX(g.[sup]) AS sup, MAX(g.[pay]) AS pay, ` +
    `SUM(${F("p.[net_amount]")}) AS value, SUM(${F("p.[gst_amount]")}) AS gst ` +
    `FROM dbo.[${lines}] AS p JOIN (SELECT [grn_no] AS grn, MAX(ISNULL(NULLIF(LTRIM(RTRIM([suplier_name])), ''), 'Unknown supplier')) AS sup, ` +
    `MAX(UPPER(LTRIM(RTRIM(ISNULL([pay_type], ''))))) AS pay, MIN([entry_date]) AS entry FROM dbo.[${header}] GROUP BY [grn_no]) AS g ON g.[grn] = p.[grn_no] ` +
    `WHERE ${live} AND ${inRange(dateExpr)} GROUP BY p.[grn_no]`;

export async function shopPurchases(range: ShopRange): Promise<{ docs: ShopPurchaseDoc[]; returnsAvailable: boolean }> {
    const p = rangeParams(range);
    const [grns, rets] = await Promise.all([
        run(purchaseSql("purentrydetails", "purgrnentry", "p.[STATUS] IS NULL", "p.[entry_date]"), p),
        optional(purchaseSql("PurchaseReturnDetails", "PurchaseReturnHeader", "1 = 1", "g.[entry]"), p),
    ]);
    const map = (kind: "purchase" | "return") => (r: Row): ShopPurchaseDoc => ({
        kind, doc: str(r.doc), date: str(r.d), supplier: str(r.sup), value: num(r.value), gst: num(r.gst), payType: str(r.pay),
    });
    return { docs: [...grns.map(map("purchase")), ...rets.rows.map(map("return"))], returnsAvailable: rets.ok };
}

/** Latest date with a sale in the shop data. */
export const shopFinanceAsOf = shopAsOf;
