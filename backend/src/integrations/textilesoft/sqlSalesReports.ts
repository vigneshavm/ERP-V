import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlStockReports.js";
import MasterEntry from "../../modules/masters/models/MasterEntry.js";

/**
 * ITEM_DATA_SOURCE=sql: sales report breakdowns (brand, category, counter, salesCounter, hour) straight from the Textilesoft
 * bill tables, read-only. Periods are counted back from the newest sale in the data (`asOf`), so a restored
 * backup still fills the reports. Table/column names are fixed identifiers; values are bound parameters.
 */

type Row = Record<string, unknown>;
export type SalesReportDim = "brand" | "category" | "counter" | "salesCounter" | "hour" | "day" | "product";
export type SalesReportRange = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number): number => Math.round(n * 100) / 100;
const validDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const addDays = (isoDate: string, days: number): string => {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

async function run(text: string, params: QueryParam[]): Promise<Row[]> {
    const req = (await getPool()).request();
    for (const p of params) req.input(p.name, p.value);
    const res = await req.query(SESSION_PREFIX + text);
    return res ? res.recordset : [];
}

export function isSalesReportDim(v: unknown): v is SalesReportDim {
    return (
        v === "brand" || v === "category" || v === "counter" || v === "salesCounter" || v === "hour" || v === "day" || v === "product"
    );
}

// ---------------------------------------------------------------------------------------------
// Barcode -> catalogue name/brand, cached in memory. The brand/product dimensions used to LEFT JOIN
// a "SELECT barcode, MAX(brand/pname) FROM stockdetails GROUP BY barcode" subquery straight into
// the per-request query -- that subquery has no date filter, so it re-scans and re-aggregates the
// ENTIRE stockdetails table (tens of thousands of rows) on every single report call, regardless of
// how narrow the requested date range is. Combined with a small connection pool already under
// pressure from the background catalogue mirror (see shopDbReader.ts), that extra full-table pass
// was enough to push wide-range brand/product queries past their turn waiting for a pool
// connection, which surfaces as "operation timed out" -- caught and silently presented as an empty
// report (see sqlStatusDebug's comment / logs/combined.log around the "[sql-reports] shop sales
// report failed" lines). Caching this lookup means the expensive full-table pass happens at most
// once every CATALOG_TTL_MS, and every report call after that is a cheap in-memory map lookup.
interface CatalogEntry {
    pname: string;
    brand: string;
}
const CATALOG_TTL_MS = 120_000;
let catalogCache: { at: number; value: Map<string, CatalogEntry> } | undefined;

async function barcodeCatalog(): Promise<Map<string, CatalogEntry>> {
    if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.value;
    const data = await run(`SELECT [barcode] AS bc, MAX([pname]) AS pname, MAX([brand]) AS brand FROM dbo.[stockdetails] GROUP BY [barcode]`, []);
    const value = new Map<string, CatalogEntry>();
    for (const r of data) {
        const bc = String(r.bc ?? "").trim();
        if (!bc) continue;
        value.set(bc, { pname: String(r.pname ?? "").trim(), brand: String(r.brand ?? "").trim() });
    }
    catalogCache = { at: Date.now(), value };
    return value;
}

/** Sums per-barcode SQL rows into per-display-name totals, preferring the catalogue name over the line's own free-text fallback. */
function aggregateByCatalogName(
    data: Row[],
    catalog: Map<string, CatalogEntry>,
    catalogField: "pname" | "brand",
    otherLabel: string,
): { name: string; revenue: number; count: number; items: number }[] {
    const byName = new Map<string, { revenue: number; count: number; items: number }>();
    for (const r of data) {
        const bc = String(r.bc ?? "").trim();
        const catalogName = catalog.get(bc)?.[catalogField];
        const fallback = String(r.fallback ?? "").trim();
        const name = (catalogName && catalogName.length > 0 ? catalogName : fallback) || otherLabel;
        const cur = byName.get(name) ?? { revenue: 0, count: 0, items: 0 };
        cur.revenue += num(r.revenue);
        cur.count += num(r.cnt);
        cur.items += num(r.items);
        byName.set(name, cur);
    }
    return Array.from(byName, ([name, v]) => ({ name, revenue: round2(v.revenue), count: v.count, items: v.items }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 50);
}

// ---------------------------------------------------------------------------------------------
// Sales Counter-Wise Sales, category-mapped mode: Settings -> Master Data -> Sales Counter lets a
// tenant name each physical sales-floor counter and list the product types (pname values, e.g.
// "Shirt, Pant") sold at it -- so the report can group by real store layout instead of the
// salesman/counter code recorded per bill line (the "sls_man" fallback below, kept for tenants who
// haven't configured this). Cached briefly per tenant since it's read on every report call.
const COUNTER_MAP_TTL_MS = 60_000;
const counterMapCache = new Map<string, { at: number; value: Map<string, string> | null }>();

/** Product-name (uppercased) -> counter-name, from that tenant's SALES_COUNTER master entries. Null when none are configured (caller should fall back to sls_man). */
async function loadCounterCategoryMap(tenantId?: string): Promise<Map<string, string> | null> {
    if (!tenantId) return null;
    const cached = counterMapCache.get(tenantId);
    if (cached && Date.now() - cached.at < COUNTER_MAP_TTL_MS) return cached.value;

    const entries = await MasterEntry.find({ tenantId, type: "SALES_COUNTER", isActive: true }).lean();
    let value: Map<string, string> | null = null;
    if (entries.length > 0) {
        const map = new Map<string, string>();
        for (const e of entries) {
            const raw = String((e.meta as Record<string, unknown> | undefined)?.categories ?? "");
            for (const cat of raw.split(",")) {
                const name = cat.trim();
                if (name) map.set(name.toUpperCase(), e.name);
            }
        }
        if (map.size > 0) value = map;
    }
    counterMapCache.set(tenantId, { at: Date.now(), value });
    return value;
}

/** Buckets per-barcode SQL rows into per-counter totals via the category map, falling back to "Unassigned" when a product's type isn't listed under any counter. */
function aggregateByCounterMap(
    data: Row[],
    catalog: Map<string, CatalogEntry>,
    categoryMap: Map<string, string>,
): { name: string; revenue: number; count: number; items: number }[] {
    const byCounter = new Map<string, { revenue: number; count: number; items: number }>();
    for (const r of data) {
        const bc = String(r.bc ?? "").trim();
        const catalogName = catalog.get(bc)?.pname;
        const fallback = String(r.fallback ?? "").trim();
        const pname = (catalogName && catalogName.length > 0 ? catalogName : fallback).trim();
        const counterName = (pname && categoryMap.get(pname.toUpperCase())) || "Unassigned";
        const cur = byCounter.get(counterName) ?? { revenue: 0, count: 0, items: 0 };
        cur.revenue += num(r.revenue);
        cur.count += num(r.cnt);
        cur.items += num(r.items);
        byCounter.set(counterName, cur);
    }
    return Array.from(byCounter, ([name, v]) => ({ name, revenue: round2(v.revenue), count: v.count, items: v.items }))
        .sort((a, b) => b.revenue - a.revenue);
}

/** Days between two ISO dates (inclusive of both ends), used to cap how far the "day" dimension will zero-fill. */
const daySpan = (fromIso: string, toIso: string): number =>
    Math.round((new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000) + 1;

const hourLabel = (h: number): string => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

export interface SalesReportResult {
    rows: Record<string, unknown>[];
    range: { from: string; to: string };
    asOf: string | null;
    source: "sql";
}

/**
 * TEMPORARY DIAGNOSTIC (safe, read-only) -- added to root-cause why the brand/category/counter/hour
 * reports come back empty for some date ranges while the "day" report has real data for the same
 * range. Breaks down the `status` column on salsntry/sales2 (all-time and within the requested
 * range) so we can see whether non-cancelled rows are stored as status='0', NULL, or something else --
 * the brand/category/counter/hour queries filter with `WHERE status <> '1'`, which in SQL Server
 * silently drops any row where status IS NULL (NULL <> '1' is UNKNOWN, not TRUE). Remove this
 * function (and its route) once the root cause is confirmed and the real fix is in.
 */
export async function sqlStatusDebug(fromQ?: string, toQ?: string): Promise<Record<string, unknown>> {
    const asOf = await shopAsOf();
    const end = validDate(toQ) ?? asOf ?? new Date().toISOString().slice(0, 10);
    const start = validDate(fromQ) ?? addDays(end, -29);
    const p: QueryParam[] = [
        { name: "from", value: start },
        { name: "to", value: end },
    ];
    const period = "CAST(@from AS date) AND CAST(@to AS date)";
    const [salsntryAll, salsntryRange, sales2All, sales2Range, salsntrySample, revenueRecon] = await Promise.all([
        run(`SELECT [status], COUNT(*) AS cnt FROM dbo.[salsntry] GROUP BY [status]`, []),
        run(`SELECT [status], COUNT(*) AS cnt FROM dbo.[salsntry] WHERE [date] BETWEEN ${period} GROUP BY [status]`, p),
        run(`SELECT [status], COUNT(*) AS cnt FROM dbo.[sales2] GROUP BY [status]`, []),
        run(`SELECT [status], COUNT(*) AS cnt FROM dbo.[sales2] WHERE [date] BETWEEN ${period} GROUP BY [status]`, p),
        run(`SELECT TOP 5 [systemidbill], [status], [date], [ProGroupName], [brand] FROM dbo.[salsntry] WHERE [date] BETWEEN ${period} ORDER BY [date] DESC`, p),
        // Reconciliation: same range, three ways to total revenue --
        //  headerRevenue        = header table (sales2), CASE-based exclusion (what the "day" report uses)
        //  lineRevenueWhereCut  = line table (salsntry), WHERE-based exclusion (what brand/category currently use)
        //  lineRevenueCaseCut   = line table (salsntry), CASE-based exclusion (NULL-safe)
        // If lineRevenueWhereCut != lineRevenueCaseCut, the WHERE-clause NULL-exclusion bug is real and this is its size.
        run(
            `SELECT ` +
                `(SELECT ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([tot_netamnt] AS float) ELSE 0 END), 0) FROM dbo.[sales2] WHERE [date] BETWEEN ${period}) AS headerRevenue, ` +
                `(SELECT ISNULL(SUM(TRY_CAST([net_amount] AS float)), 0) FROM dbo.[salsntry] WHERE [status] <> '1' AND [date] BETWEEN ${period}) AS lineRevenueWhereCut, ` +
                `(SELECT ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([net_amount] AS float) ELSE 0 END), 0) FROM dbo.[salsntry] WHERE [date] BETWEEN ${period}) AS lineRevenueCaseCut, ` +
                `(SELECT ISNULL(SUM(TRY_CAST([net_amount] AS float)), 0) FROM dbo.[salsntry] WHERE [date] BETWEEN ${period}) AS lineRevenueAllRows, ` +
                `(SELECT COUNT(*) FROM dbo.[salsntry] WHERE [status] IS NULL AND [date] BETWEEN ${period}) AS lineNullStatusCount, ` +
                `(SELECT COUNT(*) FROM dbo.[sales2] WHERE [status] IS NULL AND [date] BETWEEN ${period}) AS headerNullStatusCount`,
            p,
        ),
    ]);
    return { range: { from: start, to: end }, salsntryAll, salsntryRange, sales2All, sales2Range, salsntrySample, revenueRecon: revenueRecon[0] ?? null };
}

export interface SalesIntelligenceResult {
    grossSales: number;
    grossSalesChangePct: number | null;
    netSales: number;
    netSalesChangePct: number | null;
    cancelledAmount: number;
    gstCollected: number;
    paymentSplit: { cash: number; bank: number };
    trend: { label: string; revenue: number }[];
    trendPrevious: { label: string; revenue: number }[];
    range: { from: string; to: string };
    asOf: string | null;
    source: "sql";
}

const monthAbbrev = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortLabel = (iso: string): string => {
    const [, m, d] = iso.split("-");
    return `${Number(d)} ${monthAbbrev[Number(m) - 1]}`;
};

/** Groups consecutive "day" rows into at most `buckets` slices and sums revenue per slice, for a chart that stays readable whether the range is 5 days or 500. */
function bucketDayRevenue(rows: { date: string; revenue: number }[], buckets: number): { label: string; revenue: number }[] {
    if (rows.length === 0) return [];
    const perBucket = Math.ceil(rows.length / buckets);
    const out: { label: string; revenue: number }[] = [];
    for (let i = 0; i < rows.length; i += perBucket) {
        const slice = rows.slice(i, i + perBucket);
        const revenue = round2(slice.reduce((s, r) => s + num(r.revenue), 0));
        const label = slice.length === 1 ? shortLabel(slice[0].date) : `${shortLabel(slice[0].date)}–${shortLabel(slice[slice.length - 1].date)}`;
        out.push({ label, revenue });
    }
    return out;
}

const pctChange = (curr: number, prev: number): number | null => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null);

/**
 * Sales Intelligence overview (Gross/Net Sales, GST collected, cash/bank split, and a revenue trend
 * vs. the immediately preceding period of equal length) for the "Sales Intelligence" report page.
 * Reuses the "day" dimension's per-day sales2 rollup (already NULL-safe -- see its comment below)
 * rather than a second bespoke query, so this shares the same header-table figures as the Daily
 * Sales Ledger.
 */
export async function sqlSalesIntelligence(fromQ?: string, toQ?: string): Promise<SalesIntelligenceResult> {
    const asOf = await shopAsOf();
    const end = validDate(toQ) ?? asOf ?? new Date().toISOString().slice(0, 10);
    const start = validDate(fromQ) ?? addDays(end, -29);
    const p: QueryParam[] = [
        { name: "from", value: start },
        { name: "to", value: end },
    ];
    const period = "CAST(@from AS date) AND CAST(@to AS date)";

    const spanDays = daySpan(start, end);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(spanDays - 1));

    const [totalsRows, current, previous] = await Promise.all([
        run(
            `SELECT ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([gst5] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([gst12] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([gst18] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([gst28] AS float) ELSE 0 END), 0) AS gstCollected, ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([s_recevied_cashamt] AS float) ELSE 0 END), 0) AS cash, ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([s_card_amt] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([s_credit_amt] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([s_googlepay] AS float) ELSE 0 END), 0) + ` +
                `ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([s_selfamt] AS float) ELSE 0 END), 0) AS bank ` +
                `FROM dbo.[sales2] WHERE [date] BETWEEN ${period}`,
            p,
        ),
        sqlSalesReport("day", undefined, start, end),
        sqlSalesReport("day", undefined, prevStart, prevEnd),
    ]);

    const t = (totalsRows[0] ?? {}) as Record<string, unknown>;
    const cash = num(t.cash);
    const bank = num(t.bank);
    const paidTotal = cash + bank;
    const cashPct = paidTotal > 0 ? Math.round((cash / paidTotal) * 100) : 0;
    const bankPct = paidTotal > 0 ? 100 - cashPct : 0;

    const currentDayRows = current.rows as { date: string; revenue: number; cancelledAmount: number }[];
    const previousDayRows = previous.rows as { date: string; revenue: number; cancelledAmount: number }[];
    const netSales = round2(currentDayRows.reduce((s, r) => s + num(r.revenue), 0));
    const cancelledAmount = round2(currentDayRows.reduce((s, r) => s + num(r.cancelledAmount), 0));
    const grossSales = round2(netSales + cancelledAmount);
    const prevNetSales = previousDayRows.reduce((s, r) => s + num(r.revenue), 0);
    const prevCancelled = previousDayRows.reduce((s, r) => s + num(r.cancelledAmount), 0);
    const prevGrossSales = prevNetSales + prevCancelled;

    const bucketCount = Math.min(12, Math.max(1, spanDays));

    return {
        grossSales,
        grossSalesChangePct: pctChange(grossSales, prevGrossSales),
        netSales,
        netSalesChangePct: pctChange(netSales, prevNetSales),
        cancelledAmount,
        gstCollected: round2(num(t.gstCollected)),
        paymentSplit: { cash: cashPct, bank: bankPct },
        trend: bucketDayRevenue(currentDayRows, bucketCount),
        trendPrevious: bucketDayRevenue(previousDayRows, bucketCount),
        range: { from: start, to: end },
        asOf,
        source: "sql",
    };
}

export async function sqlSalesReport(dim: SalesReportDim, range: string | undefined, fromQ?: string, toQ?: string, tenantId?: string): Promise<SalesReportResult> {
    const asOf = await shopAsOf();
    const end = validDate(toQ) ?? asOf ?? new Date().toISOString().slice(0, 10);
    const span = range === "TODAY" ? 0 : range === "WEEK" ? -6 : -29;
    const start = validDate(fromQ) ?? addDays(end, span);
    const p: QueryParam[] = [
        { name: "from", value: start },
        { name: "to", value: end },
    ];
    const period = "CAST(@from AS date) AND CAST(@to AS date)";

    let rows: Record<string, unknown>[] = [];
    if (dim === "brand") {
        // Grouped by barcode only (no join) -- cheap regardless of range width. The catalogue name for
        // each barcode is resolved afterwards from the cached lookup above, falling back to whatever
        // brand text was typed on the line itself when a barcode doesn't appear in the catalogue.
        const [data, catalog] = await Promise.all([
            run(
                `SELECT l.[barcode] AS bc, MAX(NULLIF(LTRIM(RTRIM(l.[brand])), '')) AS fallback, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[net_amount] AS float) ELSE 0 END), 0) AS revenue, ` +
                    `SUM(CASE WHEN l.[status] <> '1' THEN 1 ELSE 0 END) AS cnt, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[qty] AS float) ELSE 0 END), 0) AS items ` +
                    `FROM dbo.[salsntry] AS l WHERE l.[date] BETWEEN ${period} GROUP BY l.[barcode]`,
                p,
            ),
            barcodeCatalog(),
        ]);
        rows = aggregateByCatalogName(data, catalog, "brand", "No Brand");
    } else if (dim === "category") {
        const label = "COALESCE(NULLIF(LTRIM(RTRIM(l.[ProGroupName])), ''), 'Uncategorized')";
        const data = await run(
            `SELECT TOP 50 ${label} AS name, ISNULL(SUM(TRY_CAST(l.[net_amount] AS float)), 0) AS revenue, COUNT(*) AS cnt, ISNULL(SUM(TRY_CAST(l.[qty] AS float)), 0) AS items ` +
                `FROM dbo.[salsntry] AS l WHERE l.[status] <> '1' AND l.[date] BETWEEN ${period} GROUP BY ${label} ORDER BY revenue DESC`,
            p,
        );
        rows = data.map((r) => ({ name: String(r.name), revenue: round2(num(r.revenue)), count: num(r.cnt), items: num(r.items) }));
    } else if (dim === "counter") {
        const label = "COALESCE(NULLIF(LTRIM(RTRIM(s.[countername])), ''), NULLIF(LTRIM(RTRIM(s.[systemname])), ''), 'Main Counter')";
        const data = await run(
            `SELECT ${label} AS name, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS revenue, COUNT(*) AS cnt ` +
                `FROM dbo.[sales2] AS s WHERE s.[status] <> '1' AND s.[date] BETWEEN ${period} GROUP BY ${label} ORDER BY revenue DESC`,
            p,
        );
        rows = data.map((r) => ({ name: String(r.name), revenue: round2(num(r.revenue)), count: num(r.cnt) }));
    } else if (dim === "salesCounter") {
        // Sales-floor counter. Preferred source: Settings -> Master Data -> Sales Counter, which maps
        // each named counter to the product types (pname) sold there -- matches how this shop actually
        // organizes its floor (e.g. Counter 1 = Shirt/Pant, Counter 2 = Lungi/Dhothie/Gents Banian),
        // which the salesman/counter code below has no notion of. Falls back to that code
        // (salsntry.sls_man, stamped on each line item) when the tenant hasn't configured any mapping.
        const categoryMap = await loadCounterCategoryMap(tenantId);
        if (categoryMap) {
            const [data, catalog] = await Promise.all([
                run(
                    `SELECT l.[barcode] AS bc, MAX(NULLIF(LTRIM(RTRIM(l.[p_name])), '')) AS fallback, ` +
                        `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[net_amount] AS float) ELSE 0 END), 0) AS revenue, ` +
                        `SUM(CASE WHEN l.[status] <> '1' THEN 1 ELSE 0 END) AS cnt, ` +
                        `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[qty] AS float) ELSE 0 END), 0) AS items ` +
                        `FROM dbo.[salsntry] AS l WHERE l.[date] BETWEEN ${period} GROUP BY l.[barcode]`,
                    p,
                ),
                barcodeCatalog(),
            ]);
            rows = aggregateByCounterMap(data, catalog, categoryMap);
        } else {
            const label = "COALESCE(NULLIF(LTRIM(RTRIM(l.[sls_man])), ''), 'Unassigned')";
            const data = await run(
                `SELECT ${label} AS code, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[net_amount] AS float) ELSE 0 END), 0) AS revenue, ` +
                    `SUM(CASE WHEN l.[status] <> '1' THEN 1 ELSE 0 END) AS cnt, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[qty] AS float) ELSE 0 END), 0) AS items ` +
                    `FROM dbo.[salsntry] AS l WHERE l.[date] BETWEEN ${period} GROUP BY ${label} ORDER BY revenue DESC`,
                p,
            );
            rows = data.map((r) => ({
                name: r.code === "Unassigned" ? "Unassigned" : `Counter ${String(r.code)}`,
                revenue: round2(num(r.revenue)),
                count: num(r.cnt),
                items: num(r.items),
            }));
        }
    } else if (dim === "product") {
        // Product-type breakdown (e.g. Shirt / T-Shirt / Saree) -- the shop's item master name lives on
        // dbo.stockdetails.pname (see textilesoft.mapping.json: columns.name = "pname"). Same cached
        // barcode -> catalogue-name lookup as "brand" above, rather than joining the full stockdetails
        // table on every call (see the comment on barcodeCatalog()). Falls back to the line's own
        // free-text p_name when a barcode doesn't appear in the catalogue.
        const [data, catalog] = await Promise.all([
            run(
                `SELECT l.[barcode] AS bc, MAX(NULLIF(LTRIM(RTRIM(l.[p_name])), '')) AS fallback, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[net_amount] AS float) ELSE 0 END), 0) AS revenue, ` +
                    `SUM(CASE WHEN l.[status] <> '1' THEN 1 ELSE 0 END) AS cnt, ` +
                    `ISNULL(SUM(CASE WHEN l.[status] <> '1' THEN TRY_CAST(l.[qty] AS float) ELSE 0 END), 0) AS items ` +
                    `FROM dbo.[salsntry] AS l WHERE l.[date] BETWEEN ${period} GROUP BY l.[barcode]`,
                p,
            ),
            barcodeCatalog(),
        ]);
        rows = aggregateByCatalogName(data, catalog, "pname", "Other");
    } else if (dim === "hour") {
        const data = await run(
            `SELECT DATEPART(hour, s.[datetime]) AS h, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS revenue, COUNT(*) AS cnt ` +
                `FROM dbo.[sales2] AS s WHERE s.[status] <> '1' AND s.[datetime] IS NOT NULL AND s.[date] BETWEEN ${period} GROUP BY DATEPART(hour, s.[datetime])`,
            p,
        );
        const byHour = new Map(data.map((r) => [num(r.h), r]));
        rows = Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            label: hourLabel(h),
            revenue: round2(num(byHour.get(h)?.revenue)),
            transactions: num(byHour.get(h)?.cnt),
        }));
    } else {
        // day: one row per calendar day in the period, with the payment-method split for that day.
        // Cancelled bills (status = '1') are excluded from revenue/transactions/payment split, same as
        // every other report here, but counted separately as `cancelledCount` so the ledger can flag them.
        const data = await run(
            `SELECT CONVERT(varchar(10), s.[date], 23) AS d, ` +
                `ISNULL(SUM(CASE WHEN s.[status] <> '1' THEN TRY_CAST(s.[tot_netamnt] AS float) ELSE 0 END), 0) AS revenue, ` +
                `SUM(CASE WHEN s.[status] <> '1' THEN 1 ELSE 0 END) AS cnt, ` +
                `SUM(CASE WHEN s.[status] = '1' THEN 1 ELSE 0 END) AS cancelledCnt, ` +
                `ISNULL(SUM(CASE WHEN s.[status] = '1' THEN TRY_CAST(s.[tot_netamnt] AS float) ELSE 0 END), 0) AS cancelledAmt, ` +
                `ISNULL(SUM(CASE WHEN s.[status] <> '1' THEN TRY_CAST(s.[s_recevied_cashamt] AS float) ELSE 0 END), 0) AS cash, ` +
                `ISNULL(SUM(CASE WHEN s.[status] <> '1' THEN TRY_CAST(s.[s_card_amt] AS float) ELSE 0 END), 0) AS card, ` +
                `ISNULL(SUM(CASE WHEN s.[status] <> '1' THEN TRY_CAST(s.[s_credit_amt] AS float) ELSE 0 END), 0) AS credit, ` +
                `ISNULL(SUM(CASE WHEN s.[status] <> '1' THEN TRY_CAST(s.[s_googlepay] AS float) ELSE 0 END), 0) AS upi ` +
                `FROM dbo.[sales2] AS s WHERE s.[date] BETWEEN ${period} GROUP BY CONVERT(varchar(10), s.[date], 23)`,
            p,
        );
        const byDay = new Map(data.map((r) => [String(r.d), r]));
        const span = daySpan(start, end);
        if (span > 0 && span <= 366) {
            rows = Array.from({ length: span }, (_, i) => {
                const d = addDays(start, i);
                const r = byDay.get(d);
                return {
                    date: d,
                    revenue: round2(num(r?.revenue)),
                    transactions: num(r?.cnt),
                    cancelledCount: num(r?.cancelledCnt),
                    cancelledAmount: round2(num(r?.cancelledAmt)),
                    cash: round2(num(r?.cash)),
                    card: round2(num(r?.card)),
                    credit: round2(num(r?.credit)),
                    upi: round2(num(r?.upi)),
                };
            });
        } else {
            // Custom range too wide to zero-fill (>366 days) -- just return the days that had sales.
            rows = data
                .map((r) => ({
                    date: String(r.d),
                    revenue: round2(num(r.revenue)),
                    transactions: num(r.cnt),
                    cancelledCount: num(r.cancelledCnt),
                    cancelledAmount: round2(num(r.cancelledAmt)),
                    cash: round2(num(r.cash)),
                    card: round2(num(r.card)),
                    credit: round2(num(r.credit)),
                    upi: round2(num(r.upi)),
                }))
                .sort((a, b) => (a.date < b.date ? -1 : 1));
        }
    }
    return { rows, range: { from: start, to: end }, asOf, source: "sql" };
}
