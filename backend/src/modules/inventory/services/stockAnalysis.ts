/**
 * Inventory / Stock Aging & Sales Analysis -- pure calculations (no DB access).
 *
 * One barcode = one purchase batch, so age = days / calendar months from the barcode's first active purchase
 * (`firstPurchase`) to the as-of date. Month buckets reuse stockAgeBuckets.ts so this report and the Aged
 * Stock screen always agree. Nothing here invents a business threshold: the day classes are the owner's
 * (0-30 / 31-60 / 61-90 / 91-180 / 181-365 / 365+); reorder settings come from the request and, when
 * they are missing, the reorder columns stay empty and are flagged instead of guessed.
 */

import { bucketFor, bucketLabel, monthsBetween, STOCK_AGE_BUCKETS, type StockAgeBucketKey } from "./stockAgeBuckets.js";

/** One barcode, as aggregated by SQL (sqlStockAnalysis.ts). Dates are yyyy-mm-dd. */
export interface AnalysisLot {
    barcode: string;
    name: string;
    category: string | null;
    subCategory: string | null;
    brand: string | null;
    size: string | null;
    color: string | null;
    supplier: string | null;
    grnNo: string | null;
    firstPurchase: string | null;
    lastPurchase: string | null;
    purchasedQty: number;
    purchaseReturnQty: number;
    soldQty: number; // lifetime up to as-of
    firstSale: string | null;
    lastSale: string | null;
    periodSoldQty: number;
    periodSalesValue: number;
    periodBillLines: number;
    costPrice: number;
    mrp: number;
    stockQty: number;
}

export type MgmtClass = "NEW" | "HEALTHY" | "WATCH" | "SLOW" | "VERY SLOW" | "DEAD / CLEARANCE REVIEW" | "UNKNOWN";
export const MGMT_CLASSES: { key: MgmtClass; range: string }[] = [
    { key: "NEW", range: "0–30 days" },
    { key: "HEALTHY", range: "31–60 days" },
    { key: "WATCH", range: "61–90 days" },
    { key: "SLOW", range: "91–180 days" },
    { key: "VERY SLOW", range: "181–365 days" },
    { key: "DEAD / CLEARANCE REVIEW", range: "365+ days" },
    { key: "UNKNOWN", range: "No purchase record" },
];

export const SELL_THROUGH_BANDS = ["0%", "1–25%", "26–50%", "51–75%", "76–90%", "91–100%"] as const;
export type SellThroughBand = (typeof SELL_THROUGH_BANDS)[number] | "n/a";

export type ClearanceClass = "WATCH" | "MARKDOWN REVIEW" | "CLEARANCE REVIEW" | "DEAD STOCK";
export type ReorderStatus = "REORDER NOW" | "REORDER SOON" | "HEALTHY" | "OVERSTOCKED" | "NO RECENT SALES" | "CONFIG NEEDED";

const DAY_MS = 86_400_000;
const r2 = (n: number): number => Math.round(n * 100) / 100;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

export const toMs = (d: string): number => Date.parse(`${d}T00:00:00Z`);
export const daysBetween = (from: string | null, to: string): number | null => {
    if (!from) return null;
    const a = toMs(from);
    const b = toMs(to);
    return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.round((b - a) / DAY_MS)) : null;
};
export const addDaysIso = (d: string, n: number): string => new Date(toMs(d) + n * DAY_MS).toISOString().slice(0, 10);

export function mgmtClassFor(ageDays: number | null): MgmtClass {
    if (ageDays === null) return "UNKNOWN";
    if (ageDays <= 30) return "NEW";
    if (ageDays <= 60) return "HEALTHY";
    if (ageDays <= 90) return "WATCH";
    if (ageDays <= 180) return "SLOW";
    if (ageDays <= 365) return "VERY SLOW";
    return "DEAD / CLEARANCE REVIEW";
}

export function sellThroughBand(p: number | null): SellThroughBand {
    if (p === null) return "n/a";
    if (p <= 0) return "0%";
    if (p <= 25) return "1–25%";
    if (p <= 50) return "26–50%";
    if (p <= 75) return "51–75%";
    if (p <= 90) return "76–90%";
    return "91–100%";
}

/**
 * Clearance rule: only the owner's age classes, plus whether the barcode sold anything in the analysis period.
 * It only labels candidates for review -- it never changes a price.
 */
export function clearanceFor(cls: MgmtClass, soldInPeriod: boolean): ClearanceClass | null {
    switch (cls) {
        case "WATCH": return "WATCH";
        case "SLOW": return soldInPeriod ? "WATCH" : "MARKDOWN REVIEW";
        case "VERY SLOW": return soldInPeriod ? "MARKDOWN REVIEW" : "CLEARANCE REVIEW";
        case "DEAD / CLEARANCE REVIEW": return soldInPeriod ? "CLEARANCE REVIEW" : "DEAD STOCK";
        default: return null;
    }
}

export interface ClassifiedLot extends AnalysisLot {
    netReceivedQty: number;
    sellThroughPct: number | null;
    sellThroughBand: SellThroughBand;
    ageDays: number | null;
    ageMonths: number | null;
    bucket: StockAgeBucketKey;
    mgmtClass: MgmtClass;
    daysSinceLastSale: number | null;
    stockCostValue: number;
    stockMrpValue: number;
    estCogs: number; // period qty x current cost rate (estimate: the sale lines carry no cost)
    grossProfit: number;
    unitPrice: number | null; // average selling price in the period
    neverSold: boolean;
    clearance: ClearanceClass | null;
}

export function classify(lot: AnalysisLot, asOf: string): ClassifiedLot {
    const netReceivedQty = r3(lot.purchasedQty - lot.purchaseReturnQty);
    const sellThroughPct = pct(lot.soldQty, netReceivedQty);
    const ageDays = daysBetween(lot.firstPurchase, asOf);
    const ageMonths = monthsBetween(lot.firstPurchase, asOf);
    const mgmtClass = lot.stockQty > 0 ? mgmtClassFor(ageDays) : "UNKNOWN";
    const estCogs = r2(lot.periodSoldQty * lot.costPrice);
    return {
        ...lot,
        netReceivedQty,
        sellThroughPct,
        sellThroughBand: sellThroughBand(sellThroughPct),
        ageDays,
        ageMonths,
        bucket: bucketFor(ageMonths),
        mgmtClass,
        daysSinceLastSale: daysBetween(lot.lastSale, asOf),
        stockCostValue: r2(lot.stockQty * lot.costPrice),
        stockMrpValue: r2(lot.stockQty * lot.mrp),
        estCogs,
        grossProfit: r2(lot.periodSalesValue - estCogs),
        unitPrice: lot.periodSoldQty > 0 ? r2(lot.periodSalesValue / lot.periodSoldQty) : null,
        neverSold: lot.stockQty > 0 && lot.soldQty <= 0,
        clearance: lot.stockQty > 0 ? clearanceFor(mgmtClass, lot.periodSoldQty > 0) : null,
    };
}

/* ---------------------------------------------------------------------------------------------- *
 * Group metrics (category, sub-category, product, variant, supplier, price band, kids segment ...)
 * ---------------------------------------------------------------------------------------------- */

export interface GroupMetrics {
    key: string;
    lots: number; // barcodes with stock
    stockQty: number;
    stockCostValue: number;
    stockMrpValue: number;
    periodSoldQty: number;
    periodSalesValue: number;
    grossProfit: number;
    grossMarginPct: number | null;
    sellThroughPct: number | null;
    avgSellingPrice: number | null;
    avgAgeDays: number | null; // stock-qty weighted
    value90: number;
    value180: number;
    value365: number;
    deadStockPct: number | null; // 365+ days stock value / stock cost value
    neverSoldValue: number;
    avgDailySales: number | null;
    avgWeeklySales: number | null;
    daysOfCover: number | null; // null = no recent sales
    turnover: number | null; // annualised estimated COGS / stock cost value
    billLines: number;
    purchasedValue: number;
}

export function metricsFor(key: string, lots: ClassifiedLot[], periodDays: number): GroupMetrics {
    let stockQty = 0, cost = 0, mrp = 0, sold = 0, sales = 0, cogs = 0, ageQty = 0, ageSum = 0;
    let v90 = 0, v180 = 0, v365 = 0, never = 0, lotsWithStock = 0, net = 0, life = 0, bills = 0, purchased = 0;
    for (const l of lots) {
        sold += l.periodSoldQty;
        sales += l.periodSalesValue;
        cogs += l.estCogs;
        bills += l.periodBillLines;
        net += l.netReceivedQty;
        life += l.soldQty;
        purchased += l.netReceivedQty * l.costPrice;
        if (l.stockQty <= 0) continue;
        lotsWithStock += 1;
        stockQty += l.stockQty;
        cost += l.stockCostValue;
        mrp += l.stockMrpValue;
        if (l.neverSold) never += l.stockCostValue;
        if (l.ageDays !== null) {
            ageQty += l.stockQty;
            ageSum += l.stockQty * l.ageDays;
            if (l.ageDays > 90) v90 += l.stockCostValue;
            if (l.ageDays > 180) v180 += l.stockCostValue;
            if (l.ageDays > 365) v365 += l.stockCostValue;
        }
    }
    const daily = periodDays > 0 ? sold / periodDays : 0;
    return {
        key,
        lots: lotsWithStock,
        stockQty: r3(stockQty),
        stockCostValue: r2(cost),
        stockMrpValue: r2(mrp),
        periodSoldQty: r3(sold),
        periodSalesValue: r2(sales),
        grossProfit: r2(sales - cogs),
        grossMarginPct: pct(sales - cogs, sales),
        sellThroughPct: pct(life, net),
        avgSellingPrice: sold > 0 ? r2(sales / sold) : null,
        avgAgeDays: ageQty > 0 ? Math.round(ageSum / ageQty) : null,
        value90: r2(v90),
        value180: r2(v180),
        value365: r2(v365),
        deadStockPct: pct(v365, cost),
        neverSoldValue: r2(never),
        avgDailySales: sold > 0 ? r3(daily) : null,
        avgWeeklySales: sold > 0 ? r3(daily * 7) : null,
        daysOfCover: daily > 0 ? Math.round(stockQty / daily) : null,
        turnover: cost > 0 && periodDays > 0 ? r2((cogs * (365 / periodDays)) / cost) : null,
        billLines: bills,
        purchasedValue: r2(purchased),
    };
}

export function groupBy(lots: ClassifiedLot[], keyOf: (l: ClassifiedLot) => string, periodDays: number): GroupMetrics[] {
    const map = new Map<string, ClassifiedLot[]>();
    for (const l of lots) {
        const k = keyOf(l);
        const arr = map.get(k);
        if (arr) arr.push(l);
        else map.set(k, [l]);
    }
    return [...map.entries()].map(([k, v]) => metricsFor(k, v, periodDays)).sort((a, b) => b.stockCostValue - a.stockCostValue || b.periodSalesValue - a.periodSalesValue);
}

/* ---------------------------------------------------------------------------------------------- *
 * Reorder (product level: a barcode is one batch, a reorder is for the product/design)
 * ---------------------------------------------------------------------------------------------- */

export interface ReorderSettings {
    leadDays: number | null;
    safetyDays: number | null;
    coverDays: number | null;
    soonDays: number | null;
    overstockDays: number | null;
}
export const settingsComplete = (s: ReorderSettings): boolean =>
    s.leadDays !== null && s.safetyDays !== null && s.coverDays !== null && s.soonDays !== null && s.overstockDays !== null;

export interface ReorderRow {
    product: string;
    category: string | null;
    stockQty: number;
    periodSoldQty: number;
    avgDailySales: number | null;
    avgWeeklySales: number | null;
    daysOfStock: number | null;
    reorderPoint: number | null;
    recommendedQty: number | null;
    status: ReorderStatus;
}

export function reorderRows(lots: ClassifiedLot[], periodDays: number, s: ReorderSettings): ReorderRow[] {
    const map = new Map<string, { category: string | null; stock: number; sold: number }>();
    for (const l of lots) {
        const k = l.name || l.barcode;
        const e = map.get(k) ?? { category: l.category, stock: 0, sold: 0 };
        e.stock += Math.max(0, l.stockQty);
        e.sold += l.periodSoldQty;
        map.set(k, e);
    }
    const ready = settingsComplete(s);
    const rows: ReorderRow[] = [];
    for (const [product, e] of map) {
        const daily = periodDays > 0 ? e.sold / periodDays : 0;
        let status: ReorderStatus;
        let reorderPoint: number | null = null;
        let recommendedQty: number | null = null;
        if (daily <= 0) status = "NO RECENT SALES";
        else if (!ready) status = "CONFIG NEEDED";
        else {
            const rp = daily * (s.leadDays as number) + daily * (s.safetyDays as number); // safety stock expressed in days of sales
            reorderPoint = r3(rp);
            recommendedQty = Math.max(0, Math.ceil(daily * ((s.leadDays as number) + (s.safetyDays as number) + (s.coverDays as number)) - e.stock));
            const cover = e.stock / daily;
            if (e.stock <= rp) status = "REORDER NOW";
            else if (e.stock <= rp + daily * (s.soonDays as number)) status = "REORDER SOON";
            else if (cover > (s.overstockDays as number)) status = "OVERSTOCKED";
            else status = "HEALTHY";
        }
        rows.push({
            product,
            category: e.category,
            stockQty: r3(e.stock),
            periodSoldQty: r3(e.sold),
            avgDailySales: daily > 0 ? r3(daily) : null,
            avgWeeklySales: daily > 0 ? r3(daily * 7) : null,
            daysOfStock: daily > 0 ? Math.round(e.stock / daily) : null,
            reorderPoint,
            recommendedQty,
            status,
        });
    }
    return rows;
}

/* ---------------------------------------------------------------------------------------------- *
 * Price bands (derived from the data, not hardcoded)
 * ---------------------------------------------------------------------------------------------- */

/** Quantity-weighted cut points at 1/3 and 2/3 of the pieces sold, using each barcode's average selling price. */
export function derivePriceBands(lots: ClassifiedLot[]): { cuts: [number, number] | null; basis: "period selling price" | "MRP" } {
    const priced = lots.filter((l) => l.unitPrice !== null && l.periodSoldQty > 0);
    const basis = priced.length >= 3 ? "period selling price" : "MRP";
    const pts = (basis === "MRP" ? lots.filter((l) => l.mrp > 0 && l.stockQty > 0).map((l) => ({ p: l.mrp, q: l.stockQty })) : priced.map((l) => ({ p: l.unitPrice as number, q: l.periodSoldQty }))).sort((a, b) => a.p - b.p);
    if (pts.length < 3) return { cuts: null, basis };
    const total = pts.reduce((a, x) => a + x.q, 0);
    const cut = (share: number): number => {
        let run = 0;
        for (const x of pts) {
            run += x.q;
            if (run >= total * share) return x.p;
        }
        return pts[pts.length - 1].p;
    };
    const c1 = cut(1 / 3);
    const c2 = cut(2 / 3);
    return c1 < c2 ? { cuts: [c1, c2], basis } : { cuts: null, basis };
}

export function priceBandOf(lot: ClassifiedLot, cuts: [number, number], basis: "period selling price" | "MRP"): string {
    const p = basis === "MRP" ? lot.mrp : lot.unitPrice ?? lot.mrp;
    if (p <= cuts[0]) return `Value (up to ₹${Math.round(cuts[0])})`;
    if (p <= cuts[1]) return `Regular (₹${Math.round(cuts[0]) + 1}–₹${Math.round(cuts[1])})`;
    return `Premium (above ₹${Math.round(cuts[1])})`;
}

/** Kids segment from the real category name (never an invented category). null = not a kids category. */
export function kidsSegment(category: string | null): string | null {
    const c = (category ?? "").toUpperCase();
    if (!c) return null;
    if (/\bBABY\b|BABIES|INFANT/.test(c)) return "BABY";
    if (/\bGIRLS?\b/.test(c)) return "GIRLS";
    if (/\bBOYS?\b/.test(c)) return "BOYS";
    if (/\bKIDS?\b|CHILD/.test(c)) return "GENERAL KIDS";
    return null;
}

export { STOCK_AGE_BUCKETS, bucketLabel };
