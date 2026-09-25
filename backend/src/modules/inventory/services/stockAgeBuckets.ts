/**
 * Stock age by calendar-month bucket ("purchased but not sold").
 *
 * Rule (SQL mode): every barcode is one purchase lot, so a lot's remaining stock IS the unsold part of that
 * purchase -- no FIFO split is needed. Age = calendar months between the purchase month and the report month
 * (`asOf`, the newest sale in the shop data), i.e. SQL Server's DATEDIFF(month, entry_date, asOf).
 *
 * Buckets: this month, 1, 2, 3, 4, 5, 6-11, 12+ months, plus "unknown" for lots with no purchase record.
 * Pure functions only -- no DB access -- so the SQL and Mongo paths share the exact same bucketing.
 */

export type StockAgeBucketKey = "0" | "1" | "2" | "3" | "4" | "5" | "6-11" | "12+" | "unknown";

export const STOCK_AGE_BUCKETS: { key: StockAgeBucketKey; from: number | null; to: number | null }[] = [
    { key: "0", from: 0, to: 0 },
    { key: "1", from: 1, to: 1 },
    { key: "2", from: 2, to: 2 },
    { key: "3", from: 3, to: 3 },
    { key: "4", from: 4, to: 4 },
    { key: "5", from: 5, to: 5 },
    { key: "6-11", from: 6, to: 11 },
    { key: "12+", from: 12, to: null },
    { key: "unknown", from: null, to: null },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses yyyy-mm-dd (or an ISO timestamp) into {y, m} with m = 0..11; undefined when not a date. */
function ym(date: string | null | undefined): { y: number; m: number } | undefined {
    const match = typeof date === "string" ? /^(\d{4})-(\d{2})/.exec(date) : null;
    if (!match) return undefined;
    const m = Number(match[2]) - 1;
    return m >= 0 && m <= 11 ? { y: Number(match[1]), m } : undefined;
}

/** Calendar months from `purchaseDate` to `asOf` (same as DATEDIFF(month, ...)), never negative; null if unknown. */
export function monthsBetween(purchaseDate: string | null | undefined, asOf: string): number | null {
    const a = ym(purchaseDate);
    const b = ym(asOf);
    if (!a || !b) return null;
    return Math.max(0, (b.y - a.y) * 12 + (b.m - a.m));
}

export function bucketFor(ageMonths: number | null): StockAgeBucketKey {
    if (ageMonths === null || !Number.isFinite(ageMonths)) return "unknown";
    if (ageMonths <= 5) return String(Math.max(0, Math.floor(ageMonths))) as StockAgeBucketKey;
    return ageMonths <= 11 ? "6-11" : "12+";
}

/** "Sep 2026" for the month `back` calendar months before asOf. */
export function monthLabel(asOf: string, back: number): string {
    const b = ym(asOf);
    if (!b) return "";
    const total = b.y * 12 + b.m - back;
    return `${MONTHS[((total % 12) + 12) % 12]} ${Math.floor(total / 12)}`;
}

export function bucketLabel(key: StockAgeBucketKey, asOf: string): { label: string; range: string } {
    switch (key) {
        case "unknown":
            return { label: "Unknown date", range: "No purchase record" };
        case "0":
            return { label: "This month", range: monthLabel(asOf, 0) };
        case "6-11":
            return { label: "6–11 months", range: `${monthLabel(asOf, 11)} – ${monthLabel(asOf, 6)}` };
        case "12+":
            return { label: "12+ months", range: `${monthLabel(asOf, 12)} & older` };
        default: {
            const n = Number(key);
            return { label: `${n} month${n === 1 ? "" : "s"}`, range: monthLabel(asOf, n) };
        }
    }
}

/** One lot (barcode) still holding stock. `remainingQty` is the effective stock (shop + ERP movements). */
export interface StockAgeLot {
    barcode: string;
    name: string;
    purchaseDate: string | null; // yyyy-mm-dd
    supplier: string;
    purchasedQty: number;
    soldQty: number;
    returnedQty: number;
    remainingQty: number;
    costPrice: number;
    // Used by the stock reports (stockReports.ts); optional so older callers still type-check.
    category?: string | null;
    brand?: string | null;
    sellingPrice?: number; // MRP
    lastSoldDate?: string | null; // yyyy-mm-dd, newest non-cancelled sale
    rack?: string | null; // stockdetails.rackno via mapping shelfCode
}

export interface StockAgeRow extends StockAgeLot {
    ageMonths: number | null;
    bucket: StockAgeBucketKey;
    purchaseMonth: string; // "Jun 2026"
    value: number;
}

export interface StockAgeSummaryBucket {
    key: StockAgeBucketKey;
    label: string;
    range: string;
    lots: number;
    qty: number;
    value: number;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Adds age, bucket and value to each lot with stock left; drops lots with nothing remaining. */
export function classifyLots(lots: StockAgeLot[], asOf: string): StockAgeRow[] {
    return lots
        .filter((l) => l.remainingQty > 0)
        .map((l) => {
            const ageMonths = monthsBetween(l.purchaseDate, asOf);
            const back = ageMonths ?? 0;
            return {
                ...l,
                ageMonths,
                bucket: bucketFor(ageMonths),
                purchaseMonth: ageMonths === null ? "" : monthLabel(asOf, back),
                value: round2(l.remainingQty * (l.costPrice || 0)),
            };
        });
}

/** Per-bucket totals over ALL rows (always every bucket, zero-filled, in display order). */
export function summarize(rows: StockAgeRow[], asOf: string): { buckets: StockAgeSummaryBucket[]; totals: { lots: number; qty: number; value: number } } {
    const acc = new Map<StockAgeBucketKey, { lots: number; qty: number; value: number }>();
    for (const b of STOCK_AGE_BUCKETS) acc.set(b.key, { lots: 0, qty: 0, value: 0 });
    let lots = 0, qty = 0, value = 0;
    for (const r of rows) {
        const a = acc.get(r.bucket)!;
        a.lots += 1;
        a.qty += r.remainingQty;
        a.value += r.value;
        lots += 1;
        qty += r.remainingQty;
        value += r.value;
    }
    return {
        buckets: STOCK_AGE_BUCKETS.map(({ key }) => {
            const a = acc.get(key)!;
            return { key, ...bucketLabel(key, asOf), lots: a.lots, qty: round3(a.qty), value: round2(a.value) };
        }),
        totals: { lots, qty: round3(qty), value: round2(value) },
    };
}

export interface StockAgeQuery {
    bucket?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
    month?: string; // one purchase month, YYYY-MM (wins over bucket)
    sort?: string; // name | supplier | purchaseDate | purchasedQty | soldQty | returnedQty | remainingQty | value
    dir?: string; // asc | desc
    from?: string; // purchase date range, yyyy-mm-dd (inclusive)
    to?: string;
}

const isoDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/**
 * Keeps lots purchased within [from, to] (inclusive, yyyy-mm-dd). Invalid dates are ignored; if from > to they
 * are swapped. With any bound set, lots with no purchase date ("unknown") are excluded -- they can't be placed.
 */
export function filterByPurchaseDate(rows: StockAgeRow[], q: Pick<StockAgeQuery, "from" | "to">): { rows: StockAgeRow[]; from: string | null; to: string | null } {
    let from = isoDate(q.from) ?? null;
    let to = isoDate(q.to) ?? null;
    if (from && to && from > to) [from, to] = [to, from];
    if (!from && !to) return { rows, from, to };
    return {
        rows: rows.filter((r) => !!r.purchaseDate && (!from || r.purchaseDate >= from) && (!to || r.purchaseDate <= to)),
        from,
        to,
    };
}

/** Filters (bucket + search), sorts oldest first and paginates. */
/** Month key "YYYY-MM" of a lot's purchase date, or null. */
const monthKey = (r: StockAgeRow): string | null => (r.purchaseDate && /^\d{4}-\d{2}/.test(r.purchaseDate) ? r.purchaseDate.slice(0, 7) : null);

export interface StockAgeMonth {
    key: string; // "2025-06"
    label: string; // "Jun 2025"
    ageMonths: number;
    bucket: StockAgeBucketKey;
    lots: number;
    qty: number;
    value: number;
}

/** Every purchase month that still has unsold stock, newest first (for the month dropdown). */
export function summarizeMonths(rows: StockAgeRow[]): StockAgeMonth[] {
    const acc = new Map<string, StockAgeMonth>();
    for (const r of rows) {
        const key = monthKey(r);
        if (!key || r.ageMonths === null) continue;
        let m = acc.get(key);
        if (!m) {
            m = { key, label: r.purchaseMonth, ageMonths: r.ageMonths, bucket: r.bucket, lots: 0, qty: 0, value: 0 };
            acc.set(key, m);
        }
        m.lots += 1;
        m.qty += r.remainingQty;
        m.value += r.value;
    }
    return [...acc.values()]
        .map((m) => ({ ...m, qty: round3(m.qty), value: round2(m.value) }))
        .sort((a, b) => b.key.localeCompare(a.key));
}

export interface StockAgeSelection {
    kind: "all" | "bucket" | "month";
    key: string; // "all", a bucket key, or "YYYY-MM"
}

/** Resolves ?month= (wins when valid) or ?bucket= into one selection. */
export function resolveSelection(q: StockAgeQuery): StockAgeSelection {
    if (typeof q.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(q.month)) return { kind: "month", key: q.month };
    if (STOCK_AGE_BUCKETS.some((b) => b.key === q.bucket)) return { kind: "bucket", key: q.bucket as string };
    return { kind: "all", key: "all" };
}

export function inSelection(r: StockAgeRow, sel: StockAgeSelection): boolean {
    return sel.kind === "all" || (sel.kind === "bucket" ? r.bucket === sel.key : monthKey(r) === sel.key);
}

export interface StockAgeDetail {
    lots: number;
    unsoldQty: number;
    value: number;
    purchasedQty: number;
    soldQty: number;
    returnedQty: number;
    sellThroughPct: number | null; // sold / purchased, over the lots still holding stock
    suppliers: { name: string; lots: number; qty: number; value: number }[]; // top 5 by unsold value
}

/** Totals for the selected month/bucket (all its lots, before search and paging). */
export function selectionDetail(rows: StockAgeRow[]): StockAgeDetail {
    let unsoldQty = 0, value = 0, purchasedQty = 0, soldQty = 0, returnedQty = 0;
    const sup = new Map<string, { name: string; lots: number; qty: number; value: number }>();
    for (const r of rows) {
        unsoldQty += r.remainingQty;
        value += r.value;
        purchasedQty += r.purchasedQty;
        soldQty += r.soldQty;
        returnedQty += r.returnedQty;
        const name = r.supplier || "Unknown supplier";
        const s = sup.get(name) ?? { name, lots: 0, qty: 0, value: 0 };
        s.lots += 1;
        s.qty += r.remainingQty;
        s.value += r.value;
        sup.set(name, s);
    }
    return {
        lots: rows.length,
        unsoldQty: round3(unsoldQty),
        value: round2(value),
        purchasedQty: round3(purchasedQty),
        soldQty: round3(soldQty),
        returnedQty: round3(returnedQty),
        sellThroughPct: purchasedQty > 0 ? Math.round((soldQty / purchasedQty) * 1000) / 10 : null,
        suppliers: [...sup.values()]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((x) => ({ ...x, qty: round3(x.qty), value: round2(x.value) })),
    };
}

/** Sortable columns of the Aged Stock lot table. */
const AGE_SORT: Record<string, (r: StockAgeRow) => string | number | null> = {
    name: (r) => r.name,
    supplier: (r) => r.supplier,
    purchaseDate: (r) => r.purchaseDate,
    purchasedQty: (r) => r.purchasedQty,
    soldQty: (r) => r.soldQty,
    returnedQty: (r) => r.returnedQty,
    remainingQty: (r) => r.remainingQty,
    value: (r) => r.value,
};

/** Filters (selection + search), sorts (?sort=&dir=, default oldest first) and paginates. */
export function pageRows(rows: StockAgeRow[], q: StockAgeQuery): { items: StockAgeRow[]; pagination: { page: number; limit: number; total: number; pages: number }; bucket: StockAgeBucketKey | "all"; selection: StockAgeSelection; detail: StockAgeDetail } {
    const selection = resolveSelection(q);
    const selected = rows.filter((r) => inSelection(r, selection));
    const term = (q.search ?? "").trim().toLowerCase();
    const byDefault = (a: StockAgeRow, b: StockAgeRow) =>
        (b.ageMonths ?? -1) - (a.ageMonths ?? -1) || // oldest first, unknown dates last
        String(a.purchaseDate ?? "").localeCompare(String(b.purchaseDate ?? "")) ||
        a.barcode.localeCompare(b.barcode);
    const col = q.sort && Object.prototype.hasOwnProperty.call(AGE_SORT, q.sort) ? AGE_SORT[q.sort] : null;
    const sign = q.dir === "asc" ? 1 : -1;
    const blank = (v: unknown) => v === null || v === undefined || v === "";
    const filtered = selected
        .filter((r) => !term || r.name.toLowerCase().includes(term) || r.barcode.toLowerCase().includes(term) || r.supplier.toLowerCase().includes(term))
        .sort(!col ? byDefault : (a, b) => {
            const va = col(a), vb = col(b);
            if (blank(va) !== blank(vb)) return blank(va) ? 1 : -1; // blanks last either way
            const c = blank(va) ? 0 : typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
            return c * sign || a.barcode.localeCompare(b.barcode);
        });
    const limit = Math.min(200, Math.max(1, parseInt(String(q.limit)) || 50));
    const pages = Math.max(1, Math.ceil(filtered.length / limit));
    const page = Math.min(pages, Math.max(1, parseInt(String(q.page)) || 1));
    return {
        items: filtered.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: filtered.length, pages },
        bucket: selection.kind === "bucket" ? (selection.key as StockAgeBucketKey) : "all",
        selection,
        detail: selectionDetail(selected),
    };
}
