import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { sqlSupplierList } from "./sqlSuppliers.js";
import { shopAsOf } from "./sqlStockReports.js";
import { tableQuery, type TableQuery } from "../../modules/core/services/tableQuery.js";
import Supplier from "../../modules/purchase/models/Supplier.js";

/**
 * ITEM_DATA_SOURCE=sql: Party reports (Reports > Party Reports) read straight from the Textilesoft tables.
 *   purchases  dbo.purgrnentry  -- GRN header: suplier_name, Supplier_City, entry_date, tot_qut, totnetamot
 *   sales      dbo.sales2       -- bill header: cus_card, cus_name, city, mbl_no, cus_cat, tot_netamnt, date
 *   suppliers  sqlSupplierList  -- supplierdetail master + GRN activity (same numbers as the Suppliers page)
 *
 * Conventions shared with the existing SQL reports:
 *   - GRN totals add up purgrnentry header rows, exactly as the Suppliers page does (every GRN is a CASH purchase).
 *   - Cancelled bills are excluded with `status <> '1'`, the rule every sales report uses.
 *   - Parties are matched by trimmed, case-insensitive name; customers by card number when there is one.
 * Supplier returns come from PurchaseReturnHeader / PurchaseReturnDetails (purretrun is empty in the shop DB) and are
 * shown next to gross purchases and deducted in the net figures. Sales-return tables are checked at runtime
 * (salesReturnEntries) -- they are empty in the shop DB, so there is nothing to deduct on the sales side.
 */

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const str = (v: unknown): string => String(v ?? "").trim();
const isoDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

async function run(text: string, params: QueryParam[] = []): Promise<Row[]> {
    const req = (await getPool()).request();
    for (const p of params) req.input(p.name, p.value);
    const res = await req.query(SESSION_PREFIX + text);
    return res ? res.recordset : [];
}

/** Inclusive yyyy-mm-dd range; swapped if reversed; either end optional. */
function dateRange(q: { from?: string; to?: string }): { from: string | null; to: string | null } {
    let from = isoDate(q.from) ?? null;
    let to = isoDate(q.to) ?? null;
    if (from && to && from > to) [from, to] = [to, from];
    return { from, to };
}

/** Pushes @from/@to once; use dateCond() for every column that should share them. */
function dateParams(r: { from: string | null; to: string | null }, params: QueryParam[]): void {
    if (r.from) params.push({ name: "from", value: r.from });
    if (r.to) params.push({ name: "to", value: r.to });
}
function dateCond(col: string, r: { from: string | null; to: string | null }): string {
    const parts: string[] = [];
    if (r.from) parts.push(`${col} >= CAST(@from AS date)`);
    if (r.to) parts.push(`${col} < DATEADD(day, 1, CAST(@to AS date))`);
    return parts.length ? parts.join(" AND ") : "1 = 1";
}

/** First day of the month `months - 1` months before asOf, to asOf: a default window for heavy line-level reports. */
function recentMonths(asOf: string | null, months: number): { from: string | null; to: string | null } {
    if (!asOf) return { from: null, to: null };
    const d = new Date(`${asOf}T00:00:00Z`);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (months - 1));
    return { from: d.toISOString().slice(0, 10), to: asOf };
}

function dateWhere(col: string, r: { from: string | null; to: string | null }, params: QueryParam[]): string {
    const parts: string[] = [];
    if (r.from) {
        params.push({ name: "from", value: r.from });
        parts.push(`${col} >= CAST(@from AS date)`);
    }
    if (r.to) {
        params.push({ name: "to", value: r.to });
        parts.push(`${col} < DATEADD(day, 1, CAST(@to AS date))`);
    }
    return parts.length ? parts.join(" AND ") : "1 = 1";
}

const cache = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, refresh: boolean, load: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    if (hit && !refresh && Date.now() - hit.at < 60_000) return hit.value as Promise<T>;
    const value = load();
    cache.set(key, { at: Date.now(), value });
    value.catch(() => cache.delete(key));
    return value;
}

export interface PartyReportQuery extends TableQuery {
    from?: string;
    to?: string;
    type?: string; // All Parties: all | customer | supplier
    refresh?: string;
}

/** Runs a query that reads a table which may not exist in every shop DB; returns [] (and ok=false) if it fails. */
async function optional(text: string, params: QueryParam[] = []): Promise<{ ok: boolean; rows: Row[] }> {
    try {
        return { ok: true, rows: await run(text, params) };
    } catch {
        return { ok: false, rows: [] };
    }
}

let salesReturnCache: { at: number; value: Promise<number> } | undefined;
/**
 * Rows in the Textilesoft sales-return tables. 0 in the shop DB today (customers' returns aren't recorded there), so
 * the sales reports have nothing to deduct; if this ever turns positive the reports say so instead of hiding it.
 */
export function salesReturnEntries(): Promise<number> {
    if (salesReturnCache && Date.now() - salesReturnCache.at < 300_000) return salesReturnCache.value;
    const value = (async () => {
        let n = 0;
        for (const t of ["sales2Return", "salsntryReturn", "salbillReturns", "InvoiceReturnDetails"]) {
            const r = await optional(`SELECT COUNT(*) AS n FROM dbo.[${t}]`);
            n += num(r.rows[0]?.n);
        }
        return n;
    })();
    salesReturnCache = { at: Date.now(), value };
    value.catch(() => { salesReturnCache = undefined; });
    return value;
}

/* ------------------------------------------------------------------------------------------ Purchase by Party */

interface SupplierPurchaseRow {
    supplier: string;
    city: string;
    grns: number;
    qty: number;
    value: number; // gross: GRN net totals (matches the Suppliers page)
    returns: number; // purchase-return documents
    returnQty: number;
    returnValue: number;
    netValue: number; // value - returnValue
    firstDate: string | null;
    lastDate: string | null;
    sharePct: number;
}

/** Purchases per supplier for a date range (cached 60s); shared by Purchase by Party and Purchase by Party Group. */
function purchaseRows(range: { from: string | null; to: string | null }, refresh: boolean) {
    return cached(`purchase-by-party:${range.from}:${range.to}`, refresh, async () => {
        const params: QueryParam[] = [];
        const where = dateWhere("g.[entry_date]", range, params);
        const rp: QueryParam[] = [];
        const rwhere = dateWhere("r.[entry_date]", range, rp);
        const returns = await optional(
            `SELECT ISNULL(NULLIF(LTRIM(RTRIM(r.[suplier_name])), ''), '') AS supplier, COUNT(DISTINCT r.[grn_no]) AS docs, ` +
                `ISNULL(SUM(TRY_CAST(r.[tot_qut] AS float)), 0) AS qty, ISNULL(SUM(TRY_CAST(r.[totnetamot] AS float)), 0) AS value ` +
                `FROM dbo.[PurchaseReturnHeader] AS r WHERE ${rwhere} GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(r.[suplier_name])), ''), '')`,
            rp,
        );
        const raw = await run(
            `SELECT ISNULL(NULLIF(LTRIM(RTRIM(g.[suplier_name])), ''), '') AS supplier, MAX(NULLIF(LTRIM(RTRIM(g.[Supplier_City])), '')) AS city, ` +
                `COUNT(DISTINCT g.[grn_no]) AS grns, COUNT(*) AS headerRows, ` +
                `ISNULL(SUM(TRY_CAST(g.[tot_qut] AS float)), 0) AS qty, ISNULL(SUM(TRY_CAST(g.[totnetamot] AS float)), 0) AS value, ` +
                `CONVERT(varchar(10), MIN(g.[entry_date]), 23) AS firstDate, CONVERT(varchar(10), MAX(g.[entry_date]), 23) AS lastDate ` +
                `FROM dbo.[purgrnentry] AS g WHERE ${where} GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(g.[suplier_name])), ''), '')`,
            params,
        );
        // Same supplier spelled with different case -> one row.
        const acc = new Map<string, SupplierPurchaseRow & { headerRows: number }>();
        for (const r of raw) {
            const name = str(r.supplier) || "Unknown supplier";
            const key = name.toUpperCase();
            const a = acc.get(key) ?? { supplier: name, city: "", grns: 0, qty: 0, value: 0, returns: 0, returnQty: 0, returnValue: 0, netValue: 0, firstDate: null, lastDate: null, sharePct: 0, headerRows: 0 };
            a.city = a.city || str(r.city);
            a.grns += num(r.grns);
            a.headerRows += num(r.headerRows);
            a.qty += num(r.qty);
            a.value += num(r.value);
            const f = r.firstDate ? String(r.firstDate) : null;
            const l = r.lastDate ? String(r.lastDate) : null;
            if (f && (!a.firstDate || f < a.firstDate)) a.firstDate = f;
            if (l && (!a.lastDate || l > a.lastDate)) a.lastDate = l;
            acc.set(key, a);
        }
        // Returns to a supplier with no GRN in the range still show up (negative net), never silently dropped.
        for (const r of returns.rows) {
            const name = str(r.supplier) || "Unknown supplier";
            const key = name.toUpperCase();
            const a = acc.get(key) ?? { supplier: name, city: "", grns: 0, qty: 0, value: 0, returns: 0, returnQty: 0, returnValue: 0, netValue: 0, firstDate: null, lastDate: null, sharePct: 0, headerRows: 0 };
            a.returns += num(r.docs);
            a.returnQty += num(r.qty);
            a.returnValue += num(r.value);
            acc.set(key, a);
        }
        for (const a of acc.values()) a.netValue = a.value - a.returnValue;
        return [...acc.values()];
    });
}

export async function sqlPurchaseByParty(q: PartyReportQuery): Promise<Doc> {
    const range = dateRange(q);
    const rows = await purchaseRows(range, q.refresh === "1");

    const totalNet = rows.reduce((s, r) => s + r.netValue, 0);
    const all: SupplierPurchaseRow[] = rows.map((r) => ({
        supplier: r.supplier,
        city: r.city,
        grns: r.grns,
        qty: round3(r.qty),
        value: round2(r.value),
        returns: r.returns,
        returnQty: round3(r.returnQty),
        returnValue: round2(r.returnValue),
        netValue: round2(r.netValue),
        firstDate: r.firstDate,
        lastDate: r.lastDate,
        sharePct: totalNet > 0 ? Math.round((r.netValue / totalNet) * 1000) / 10 : 0,
    }));
    const t = tableQuery(all, q, {
        searchIn: (r) => [r.supplier, r.city],
        sortable: { supplier: (r) => r.supplier, city: (r) => r.city, grns: (r) => r.grns, qty: (r) => r.qty, value: (r) => r.value, returnValue: (r) => r.returnValue, netValue: (r) => r.netValue, lastDate: (r) => r.lastDate, firstDate: (r) => r.firstDate },
        fallback: (a, b) => b.netValue - a.netValue,
        tieBreak: (r) => r.supplier,
    });
    const shown = t.matched;
    return {
        asOf: await shopAsOf(),
        range,
        totals: {
            suppliers: shown.length,
            grns: shown.reduce((s, r) => s + r.grns, 0),
            qty: round3(shown.reduce((s, r) => s + r.qty, 0)),
            value: round2(shown.reduce((s, r) => s + r.value, 0)),
            returns: shown.reduce((s, r) => s + r.returns, 0),
            returnQty: round3(shown.reduce((s, r) => s + r.returnQty, 0)),
            returnValue: round2(shown.reduce((s, r) => s + r.returnValue, 0)),
            netValue: round2(shown.reduce((s, r) => s + r.netValue, 0)),
        },
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: {
            // purgrnentry rows beyond one per GRN number (re-saved GRNs). Totals add every row, like the Suppliers page.
            extraHeaderRows: rows.reduce((s, r) => s + Math.max(0, r.headerRows - r.grns), 0),
        },
        source: "sql",
    };
}

/* ------------------------------------------------------------------------------------------------ All Parties */

interface PartyRow {
    key: string; // customer: card no. or "N:NAME"; supplier: "S:NAME" -- what Party Statement expects
    type: "Customer" | "Supplier";
    name: string;
    code: string; // customer card no.
    city: string;
    phone: string;
    group: string;
    transactions: number; // bills (customers) / GRNs (suppliers)
    value: number; // sales (customers) / purchases (suppliers)
    creditOrOpening: number; // credit sales (customers) / opening balance (suppliers)
    lastDate: string | null;
}

/** Named customers from sales bills (walk-in bills without a card or name are counted separately). */
/** Customer identity on a sales bill: card no. when present, else the name ("0" and blanks mean walk-in). */
const CARD = "NULLIF(NULLIF(LTRIM(RTRIM(s.[cus_card])), ''), '0')";
const NAME = "NULLIF(NULLIF(LTRIM(RTRIM(s.[cus_name])), ''), '0')";
const PARTY_KEY = `COALESCE(${CARD}, 'N:' + UPPER(${NAME}))`;
/** Bill counts as a sale: not cancelled -- the rule every SQL sales report uses. */
const LIVE_BILL = "s.[status] <> '1'";

let groupCache: { at: number; value: Promise<Map<string, string>> } | undefined;
/** CustomerGroup code -> name (sales2.cus_cat stores the code, or sometimes the name itself). */
function customerGroups(): Promise<Map<string, string>> {
    if (groupCache && Date.now() - groupCache.at < 300_000) return groupCache.value;
    const value = run("SELECT LTRIM(RTRIM([code])) AS code, LTRIM(RTRIM([name])) AS name FROM dbo.[CustomerGroup]").then((rows) => new Map(rows.map((g) => [str(g.code), str(g.name)])));
    groupCache = { at: Date.now(), value };
    value.catch(() => { groupCache = undefined; });
    return value;
}
const groupOf = (groups: Map<string, string>, cat: unknown): string => {
    const c = str(cat);
    return c ? groups.get(c) ?? c : "";
};

async function customerParties(): Promise<{ parties: PartyRow[]; walkIn: { bills: number; value: number }; namedBills: number }> {
    const card = CARD;
    const name = NAME;
    const [groupName, raw, walk] = await Promise.all([
        customerGroups(),
        run(
            `SELECT COALESCE(${card}, 'N:' + UPPER(${name})) AS pkey, MAX(${card}) AS card, MAX(${name}) AS name, ` +
                `MAX(NULLIF(LTRIM(RTRIM(s.[city])), '')) AS city, MAX(NULLIF(LTRIM(RTRIM(s.[mbl_no])), '')) AS phone, MAX(NULLIF(LTRIM(RTRIM(s.[cus_cat])), '')) AS cat, ` +
                `COUNT(*) AS bills, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS total, ISNULL(SUM(TRY_CAST(s.[s_credit_amt] AS float)), 0) AS credit, ` +
                `CONVERT(varchar(10), MAX(s.[date]), 23) AS lastDate ` +
                `FROM dbo.[sales2] AS s WHERE s.[status] <> '1' AND (${card} IS NOT NULL OR ${name} IS NOT NULL) ` +
                `GROUP BY COALESCE(${card}, 'N:' + UPPER(${name}))`,
        ),
        run(`SELECT COUNT(*) AS bills, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS total FROM dbo.[sales2] AS s WHERE s.[status] <> '1' AND ${card} IS NULL AND ${name} IS NULL`),
    ]);
    const parties: PartyRow[] = raw.map((r) => {
        return {
            key: str(r.pkey),
            type: "Customer",
            name: str(r.name) || `Card ${str(r.card)}`,
            code: str(r.card),
            city: str(r.city),
            phone: str(r.phone),
            group: groupOf(groupName, r.cat),
            transactions: num(r.bills),
            value: round2(num(r.total)),
            creditOrOpening: round2(num(r.credit)),
            lastDate: r.lastDate ? String(r.lastDate) : null,
        };
    });
    return { parties, walkIn: { bills: num(walk[0]?.bills), value: round2(num(walk[0]?.total)) }, namedBills: parties.reduce((s, p) => s + p.transactions, 0) };
}

async function supplierParties(): Promise<PartyRow[]> {
    const list = await sqlSupplierList();
    return list.map((s) => ({
        key: `S:${str(s.businessName).toUpperCase()}`,
        type: "Supplier",
        name: str(s.businessName),
        code: "",
        city: str(s.city),
        phone: str(s.contactNo),
        group: str(s.supplierGroup),
        transactions: num(s.billCount),
        value: round2(num(s.totalAmount)),
        creditOrOpening: round2(num(s.openingBalance)),
        lastDate: s.lastPurchaseDate ? String(s.lastPurchaseDate) : null,
    }));
}

export async function sqlAllParties(q: PartyReportQuery): Promise<Doc> {
    const data = await cached("all-parties", q.refresh === "1", async () => {
        const [c, s] = await Promise.all([customerParties(), supplierParties()]);
        return { ...c, suppliers: s };
    });
    const type = q.type === "customer" || q.type === "supplier" ? q.type : "all";
    const rows = [...(type !== "supplier" ? data.parties : []), ...(type !== "customer" ? data.suppliers : [])];
    const t = tableQuery(rows, q, {
        searchIn: (r) => [r.name, r.code, r.city, r.phone, r.group],
        sortable: { type: (r) => r.type, name: (r) => r.name, city: (r) => r.city, group: (r) => r.group, transactions: (r) => r.transactions, value: (r) => r.value, creditOrOpening: (r) => r.creditOrOpening, lastDate: (r) => r.lastDate },
        fallback: (a, b) => b.value - a.value,
        tieBreak: (r) => `${r.type}:${r.name}:${r.code}`,
    });
    const m = t.matched;
    return {
        asOf: await shopAsOf(),
        type,
        totals: {
            parties: m.length,
            customers: m.filter((r) => r.type === "Customer").length,
            suppliers: m.filter((r) => r.type === "Supplier").length,
            salesValue: round2(m.filter((r) => r.type === "Customer").reduce((s, r) => s + r.value, 0)),
            purchaseValue: round2(m.filter((r) => r.type === "Supplier").reduce((s, r) => s + r.value, 0)),
        },
        walkIn: data.walkIn, // bills with no customer card or name (all time)
        namedBills: data.namedBills,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        salesReturnEntries: await salesReturnEntries(),
        source: "sql",
    };
}

/* --------------------------------------------------------------------- Sales by Party / Sales by Party Group */

interface CustomerSalesRow {
    key: string;
    name: string;
    code: string;
    city: string;
    phone: string;
    group: string;
    bills: number;
    qty: number;
    value: number;
    credit: number;
    avgBill: number;
    firstDate: string | null;
    lastDate: string | null;
    sharePct: number; // of ALL sales in the range, walk-in included
}

interface SalesSnapshot {
    customers: CustomerSalesRow[];
    walkIn: { bills: number; qty: number; value: number };
    all: { bills: number; qty: number; value: number };
}

/** One scan per date range (cached 60s) serves both Sales by Party and Sales by Party Group. */
function salesByCustomer(range: { from: string | null; to: string | null }, refresh: boolean): Promise<SalesSnapshot> {
    return cached(`sales-by-party:${range.from}:${range.to}`, refresh, async () => {
        const p1: QueryParam[] = [];
        const w1 = dateWhere("s.[date]", range, p1);
        const p2: QueryParam[] = [];
        const w2 = dateWhere("s.[date]", range, p2);
        const [groups, raw, totals] = await Promise.all([
            customerGroups(),
            run(
                `SELECT ${PARTY_KEY} AS pkey, MAX(${CARD}) AS card, MAX(${NAME}) AS name, MAX(NULLIF(LTRIM(RTRIM(s.[city])), '')) AS city, ` +
                    `MAX(NULLIF(LTRIM(RTRIM(s.[mbl_no])), '')) AS phone, MAX(NULLIF(LTRIM(RTRIM(s.[cus_cat])), '')) AS cat, COUNT(*) AS bills, ` +
                    `ISNULL(SUM(TRY_CAST(s.[tot_qty] AS float)), 0) AS qty, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS value, ` +
                    `ISNULL(SUM(TRY_CAST(s.[s_credit_amt] AS float)), 0) AS credit, CONVERT(varchar(10), MIN(s.[date]), 23) AS firstDate, CONVERT(varchar(10), MAX(s.[date]), 23) AS lastDate ` +
                    `FROM dbo.[sales2] AS s WHERE ${LIVE_BILL} AND ${w1} AND (${CARD} IS NOT NULL OR ${NAME} IS NOT NULL) GROUP BY ${PARTY_KEY}`,
                p1,
            ),
            // All bills in the range, split named / walk-in, so the report can prove named + walk-in = total.
            run(
                `SELECT CASE WHEN ${CARD} IS NULL AND ${NAME} IS NULL THEN 'walkin' ELSE 'named' END AS kind, COUNT(*) AS bills, ` +
                    `ISNULL(SUM(TRY_CAST(s.[tot_qty] AS float)), 0) AS qty, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS value ` +
                    `FROM dbo.[sales2] AS s WHERE ${LIVE_BILL} AND ${w2} GROUP BY CASE WHEN ${CARD} IS NULL AND ${NAME} IS NULL THEN 'walkin' ELSE 'named' END`,
                p2,
            ),
        ]);
        const pick = (k: string) => totals.find((t) => t.kind === k);
        const walkIn = { bills: num(pick("walkin")?.bills), qty: round3(num(pick("walkin")?.qty)), value: round2(num(pick("walkin")?.value)) };
        const named = { bills: num(pick("named")?.bills), qty: num(pick("named")?.qty), value: num(pick("named")?.value) };
        const all = { bills: walkIn.bills + named.bills, qty: round3(walkIn.qty + named.qty), value: round2(walkIn.value + named.value) };
        const customers: CustomerSalesRow[] = raw.map((r) => {
            const bills = num(r.bills);
            const value = num(r.value);
            return {
                key: str(r.pkey),
                name: str(r.name) || `Card ${str(r.card)}`,
                code: str(r.card),
                city: str(r.city),
                phone: str(r.phone),
                group: groupOf(groups, r.cat),
                bills,
                qty: round3(num(r.qty)),
                value: round2(value),
                credit: round2(num(r.credit)),
                avgBill: bills ? round2(value / bills) : 0,
                firstDate: r.firstDate ? String(r.firstDate) : null,
                lastDate: r.lastDate ? String(r.lastDate) : null,
                sharePct: all.value > 0 ? Math.round((value / all.value) * 1000) / 10 : 0,
            };
        });
        return { customers, walkIn, all };
    });
}

export interface SalesPartyQuery extends PartyReportQuery {
    group?: string; // Sales by Party: only customers in this group ("No group" = blank)
}

export const NO_GROUP = "No group";

export async function sqlSalesByParty(q: SalesPartyQuery): Promise<Doc> {
    const range = dateRange(q);
    const snap = await salesByCustomer(range, q.refresh === "1");
    const group = str(q.group);
    const inGroup = group ? snap.customers.filter((c) => (group === NO_GROUP ? !c.group : c.group.toLowerCase() === group.toLowerCase())) : snap.customers;
    const t = tableQuery(inGroup, q, {
        searchIn: (r) => [r.name, r.code, r.city, r.phone, r.group],
        sortable: { name: (r) => r.name, city: (r) => r.city, group: (r) => r.group, bills: (r) => r.bills, qty: (r) => r.qty, value: (r) => r.value, avgBill: (r) => r.avgBill, credit: (r) => r.credit, lastDate: (r) => r.lastDate },
        fallback: (a, b) => b.value - a.value,
        tieBreak: (r) => r.key,
    });
    const m = t.matched;
    const groups = [...new Set(snap.customers.map((c) => c.group || NO_GROUP))].sort((a, b) => a.localeCompare(b));
    return {
        asOf: await shopAsOf(),
        range,
        group: group || null,
        groups,
        totals: {
            customers: m.length,
            bills: m.reduce((s, r) => s + r.bills, 0),
            qty: round3(m.reduce((s, r) => s + r.qty, 0)),
            value: round2(m.reduce((s, r) => s + r.value, 0)),
        },
        named: { customers: snap.customers.length, bills: snap.all.bills - snap.walkIn.bills, value: round2(snap.all.value - snap.walkIn.value) },
        walkIn: snap.walkIn,
        all: snap.all,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        salesReturnEntries: await salesReturnEntries(),
        source: "sql",
    };
}

interface GroupSalesRow {
    group: string;
    kind: "group" | "none" | "walkin";
    customers: number;
    bills: number;
    qty: number;
    value: number;
    avgBill: number;
    sharePct: number;
}

export async function sqlSalesByPartyGroup(q: PartyReportQuery): Promise<Doc> {
    const range = dateRange(q);
    const snap = await salesByCustomer(range, q.refresh === "1");
    const acc = new Map<string, GroupSalesRow>();
    for (const c of snap.customers) {
        const name = c.group || NO_GROUP;
        const g = acc.get(name) ?? { group: name, kind: c.group ? "group" : "none", customers: 0, bills: 0, qty: 0, value: 0, avgBill: 0, sharePct: 0 };
        g.customers += 1;
        g.bills += c.bills;
        g.qty += c.qty;
        g.value += c.value;
        acc.set(name, g);
    }
    const rows: GroupSalesRow[] = [...acc.values()];
    if (snap.walkIn.bills > 0) rows.push({ group: "Walk-in (no customer)", kind: "walkin", customers: 0, bills: snap.walkIn.bills, qty: snap.walkIn.qty, value: snap.walkIn.value, avgBill: 0, sharePct: 0 });
    for (const r of rows) {
        r.qty = round3(r.qty);
        r.value = round2(r.value);
        r.avgBill = r.bills ? round2(r.value / r.bills) : 0;
        r.sharePct = snap.all.value > 0 ? Math.round((r.value / snap.all.value) * 1000) / 10 : 0;
    }
    const t = tableQuery(rows, { ...q, limit: 200 }, {
        searchIn: (r) => [r.group],
        sortable: { group: (r) => r.group, customers: (r) => r.customers, bills: (r) => r.bills, qty: (r) => r.qty, value: (r) => r.value, avgBill: (r) => r.avgBill },
        fallback: (a, b) => b.value - a.value,
        tieBreak: (r) => r.group,
    });
    return {
        asOf: await shopAsOf(),
        range,
        totals: { groups: rows.filter((r) => r.kind === "group").length, customers: snap.customers.length, bills: snap.all.bills, qty: snap.all.qty, value: snap.all.value },
        walkIn: snap.walkIn,
        items: t.items,
        sort: t.sort,
        dir: t.dir,
        salesReturnEntries: await salesReturnEntries(),
        source: "sql",
    };
}

/* ------------------------------------------------------------------------------------------ Party Report by Item */

const ITEM_ROW_CAP = 100_000;

interface PartyItemRow {
    partyKey: string;
    party: string;
    code: string;
    item: string;
    docs: number; // bills (customers) / GRNs (suppliers)
    qty: number;
    value: number;
    avgRate: number;
    lastDate: string | null;
    returnedQty: number; // suppliers: pieces returned (already deducted from qty/value)
}

/**
 * Customer x product (sale lines joined to their bill) or supplier x product (GRN lines). Line values include GST,
 * like the bill and GRN totals. Defaults to the last 3 months: all-time customer x product can run to lakhs of rows.
 */
export async function sqlPartyItems(q: PartyReportQuery): Promise<Doc> {
    const asOf = await shopAsOf();
    const type = q.type === "supplier" ? "supplier" : "customer";
    const given = dateRange(q);
    const range = given.from || given.to ? given : recentMonths(asOf, 3);
    const data = await cached(`party-items:${type}:${range.from}:${range.to}`, q.refresh === "1", async () => {
        const params: QueryParam[] = [];
        dateParams(range, params);
        const sql =
            type === "customer"
                ? `SELECT TOP (${ITEM_ROW_CAP + 1}) ${PARTY_KEY} AS pkey, MAX(${CARD}) AS card, MAX(${NAME}) AS name, UPPER(LTRIM(RTRIM(l.[p_name]))) AS item, ` +
                  `COUNT(DISTINCT s.[sysidandbill]) AS docs, ISNULL(SUM(TRY_CAST(l.[qty] AS float)), 0) AS qty, ISNULL(SUM(TRY_CAST(l.[net_amount] AS float)), 0) AS value, ` +
                  `CONVERT(varchar(10), MAX(s.[date]), 23) AS lastDate ` +
                  `FROM dbo.[sales2] AS s JOIN dbo.[salsntry] AS l ON l.[systemidbill] = s.[sysidandbill] ` +
                  `WHERE ${LIVE_BILL} AND ${dateCond("s.[date]", range)} AND ${dateCond("l.[date]", range)} AND (${CARD} IS NOT NULL OR ${NAME} IS NOT NULL) ` +
                  `GROUP BY ${PARTY_KEY}, UPPER(LTRIM(RTRIM(l.[p_name])))`
                : `SELECT TOP (${ITEM_ROW_CAP + 1}) UPPER(g.[sup]) AS pkey, MAX(g.[sup]) AS name, UPPER(LTRIM(RTRIM(p.[pname]))) AS item, ` +
                  `COUNT(DISTINCT p.[grn_no]) AS docs, ISNULL(SUM(ISNULL(TRY_CAST(p.[qty] AS float), 0) + ISNULL(TRY_CAST(p.[fqty] AS float), 0)), 0) AS qty, ` +
                  `ISNULL(SUM(TRY_CAST(p.[net_amount] AS float)), 0) AS value, CONVERT(varchar(10), MAX(p.[entry_date]), 23) AS lastDate ` +
                  `FROM dbo.[purentrydetails] AS p JOIN (SELECT [grn_no] AS grn, MAX(ISNULL(NULLIF(LTRIM(RTRIM([suplier_name])), ''), 'Unknown supplier')) AS sup FROM dbo.[purgrnentry] GROUP BY [grn_no]) AS g ON g.[grn] = p.[grn_no] ` +
                  `WHERE p.[STATUS] IS NULL AND ${dateCond("p.[entry_date]", range)} ` +
                  `GROUP BY UPPER(g.[sup]), UPPER(LTRIM(RTRIM(p.[pname])))`;
        const raw = await run(sql, params);
        const truncated = raw.length > ITEM_ROW_CAP;
        if (type === "supplier") {
            // Purchase returns (PurchaseReturnDetails lines, supplier from the return header) are netted off per product.
            const rp: QueryParam[] = [];
            dateParams(range, rp);
            const rets = await optional(
                `SELECT UPPER(h.[sup]) AS pkey, MAX(h.[sup]) AS name, UPPER(LTRIM(RTRIM(d.[pname]))) AS item, ` +
                    `ISNULL(SUM(ISNULL(TRY_CAST(d.[qty] AS float), 0) + ISNULL(TRY_CAST(d.[fqty] AS float), 0)), 0) AS qty, ISNULL(SUM(TRY_CAST(d.[net_amount] AS float)), 0) AS value ` +
                    `FROM dbo.[PurchaseReturnDetails] AS d JOIN (SELECT [grn_no] AS doc, MAX(ISNULL(NULLIF(LTRIM(RTRIM([suplier_name])), ''), 'Unknown supplier')) AS sup, MIN([entry_date]) AS d FROM dbo.[PurchaseReturnHeader] GROUP BY [grn_no]) AS h ON h.[doc] = d.[grn_no] ` +
                    `WHERE ${dateCond("h.[d]", range)} GROUP BY UPPER(h.[sup]), UPPER(LTRIM(RTRIM(d.[pname])))`,
                rp,
            );
            const idx = new Map(raw.map((r, i) => [`${str(r.pkey)}|${str(r.item)}`, i]));
            for (const r of rets.rows) {
                const k = `${str(r.pkey)}|${str(r.item)}`;
                const i = idx.get(k);
                if (i !== undefined) {
                    raw[i].qty = num(raw[i].qty) - num(r.qty);
                    raw[i].value = num(raw[i].value) - num(r.value);
                    raw[i].returned = num(r.qty);
                } else {
                    raw.push({ pkey: r.pkey, name: r.name, item: r.item, docs: 0, qty: -num(r.qty), value: -num(r.value), lastDate: null, returned: num(r.qty) });
                }
            }
        }
        const rows: PartyItemRow[] = raw.slice(0, ITEM_ROW_CAP).map((r) => {
            const qty = num(r.qty);
            const value = num(r.value);
            return {
                partyKey: type === "customer" ? str(r.pkey) : `S:${str(r.pkey)}`,
                party: str(r.name) || (r.card ? `Card ${str(r.card)}` : "Unknown"),
                code: str(r.card),
                item: str(r.item) || "(no name)",
                docs: num(r.docs),
                qty: round3(qty),
                value: round2(value),
                avgRate: qty ? round2(value / qty) : 0,
                lastDate: r.lastDate ? String(r.lastDate) : null,
                returnedQty: round3(num(r.returned)),
            };
        });
        return { rows, truncated };
    });
    const t = tableQuery(data.rows, q, {
        searchIn: (r) => [r.party, r.code, r.item],
        sortable: { party: (r) => r.party, item: (r) => r.item, docs: (r) => r.docs, qty: (r) => r.qty, value: (r) => r.value, avgRate: (r) => r.avgRate, lastDate: (r) => r.lastDate },
        fallback: (a, b) => a.party.localeCompare(b.party) || b.value - a.value,
        tieBreak: (r) => `${r.partyKey}|${r.item}`,
    });
    const m = t.matched;
    return {
        asOf,
        type,
        range,
        defaultRange: !(given.from || given.to),
        truncated: data.truncated,
        totals: {
            rows: m.length,
            parties: new Set(m.map((r) => r.partyKey)).size,
            items: new Set(m.map((r) => r.item)).size,
            qty: round3(m.reduce((s, r) => s + r.qty, 0)),
            value: round2(m.reduce((s, r) => s + r.value, 0)),
        },
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        salesReturnEntries: type === "customer" ? await salesReturnEntries() : null,
        source: "sql",
    };
}

/* -------------------------------------------------------------------------------------------- Party-Wise P&L */

interface PartyPnlRow {
    key: string;
    party: string;
    code: string;
    city: string;
    group: string;
    walkIn: boolean;
    bills: number;
    grossSales: number; // bill totals incl. GST (same as Sales by Party)
    gst: number;
    netSales: number; // excl. GST
    cost: number; // qty x purchase rate (excl. GST) of each barcode sold
    profit: number; // on sales whose cost is known
    marginPct: number | null;
    costCoveragePct: number; // share of sales value whose barcode has a purchase rate
}

/**
 * Gross profit per customer: sales excluding GST minus the purchase rate (excluding GST) of every barcode sold --
 * one barcode is one purchase lot, so its prate is the actual cost. Lines whose barcode has no purchase rate are
 * left out of BOTH sales and cost (never counted as zero-cost sales) and reported as coverage.
 */
export async function sqlPartyPnl(q: PartyReportQuery): Promise<Doc> {
    const range = dateRange(q);
    const rows = await cached(`party-pnl:${range.from}:${range.to}`, q.refresh === "1", async () => {
        const params: QueryParam[] = [];
        dateParams(range, params);
        const [groups, raw] = await Promise.all([
            customerGroups(),
            run(
                `SELECT COALESCE(${PARTY_KEY}, '~WALKIN') AS pkey, MAX(${CARD}) AS card, MAX(${NAME}) AS name, MAX(NULLIF(LTRIM(RTRIM(s.[city])), '')) AS city, ` +
                    `MAX(NULLIF(LTRIM(RTRIM(s.[cus_cat])), '')) AS cat, COUNT(*) AS bills, ISNULL(SUM(TRY_CAST(s.[tot_netamnt] AS float)), 0) AS gross, ` +
                    `ISNULL(SUM(ISNULL(TRY_CAST(s.[gst5] AS float), 0) + ISNULL(TRY_CAST(s.[gst12] AS float), 0) + ISNULL(TRY_CAST(s.[gst18] AS float), 0) + ISNULL(TRY_CAST(s.[gst28] AS float), 0)), 0) AS gst, ` +
                    `ISNULL(SUM(c.[cost]), 0) AS cost, ISNULL(SUM(c.[lineValue]), 0) AS lineValue, ISNULL(SUM(c.[uncosted]), 0) AS uncosted ` +
                    `FROM dbo.[sales2] AS s LEFT JOIN (` +
                    `SELECT l.[systemidbill] AS id, SUM(ISNULL(TRY_CAST(l.[qty] AS float), 0) * sd.[prate]) AS cost, SUM(ISNULL(TRY_CAST(l.[net_amount] AS float), 0)) AS lineValue, ` +
                    `SUM(CASE WHEN sd.[prate] IS NULL THEN ISNULL(TRY_CAST(l.[net_amount] AS float), 0) ELSE 0 END) AS uncosted ` +
                    `FROM dbo.[salsntry] AS l LEFT JOIN (SELECT [barcode] AS bc, MAX(NULLIF(TRY_CAST([prate] AS float), 0)) AS prate FROM dbo.[stockdetails] GROUP BY [barcode]) AS sd ON sd.[bc] = l.[barcode] ` +
                    `WHERE ${dateCond("l.[date]", range)} GROUP BY l.[systemidbill]) AS c ON c.[id] = s.[sysidandbill] ` +
                    `WHERE ${LIVE_BILL} AND ${dateCond("s.[date]", range)} GROUP BY COALESCE(${PARTY_KEY}, '~WALKIN')`,
                params,
            ),
        ]);
        return raw.map((r): PartyPnlRow => {
            const walkIn = str(r.pkey) === "~WALKIN";
            const gross = num(r.gross);
            const gst = num(r.gst);
            const net = gross - gst;
            const lineValue = num(r.lineValue);
            // Share of the bill value whose lines have a known cost (line values are GST-inclusive, like the bill).
            const covered = lineValue > 0 ? Math.max(0, Math.min(1, (lineValue - num(r.uncosted)) / lineValue)) : 0;
            const cost = num(r.cost);
            const costedNet = net * covered;
            const profit = costedNet - cost;
            return {
                key: str(r.pkey),
                party: walkIn ? "Walk-in (no customer)" : str(r.name) || `Card ${str(r.card)}`,
                code: walkIn ? "" : str(r.card),
                city: walkIn ? "" : str(r.city),
                group: walkIn ? "" : groupOf(groups, r.cat),
                walkIn,
                bills: num(r.bills),
                grossSales: round2(gross),
                gst: round2(gst),
                netSales: round2(net),
                cost: round2(cost),
                profit: round2(profit),
                marginPct: costedNet > 0 ? Math.round((profit / costedNet) * 1000) / 10 : null,
                costCoveragePct: Math.round(covered * 1000) / 10,
            };
        });
    });
    const t = tableQuery(rows, q, {
        searchIn: (r) => [r.party, r.code, r.city, r.group],
        sortable: { party: (r) => r.party, bills: (r) => r.bills, netSales: (r) => r.netSales, cost: (r) => r.cost, profit: (r) => r.profit, marginPct: (r) => r.marginPct, costCoveragePct: (r) => r.costCoveragePct },
        fallback: (a, b) => b.profit - a.profit,
        tieBreak: (r) => r.key,
    });
    const sum = (list: PartyPnlRow[], k: keyof PartyPnlRow) => round2(list.reduce((s, r) => s + (r[k] as number), 0));
    const m = t.matched;
    const costedNet = m.reduce((s, r) => s + (r.netSales * r.costCoveragePct) / 100, 0);
    const profit = sum(m, "profit");
    return {
        asOf: await shopAsOf(),
        range,
        totals: {
            parties: m.filter((r) => !r.walkIn).length,
            bills: m.reduce((s, r) => s + r.bills, 0),
            grossSales: sum(m, "grossSales"),
            gst: sum(m, "gst"),
            netSales: sum(m, "netSales"),
            cost: sum(m, "cost"),
            profit,
            marginPct: costedNet > 0 ? Math.round((profit / costedNet) * 1000) / 10 : null,
            costCoveragePct: sum(m, "netSales") > 0 ? Math.round((costedNet / sum(m, "netSales")) * 1000) / 10 : 0,
        },
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        salesReturnEntries: await salesReturnEntries(),
        source: "sql",
    };
}

/* ------------------------------------------------------------------------------------------ Party Statement */

interface StatementEntry {
    date: string;
    doc: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

/**
 * Ledger for one party (key from All Parties / the picker).
 *   Customer ("<card>" or "N:<NAME>"): Debit = bill amount; Credit = paid at billing (bill total - credit part) and
 *     later credit payments (CustomerCreditPaymentEntry, cash + cheque). Balance = receivable.
 *   Supplier ("S:<NAME>"): Credit = GRN net total (payable); Debit = payment. Every shop GRN is CASH, so each GRN is
 *     paid the same day. Opening balance comes from the supplier master. Balance = payable.
 * Entries before `from` roll into the opening line. Nothing is invented: no payment is assumed that isn't recorded.
 */
export async function sqlPartyStatement(q: PartyReportQuery & { key?: string }): Promise<Doc> {
    const key = str(q.key);
    if (!key) return { asOf: await shopAsOf(), party: null, entries: [], source: "sql" };
    const range = dateRange(q);
    const isSupplier = key.startsWith("S:");
    const all: (Omit<StatementEntry, "balance"> & { order: number })[] = [];
    let party: Doc;
    let openingMaster = 0;

    if (!isSupplier) {
        const params: QueryParam[] = [{ name: "k", value: key }];
        const [bills, pays] = await Promise.all([
            run(
                `SELECT s.[sysidandbill] AS id, s.[billno] AS billno, s.[mode] AS mode, CONVERT(varchar(10), s.[date], 23) AS d, s.[No] AS n, ` +
                    `${CARD} AS card, ${NAME} AS name, NULLIF(LTRIM(RTRIM(s.[city])), '') AS city, NULLIF(LTRIM(RTRIM(s.[mbl_no])), '') AS phone, ` +
                    `ISNULL(TRY_CAST(s.[tot_netamnt] AS float), 0) AS total, ISNULL(TRY_CAST(s.[s_credit_amt] AS float), 0) AS credit ` +
                    `FROM dbo.[sales2] AS s WHERE ${LIVE_BILL} AND ${PARTY_KEY} = @k ORDER BY s.[date], s.[No]`,
                params,
            ),
            run(
                `SELECT CONVERT(varchar(10), c.[date], 23) AS d, c.[sysbillid] AS bill, c.[pay_refeno] AS ref, ISNULL(TRY_CAST(c.[pay_amt] AS float), 0) AS cash, ` +
                    `ISNULL(TRY_CAST(c.[chek_amt] AS float), 0) AS cheque, c.[chek_num] AS chq, c.[ID] AS n FROM dbo.[CustomerCreditPaymentEntry] AS c ` +
                    `WHERE c.[sysbillid] IN (SELECT s.[sysidandbill] FROM dbo.[sales2] AS s WHERE ${LIVE_BILL} AND ${PARTY_KEY} = @k) ORDER BY c.[date], c.[ID]`,
                params,
            ),
        ]);
        const first = bills.find((b) => b.name || b.card) ?? bills[0];
        party = { key, type: "Customer", name: str(first?.name) || (first?.card ? `Card ${str(first.card)}` : key), code: str(first?.card), city: str(bills.find((b) => b.city)?.city), phone: str(bills.find((b) => b.phone)?.phone) };
        for (const b of bills) {
            const total = num(b.total);
            const credit = Math.min(Math.max(0, num(b.credit)), total);
            const doc = `Bill ${str(b.mode)}${str(b.billno)}`;
            all.push({ date: str(b.d), doc, description: "Sale", debit: round2(total), credit: 0, order: num(b.n) * 10 });
            if (total - credit > 0.004) all.push({ date: str(b.d), doc, description: credit > 0 ? "Paid at billing (part)" : "Paid at billing", debit: 0, credit: round2(total - credit), order: num(b.n) * 10 + 1 });
        }
        for (const p of pays) {
            const amt = num(p.cash) + num(p.cheque);
            if (amt <= 0) continue;
            all.push({ date: str(p.d), doc: str(p.ref) || `Receipt ${str(p.n)}`, description: `Credit payment for bill ${str(p.bill)}${num(p.cheque) ? ` (cheque ${str(p.chq)})` : " (cash)"}`, debit: 0, credit: round2(amt), order: 1e12 + num(p.n) });
        }
    } else {
        const name = key.slice(2);
        const params: QueryParam[] = [{ name: "k", value: name }];
        const rets = await optional(
            `SELECT r.[grn_no] AS doc, CONVERT(varchar(10), r.[entry_date], 23) AS d, r.[ID] AS n, UPPER(LTRIM(RTRIM(r.[pay_type]))) AS pay, ISNULL(TRY_CAST(r.[totnetamot] AS float), 0) AS total ` +
                `FROM dbo.[PurchaseReturnHeader] AS r WHERE UPPER(LTRIM(RTRIM(r.[suplier_name]))) = @k ORDER BY r.[entry_date], r.[ID]`,
            params,
        );
        const [grns, master] = await Promise.all([
            run(
                `SELECT g.[grn_no] AS grn, CONVERT(varchar(10), g.[entry_date], 23) AS d, g.[ID] AS n, UPPER(LTRIM(RTRIM(g.[pay_type]))) AS pay, ` +
                    `ISNULL(TRY_CAST(g.[totnetamot] AS float), 0) AS total, g.[suplier_name] AS name, NULLIF(LTRIM(RTRIM(g.[Supplier_City])), '') AS city ` +
                    `FROM dbo.[purgrnentry] AS g WHERE UPPER(LTRIM(RTRIM(g.[suplier_name]))) = @k ORDER BY g.[entry_date], g.[ID]`,
                params,
            ),
            run(
                `SELECT MAX(TRY_CAST([opening_amount] AS float)) AS opening, MAX(NULLIF(LTRIM(RTRIM([city])), '')) AS city, MAX(NULLIF(LTRIM(RTRIM(ISNULL(NULLIF([mb_nu], ''), [phone_nu]))), '')) AS phone ` +
                    `FROM dbo.[supplierdetail] WHERE UPPER(LTRIM(RTRIM([sup_name]))) = @k`,
                params,
            ),
        ]);
        openingMaster = round2(num(master[0]?.opening));
        party = { key, type: "Supplier", name: str(grns[0]?.name) || name, code: "", city: str(master[0]?.city) || str(grns.find((g) => g.city)?.city), phone: str(master[0]?.phone) };
        for (const g of grns) {
            const total = num(g.total);
            const doc = `GRN ${str(g.grn)}`;
            all.push({ date: str(g.d), doc, description: "Purchase", debit: 0, credit: round2(total), order: num(g.n) * 10 });
            if (str(g.pay) === "CASH" && total > 0) all.push({ date: str(g.d), doc, description: "Paid (cash purchase)", debit: round2(total), credit: 0, order: num(g.n) * 10 + 1 });
        }
        // Purchase returns reduce what we owe; a cash return is refunded the same day.
        for (const r of rets.rows) {
            const total = num(r.total);
            if (total <= 0) continue;
            const doc = `Return ${str(r.doc)}`;
            all.push({ date: str(r.d), doc, description: "Purchase return", debit: round2(total), credit: 0, order: 5e11 + num(r.n) * 10 });
            if (str(r.pay) === "CASH") all.push({ date: str(r.d), doc, description: "Refund received (cash)", debit: 0, credit: round2(total), order: 5e11 + num(r.n) * 10 + 1 });
        }
    }

    all.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
    // Customer balance = receivable (debit - credit); supplier balance = payable (credit - debit).
    const sign = isSupplier ? -1 : 1;
    let balance = isSupplier ? openingMaster : 0;
    let openingDr = 0, openingCr = 0;
    const entries: StatementEntry[] = [];
    let periodDr = 0, periodCr = 0;
    for (const e of all) {
        if (range.from && e.date < range.from) {
            openingDr += e.debit;
            openingCr += e.credit;
            balance += sign * (e.debit - e.credit);
            continue;
        }
        if (range.to && e.date > range.to) continue;
        balance += sign * (e.debit - e.credit);
        periodDr += e.debit;
        periodCr += e.credit;
        entries.push({ date: e.date, doc: e.doc, description: e.description, debit: e.debit, credit: e.credit, balance: round2(balance) });
    }
    const opening = round2((isSupplier ? openingMaster : 0) + sign * (openingDr - openingCr));
    return {
        asOf: await shopAsOf(),
        range,
        party,
        balanceMeaning: isSupplier ? "payable" : "receivable",
        opening,
        openingFromMaster: isSupplier ? openingMaster : null,
        totals: { debit: round2(periodDr), credit: round2(periodCr), closing: round2(opening + sign * (periodDr - periodCr)) },
        entries: entries.slice(-5000),
        truncated: entries.length > 5000,
        source: "sql",
    };
}

/* ----------------------------------------------------------------------------------- Purchase by Party Group */

/**
 * Purchase by Party grouped by supplier group. Textilesoft has no supplier groups; the group is the one set on the
 * ERP supplier (Suppliers page) with the same business name. Suppliers without one are "Unassigned".
 */
export async function sqlPurchaseByPartyGroup(q: PartyReportQuery, tenantId: string): Promise<Doc> {
    const range = dateRange(q);
    const [rows, erp] = await Promise.all([
        purchaseRows(range, q.refresh === "1"),
        Supplier.find({ tenantId: String(tenantId), supplierGroup: { $nin: [null, ""] } }, { businessName: 1, supplierGroup: 1 }).lean() as Promise<Doc[]>,
    ]);
    const groupOfSupplier = new Map(erp.map((s) => [str(s.businessName).toUpperCase(), str(s.supplierGroup)]));
    const acc = new Map<string, { group: string; assigned: boolean; suppliers: number; grns: number; qty: number; value: number; returnValue: number; netValue: number }>();
    for (const r of rows) {
        const g = groupOfSupplier.get(r.supplier.toUpperCase()) || "Unassigned";
        const a = acc.get(g) ?? { group: g, assigned: g !== "Unassigned", suppliers: 0, grns: 0, qty: 0, value: 0, returnValue: 0, netValue: 0 };
        a.suppliers += 1;
        a.grns += r.grns;
        a.qty += r.qty;
        a.value += r.value;
        a.returnValue += r.returnValue;
        a.netValue += r.netValue;
        acc.set(g, a);
    }
    const total = rows.reduce((s, r) => s + r.netValue, 0);
    const items = [...acc.values()].map((g) => ({ ...g, qty: round3(g.qty), value: round2(g.value), returnValue: round2(g.returnValue), netValue: round2(g.netValue), sharePct: total > 0 ? Math.round((g.netValue / total) * 1000) / 10 : 0 }));
    const t = tableQuery(items, { ...q, limit: 200 }, {
        searchIn: (r) => [r.group],
        sortable: { group: (r) => r.group, suppliers: (r) => r.suppliers, grns: (r) => r.grns, qty: (r) => r.qty, value: (r) => r.value, returnValue: (r) => r.returnValue, netValue: (r) => r.netValue },
        fallback: (a, b) => (a.assigned === b.assigned ? b.netValue - a.netValue : a.assigned ? -1 : 1),
        tieBreak: (r) => r.group,
    });
    const unassigned = items.find((g) => !g.assigned);
    return {
        asOf: await shopAsOf(),
        range,
        totals: { groups: items.filter((g) => g.assigned).length, suppliers: rows.length, grns: rows.reduce((s, r) => s + r.grns, 0), value: round2(rows.reduce((s, r) => s + r.value, 0)), returnValue: round2(rows.reduce((s, r) => s + r.returnValue, 0)), netValue: round2(total) },
        unassigned: unassigned ? { suppliers: unassigned.suppliers, value: unassigned.netValue } : { suppliers: 0, value: 0 },
        items: t.items,
        sort: t.sort,
        dir: t.dir,
        source: "sql",
    };
}
