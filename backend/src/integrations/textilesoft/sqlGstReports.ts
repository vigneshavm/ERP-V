import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlStockReports.js";
import { bucketFromTaxInclusive, round2, type TaxBucket } from "../../modules/finance/services/gstMath.js";

/**
 * ITEM_DATA_SOURCE=sql: GST figures from the Textilesoft tables, read-only. Used by GstReturnService,
 * which adds the ERP's own invoices/bills and builds GSTR-1, GSTR-3B, GSTR-9 and the Purchase GST Register.
 *
 *   outward  dbo.sales2 (bill header) JOIN dbo.salsntry (bill lines) ON l.systemidbill = s.sysidandbill
 *            line value net_amount (GST-inclusive), line tax `tax`, rate `hdngst`, HSN `hsncode`
 *   inward   dbo.purentrydetails (GRN lines, live rows have STATUS NULL) with the GRN header
 *            dbo.purgrnentry (supplier, invoice date) and dbo.supplierdetail (GSTIN)
 *            line value net_amount (GST-inclusive), line tax gst_amount, rate gst_per, HSN hsncode
 *   returns  dbo.PurchaseReturnDetails / PurchaseReturnHeader (same layout as the GRN tables)
 *
 * Rules:
 *   - A bill is live unless status = '1' (cancelled). NULL status counts as live: `ISNULL(status,'') <> '1'`.
 *     A plain `status <> '1'` would silently drop NULL-status bills.
 *   - Taxable value = GST-inclusive line value − line tax, so bill-level rounding never leaks into tax.
 *   - Periods are bill dates (sales) and GRN entry dates (purchases), inclusive, as 'YYYY-MM-DD'.
 *   - A sales bill is inter-state (IGST) when sales2.igstper > 0; a GRN when purgrnentry.IGSTAmt > 0.
 *   - HSN: salsntry.hsncode sometimes holds the HSN master's group code (HSNDetails.group_cd) rather
 *     than the code itself; those are mapped through HSNDetails and counted in the checks.
 * Every figure the reports show that depends on an assumption above is also returned as a check,
 * so the screen can say how many lines were affected.
 */

type Row = Record<string, unknown>;

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
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

export interface GstRange {
    from: string;
    to: string;
}

const rangeParams = (r: GstRange): QueryParam[] => [
    { name: "from", value: r.from },
    { name: "to", value: r.to },
];
const inRange = (col: string) => `${col} >= CAST(@from AS date) AND ${col} < DATEADD(day, 1, CAST(@to AS date))`;

const LIVE_BILL = "ISNULL(s.[status], '') <> '1'";
const CANCELLED_BILL = "ISNULL(s.[status], '') = '1'";
const INTER_BILL = "ISNULL(TRY_CAST(s.[igstper] AS float), 0) > 0";
const F = (expr: string) => `ISNULL(TRY_CAST(${expr} AS float), 0)`;

/* ------------------------------------------------------------------------------------------------ HSN master */

export interface HsnMaster {
    /** HSN code → description. */
    describe: (hsn: string) => string;
    /** Raw line value → HSN code ('' when unknown), and whether it came via the group code. */
    resolve: (raw: unknown) => { code: string; viaGroup: boolean };
}

let hsnCache: { at: number; value: Promise<HsnMaster> } | undefined;

export function shopHsnMaster(): Promise<HsnMaster> {
    if (hsnCache && Date.now() - hsnCache.at < 300_000) return hsnCache.value;
    const value = optional("SELECT LTRIM(RTRIM([group_cd])) AS g, LTRIM(RTRIM([name_eng])) AS code, LTRIM(RTRIM([prin_name_eng])) AS name FROM dbo.[HSNDetails]").then(({ rows }) => {
        const byGroup = new Map<string, string>();
        const names = new Map<string, string>();
        for (const r of rows) {
            const code = str(r.code);
            if (!/^\d{4,8}$/.test(code)) continue;
            if (str(r.g)) byGroup.set(str(r.g), code);
            if (str(r.name) && !names.has(code)) names.set(code, str(r.name));
        }
        return {
            describe: (hsn: string) => names.get(hsn) ?? "",
            resolve: (raw: unknown) => {
                const s = str(raw);
                if (/^\d{4,8}$/.test(s)) return { code: s, viaGroup: false };
                const mapped = byGroup.get(s);
                return mapped ? { code: mapped, viaGroup: true } : { code: "", viaGroup: false };
            },
        };
    });
    hsnCache = { at: Date.now(), value };
    value.catch(() => { hsnCache = undefined; });
    return value;
}

/* ------------------------------------------------------------------------------------------------ Outward */

export interface ShopOutward {
    buckets: TaxBucket[];
    bills: number;
    /** Sum of bill totals (sales2.tot_netamnt) for live bills. */
    billValue: number;
    /** Sum of the per-rate GST columns on the bill header (gst5 + gst12 + gst18 + gst28). */
    headerTax: number;
    cancelled: { bills: number; value: number };
    interStateBills: number;
    /** Documents issued (GSTR-1 Table 13), one row per bill series (sales2.mode). */
    documents: { series: string; from: number; to: number; total: number; cancelled: number }[];
    hsnViaGroupLines: number;
    asOf: string | null;
}

export async function shopOutward(range: GstRange): Promise<ShopOutward> {
    const p = rangeParams(range);
    const [lines, headers, docs, hsn, asOf] = await Promise.all([
        run(
            `SELECT CONVERT(char(7), s.[date], 23) AS m, LTRIM(RTRIM(ISNULL(l.[hdngst], ''))) AS rate, LTRIM(RTRIM(ISNULL(l.[hsncode], ''))) AS hsn, ` +
                `CASE WHEN ${INTER_BILL} THEN 1 ELSE 0 END AS inter, COUNT(*) AS lines, SUM(${F("l.[qty]")}) AS qty, ` +
                `SUM(${F("l.[net_amount]")}) AS value, SUM(${F("l.[tax]")}) AS tax ` +
                `FROM dbo.[sales2] AS s JOIN dbo.[salsntry] AS l ON l.[systemidbill] = s.[sysidandbill] ` +
                `WHERE ${LIVE_BILL} AND ${inRange("s.[date]")} ` +
                `GROUP BY CONVERT(char(7), s.[date], 23), LTRIM(RTRIM(ISNULL(l.[hdngst], ''))), LTRIM(RTRIM(ISNULL(l.[hsncode], ''))), CASE WHEN ${INTER_BILL} THEN 1 ELSE 0 END`,
            p,
        ),
        run(
            `SELECT SUM(CASE WHEN ${LIVE_BILL} THEN 1 ELSE 0 END) AS bills, ` +
                `SUM(CASE WHEN ${LIVE_BILL} THEN ${F("s.[tot_netamnt]")} ELSE 0 END) AS billValue, ` +
                `SUM(CASE WHEN ${LIVE_BILL} THEN ${F("s.[gst5]")} + ${F("s.[gst12]")} + ${F("s.[gst18]")} + ${F("s.[gst28]")} ELSE 0 END) AS headerTax, ` +
                `SUM(CASE WHEN ${CANCELLED_BILL} THEN 1 ELSE 0 END) AS cancelledBills, ` +
                `SUM(CASE WHEN ${CANCELLED_BILL} THEN ${F("s.[tot_netamnt]")} ELSE 0 END) AS cancelledValue, ` +
                `SUM(CASE WHEN ${LIVE_BILL} AND ${INTER_BILL} THEN 1 ELSE 0 END) AS interBills ` +
                `FROM dbo.[sales2] AS s WHERE ${inRange("s.[date]")}`,
            p,
        ),
        run(
            `SELECT LTRIM(RTRIM(ISNULL(s.[mode], ''))) AS series, MIN(s.[billno]) AS fromNo, MAX(s.[billno]) AS toNo, COUNT(*) AS total, ` +
                `SUM(CASE WHEN ${CANCELLED_BILL} THEN 1 ELSE 0 END) AS cancelled ` +
                `FROM dbo.[sales2] AS s WHERE ${inRange("s.[date]")} GROUP BY LTRIM(RTRIM(ISNULL(s.[mode], '')))`,
            p,
        ),
        shopHsnMaster(),
        shopAsOf(),
    ]);

    let hsnViaGroupLines = 0;
    const buckets = lines.map((r) => {
        const h = hsn.resolve(r.hsn);
        if (h.viaGroup) hsnViaGroupLines += num(r.lines);
        return bucketFromTaxInclusive({
            source: "shop", month: str(r.m), storedRate: r.rate, hsn: h.code, interState: num(r.inter) === 1,
            lines: r.lines, qty: r.qty, value: r.value, tax: r.tax,
        });
    });
    const h = headers[0] ?? {};
    return {
        buckets,
        bills: num(h.bills),
        billValue: round2(num(h.billValue)),
        headerTax: round2(num(h.headerTax)),
        cancelled: { bills: num(h.cancelledBills), value: round2(num(h.cancelledValue)) },
        interStateBills: num(h.interBills),
        documents: docs
            .map((d) => ({ series: str(d.series) || "—", from: num(d.fromNo), to: num(d.toNo), total: num(d.total), cancelled: num(d.cancelled) }))
            .sort((a, b) => a.series.localeCompare(b.series, undefined, { numeric: true })),
        hsnViaGroupLines,
        asOf,
    };
}

/* ------------------------------------------------------------------------------------------------ Inward */

/** One purchase document (GRN or purchase return) at one GST rate. */
export interface ShopInwardRow {
    kind: "purchase" | "return";
    doc: string;
    /** GRN / return entry date, 'YYYY-MM-DD'. */
    date: string;
    /** Supplier's invoice date from the GRN header, when recorded. */
    invoiceDate: string | null;
    supplier: string;
    gstin: string;
    bucket: TaxBucket;
}

export interface ShopInward {
    rows: ShopInwardRow[];
    returnsAvailable: boolean;
    asOf: string | null;
}

// GRN header facts, one row per GRN number (purgrnentry can hold more than one row per GRN when re-saved).
const GRN_HEADER = (table: string) =>
    `(SELECT [grn_no] AS grn, MAX(ISNULL(NULLIF(LTRIM(RTRIM([suplier_name])), ''), 'Unknown supplier')) AS sup, ` +
    `CONVERT(varchar(10), MIN([invoce_date]), 23) AS invDate, MIN([entry_date]) AS entry, ` +
    `MAX(CASE WHEN ${F("[IGSTAmt]")} > 0 THEN 1 ELSE 0 END) AS inter FROM dbo.[${table}] GROUP BY [grn_no])`;

// Supplier GSTIN by trimmed, upper-cased name (the key the Suppliers page and Party reports use).
const SUPPLIER_GSTIN =
    `(SELECT UPPER(LTRIM(RTRIM([sup_name]))) AS nm, MAX(NULLIF(LTRIM(RTRIM([gst_number])), '')) AS gstin ` +
    `FROM dbo.[supplierdetail] WHERE NULLIF(LTRIM(RTRIM([sup_name])), '') IS NOT NULL GROUP BY UPPER(LTRIM(RTRIM([sup_name]))))`;

const inwardSql = (lines: string, header: string, liveCond: string, dateCol: string) =>
    `SELECT p.[grn_no] AS doc, CONVERT(varchar(10), ${dateCol}, 23) AS d, g.[invDate] AS invDate, g.[sup] AS sup, sg.[gstin] AS gstin, g.[inter] AS inter, ` +
    `LTRIM(RTRIM(ISNULL(p.[gst_per], ''))) AS rate, COUNT(*) AS lines, SUM(${F("p.[qty]")} + ${F("p.[fqty]")}) AS qty, ` +
    `SUM(${F("p.[net_amount]")}) AS value, SUM(${F("p.[gst_amount]")}) AS tax ` +
    `FROM dbo.[${lines}] AS p JOIN ${GRN_HEADER(header)} AS g ON g.[grn] = p.[grn_no] ` +
    `LEFT JOIN ${SUPPLIER_GSTIN} AS sg ON sg.[nm] = UPPER(g.[sup]) ` +
    `WHERE ${liveCond} AND ${inRange(dateCol)} ` +
    `GROUP BY p.[grn_no], CONVERT(varchar(10), ${dateCol}, 23), g.[invDate], g.[sup], sg.[gstin], g.[inter], LTRIM(RTRIM(ISNULL(p.[gst_per], '')))`;

export async function shopInward(range: GstRange): Promise<ShopInward> {
    const p = rangeParams(range);
    const [purchases, returns, asOf] = await Promise.all([
        run(inwardSql("purentrydetails", "purgrnentry", "p.[STATUS] IS NULL", "p.[entry_date]"), p),
        optional(inwardSql("PurchaseReturnDetails", "PurchaseReturnHeader", "1 = 1", "g.[entry]"), p),
        shopAsOf(),
    ]);

    const toRow = (kind: "purchase" | "return") => (r: Row): ShopInwardRow => {
        const date = str(r.d);
        return {
            kind,
            doc: str(r.doc),
            date,
            invoiceDate: str(r.invDate) || null,
            supplier: str(r.sup),
            gstin: str(r.gstin).toUpperCase(),
            bucket: bucketFromTaxInclusive({
                source: "shop", month: date.slice(0, 7), storedRate: r.rate, hsn: "", interState: num(r.inter) === 1,
                lines: r.lines, qty: r.qty, value: r.value, tax: r.tax,
            }),
        };
    };

    return {
        rows: [...purchases.map(toRow("purchase")), ...returns.rows.map(toRow("return"))],
        returnsAvailable: returns.ok,
        asOf,
    };
}
