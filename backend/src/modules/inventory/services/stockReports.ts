/**
 * Inventory reports built from the same per-lot snapshot as Aged Stock (stockAgeBuckets.ts), so every
 * stock report agrees on one number: shop stock + ERP movements, one row per barcode (purchase lot).
 * Pure functions only -- no DB access.
 */
import { filterByPurchaseDate, type StockAgeRow } from "./stockAgeBuckets.js";

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export interface StockGroup {
    key: string;
    lots: number;
    qty: number;
    costValue: number;
    mrpValue: number;
}

const mrp = (r: StockAgeRow): number => r.remainingQty * (r.sellingPrice || 0);

/** Groups rows by a label; sorted by cost value, optionally keeping the top N and folding the rest into "Others". */
export function groupBy(rows: StockAgeRow[], label: (r: StockAgeRow) => string, top?: number): StockGroup[] {
    const acc = new Map<string, StockGroup>();
    for (const r of rows) {
        const key = label(r).trim() || "Unassigned";
        const g = acc.get(key) ?? { key, lots: 0, qty: 0, costValue: 0, mrpValue: 0 };
        g.lots += 1;
        g.qty += r.remainingQty;
        g.costValue += r.value;
        g.mrpValue += mrp(r);
        acc.set(key, g);
    }
    let out = [...acc.values()].sort((a, b) => b.costValue - a.costValue || a.key.localeCompare(b.key));
    if (top && out.length > top) {
        const rest = out.slice(top);
        const others: StockGroup = { key: `Others (${rest.length})`, lots: 0, qty: 0, costValue: 0, mrpValue: 0 };
        for (const g of rest) {
            others.lots += g.lots;
            others.qty += g.qty;
            others.costValue += g.costValue;
            others.mrpValue += g.mrpValue;
        }
        out = [...out.slice(0, top), others];
    }
    return out.map((g) => ({ ...g, qty: round3(g.qty), costValue: round2(g.costValue), mrpValue: round2(g.mrpValue) }));
}

function totalsOf(rows: StockAgeRow[]): { lots: number; qty: number; costValue: number; mrpValue: number } {
    let qty = 0, costValue = 0, mrpValue = 0;
    for (const r of rows) {
        qty += r.remainingQty;
        costValue += r.value;
        mrpValue += mrp(r);
    }
    return { lots: rows.length, qty: round3(qty), costValue: round2(costValue), mrpValue: round2(mrpValue) };
}

const category = (r: StockAgeRow): string => r.category ?? "";
const brand = (r: StockAgeRow): string => r.brand ?? "";

interface PageQuery {
    search?: string;
    category?: string;
    sort?: string; // column key, see SORTABLE
    dir?: string; // "asc" | "desc"
    page?: string | number;
    limit?: string | number;
}

function paginate<T>(rows: T[], q: PageQuery): { items: T[]; pagination: { page: number; limit: number; total: number; pages: number } } {
    const limit = Math.min(200, Math.max(1, parseInt(String(q.limit)) || 50));
    const pages = Math.max(1, Math.ceil(rows.length / limit));
    const page = Math.min(pages, Math.max(1, parseInt(String(q.page)) || 1));
    return { items: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: rows.length, pages } };
}

function matches(r: StockAgeRow, q: PageQuery): boolean {
    const term = (q.search ?? "").trim().toLowerCase();
    if (q.category && (r.category ?? "Unassigned") !== q.category && !(q.category === "Unassigned" && !r.category)) return false;
    return !term || r.name.toLowerCase().includes(term) || r.barcode.toLowerCase().includes(term) || (r.brand ?? "").toLowerCase().includes(term) || r.supplier.toLowerCase().includes(term);
}

/** Sortable lot-list columns (whitelist: anything else falls back to the report's default order). */
const SORTABLE: Record<string, (r: any) => string | number | null> = {
    name: (r) => r.name,
    barcode: (r) => r.barcode,
    category: (r) => r.category ?? "",
    brand: (r) => r.brand ?? "",
    supplier: (r) => r.supplier ?? "",
    purchaseDate: (r) => r.purchaseDate,
    lastMovement: (r) => r.lastMovement,
    idleDays: (r) => r.idleDays,
    remainingQty: (r) => r.remainingQty,
    costPrice: (r) => r.costPrice,
    value: (r) => r.value,
};

/**
 * Sorts a lot list by ?sort=&dir= when the column is sortable, else by `fallback`. Blank values always go last;
 * ties keep a stable order by barcode, so paging never repeats or skips a lot.
 */
export function sortLots<T extends { barcode: string }>(rows: T[], q: { sort?: string; dir?: string }, fallback: (a: T, b: T) => number): { rows: T[]; sort: string | null; dir: "asc" | "desc" } {
    const pick = q.sort && Object.prototype.hasOwnProperty.call(SORTABLE, q.sort) ? SORTABLE[q.sort] : null;
    const dir = q.dir === "asc" ? "asc" : "desc";
    if (!pick) return { rows: [...rows].sort(fallback), sort: null, dir };
    const sign = dir === "asc" ? 1 : -1;
    const blank = (v: unknown) => v === null || v === undefined || v === "";
    const sorted = [...rows].sort((a, b) => {
        const va = pick(a), vb = pick(b);
        if (blank(va) !== blank(vb)) return blank(va) ? 1 : -1;
        let c = 0;
        if (!blank(va)) c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
        return c * sign || a.barcode.localeCompare(b.barcode);
    });
    return { rows: sorted, sort: q.sort!, dir };
}

const QTY_BANDS: { label: string; min: number; max: number }[] = [
    { label: "1 pc", min: 0, max: 1 },
    { label: "2–5 pcs", min: 1, max: 5 },
    { label: "6–10 pcs", min: 5, max: 10 },
    { label: "11–50 pcs", min: 10, max: 50 },
    { label: "51+ pcs", min: 50, max: Number.POSITIVE_INFINITY },
];

/** Stock Status: totals, value at cost and MRP, by category, by brand (top 15) and by pieces left per lot. */
export function stockStatus(rows: StockAgeRow[]) {
    const totals = totalsOf(rows);
    return {
        totals: { ...totals, potentialMargin: round2(totals.mrpValue - totals.costValue), categories: new Set(rows.map((r) => r.category || "Unassigned")).size },
        byCategory: groupBy(rows, category),
        byBrand: groupBy(rows, brand, 15),
        byQtyLeft: QTY_BANDS.map((b) => {
            const t = totalsOf(rows.filter((r) => r.remainingQty > b.min && r.remainingQty <= b.max));
            return { key: b.label, ...t };
        }),
    };
}

/** Low Stock: lots with 0 < pieces left <= threshold (default 2, the shop's configured low-stock limit). */
export function lowStock(rows: StockAgeRow[], q: PageQuery & { threshold?: string | number }, defaultThreshold = 2) {
    const t = Number(q.threshold);
    const threshold = Number.isFinite(t) && t > 0 ? Math.min(t, 1000) : defaultThreshold;
    const low = rows.filter((r) => r.remainingQty <= threshold);
    const sorted = sortLots(low.filter((r) => matches(r, q)), q, (a, b) => a.remainingQty - b.remainingQty || b.value - a.value || a.barcode.localeCompare(b.barcode));
    return { threshold, totals: totalsOf(low), totalLots: rows.length, byCategory: groupBy(low, category), sort: sorted.sort, dir: sorted.dir, ...paginate(sorted.rows, q) };
}

/** Whole days from yyyy-mm-dd `from` to `to` (UTC); null if either is missing. */
export function daysBetween(from: string | null | undefined, to: string): number | null {
    const a = typeof from === "string" ? Date.parse(`${from.slice(0, 10)}T00:00:00Z`) : NaN;
    const b = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.max(0, Math.round((b - a) / 86_400_000));
}

const IDLE_BANDS: { label: string; min: number; max: number }[] = [
    { label: "60–89 days", min: 60, max: 89 },
    { label: "90–179 days", min: 90, max: 179 },
    { label: "180–364 days", min: 180, max: 364 },
    { label: "1–2 years", min: 365, max: 729 },
    { label: "2+ years", min: 730, max: Number.POSITIVE_INFINITY },
];

export interface DeadStockRow extends StockAgeRow {
    idleDays: number;
    lastMovement: string; // date of the last sale, or the purchase date if never sold
    neverSold: boolean;
}

/**
 * Dead Stock (non-moving): lots with stock left and no sale for at least `days` (default 90), counted to asOf.
 * "Last movement" = last sale, or the purchase date if the lot never sold. Lots with neither date are counted
 * separately (they can't be aged) and not listed.
 */
export function deadStock(rows: StockAgeRow[], asOf: string, q: PageQuery & { days?: string | number }) {
    const d = Number(q.days);
    const days = Number.isFinite(d) && d >= 1 ? Math.min(Math.floor(d), 3650) : 90;
    let undated = 0;
    const aged: DeadStockRow[] = [];
    for (const r of rows) {
        const lastMovement = r.lastSoldDate || r.purchaseDate;
        const idle = daysBetween(lastMovement, asOf);
        if (idle === null) {
            undated += 1;
            continue;
        }
        if (idle >= days) aged.push({ ...r, idleDays: idle, lastMovement: String(lastMovement), neverSold: !r.lastSoldDate });
    }
    const sorted = sortLots(aged.filter((r) => matches(r, q)), q, (a, b) => b.idleDays - a.idleDays || b.value - a.value || a.barcode.localeCompare(b.barcode));
    const list = sorted.rows;
    const all = totalsOf(rows);
    const dead = totalsOf(aged);
    return {
        days,
        totals: { ...dead, neverSold: aged.filter((r) => r.neverSold).length, shareOfValuePct: all.costValue > 0 ? Math.round((dead.costValue / all.costValue) * 1000) / 10 : 0, undatedLots: undated },
        byIdle: IDLE_BANDS.map((b) => ({ key: b.label, ...totalsOf(aged.filter((r) => r.idleDays >= b.min && r.idleDays <= b.max)) })),
        byCategory: groupBy(aged, category),
        sort: sorted.sort,
        dir: sorted.dir,
        ...paginate(list, q),
    };
}

/** Rack-wise stock (rack = stockdetails.rackno). Also reports how much stock has no rack recorded. */
export function rackWise(rows: StockAgeRow[]) {
    const groups = groupBy(rows, (r) => r.rack ?? "", undefined);
    const unassigned = groups.find((g) => g.key === "Unassigned");
    const all = totalsOf(rows);
    return {
        rows: groups
            .sort((a, b) => (a.key === "Unassigned" ? 1 : b.key === "Unassigned" ? -1 : a.key.localeCompare(b.key, undefined, { numeric: true })))
            .map((g) => ({ rack: g.key, totalQty: g.qty, totalValue: g.costValue, itemCount: g.lots })),
        coverage: {
            racks: groups.filter((g) => g.key !== "Unassigned").length,
            lots: all.lots,
            lotsWithRack: all.lots - (unassigned?.lots ?? 0),
            valueWithRackPct: all.costValue > 0 ? Math.round(((all.costValue - (unassigned?.costValue ?? 0)) / all.costValue) * 1000) / 10 : 0,
        },
    };
}

/** City-wise stock for a single-store shop: every lot is in that store's city. */
export function singleCity(rows: StockAgeRow[], city: string) {
    const t = totalsOf(rows);
    return rows.length ? [{ city, totalQty: t.qty, totalValue: t.costValue, itemCount: t.lots, storeCount: 1 }] : [];
}

/* ------------------------------------------------------------------------------------------------ *
 * Common filters for every stock report (applied before any totals, so KPIs, tables and exports agree).
 * ------------------------------------------------------------------------------------------------ */

export interface StockFilterQuery {
    category?: string;
    brand?: string;
    supplier?: string;
    from?: string; // purchase date, yyyy-mm-dd (inclusive)
    to?: string;
    search?: string;
}

export const UNASSIGNED = "Unassigned";
export const UNKNOWN_SUPPLIER = "Unknown supplier";

const same = (value: string | null | undefined, wanted: string, blank: string): boolean => {
    const v = (value ?? "").trim();
    return wanted === blank ? !v : v.toLowerCase() === wanted.trim().toLowerCase();
};

/** Keeps the lots matching every set filter. Category/brand/supplier match exactly (case-insensitive). */
export function applyStockFilters(rows: StockAgeRow[], q: StockFilterQuery): StockAgeRow[] {
    let out = filterByPurchaseDate(rows, q).rows;
    if (q.category) out = out.filter((r) => same(r.category, q.category!, UNASSIGNED));
    if (q.brand) out = out.filter((r) => same(r.brand, q.brand!, UNASSIGNED));
    if (q.supplier) out = out.filter((r) => same(r.supplier, q.supplier!, UNKNOWN_SUPPLIER));
    const term = (q.search ?? "").trim().toLowerCase();
    if (term) {
        out = out.filter((r) =>
            r.name.toLowerCase().includes(term) || r.barcode.toLowerCase().includes(term) ||
            (r.brand ?? "").toLowerCase().includes(term) || r.supplier.toLowerCase().includes(term) ||
            (r.category ?? "").toLowerCase().includes(term));
    }
    return out;
}

/** Filter dropdown values present in current stock, biggest (by lots) first. */
export function stockFilterOptions(rows: StockAgeRow[]) {
    const count = (label: (r: StockAgeRow) => string, blank: string) => {
        const acc = new Map<string, number>();
        for (const r of rows) {
            const k = label(r).trim() || blank;
            acc.set(k, (acc.get(k) ?? 0) + 1);
        }
        return [...acc.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, lots]) => ({ value, lots }));
    };
    let min: string | null = null;
    let max: string | null = null;
    for (const r of rows) {
        if (!r.purchaseDate) continue;
        if (!min || r.purchaseDate < min) min = r.purchaseDate;
        if (!max || r.purchaseDate > max) max = r.purchaseDate;
    }
    return {
        categories: count((r) => r.category ?? "", UNASSIGNED),
        brands: count((r) => r.brand ?? "", UNASSIGNED),
        suppliers: count((r) => r.supplier, UNKNOWN_SUPPLIER),
        purchaseDates: { min, max },
    };
}
