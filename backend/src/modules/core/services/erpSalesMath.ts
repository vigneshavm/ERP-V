import { erpInvoiceSplit } from "../../finance/services/financeMath.js";

/**
 * Detailed Analytics breakdowns (brand, category, billing counter, sales counter, product, hour, day) computed from
 * ERP POS invoices, in the same row shapes the Textilesoft SQL builder (sqlSalesReports.ts) returns, so the report
 * pages render either source unchanged. Pure functions; ErpSalesReportService does the queries.
 */

export type SalesDim = "brand" | "category" | "counter" | "salesCounter" | "hour" | "day" | "product";

export interface ErpLine {
    name?: string | null;
    quantity?: number | null;
    price?: number | null;
    discount?: number | null;
    total?: number | null;
    /** Populated Item (only the fields these reports read), or null when the item was deleted. */
    item?: { name?: string | null; brand?: string | null; category?: string | null } | null;
}

export interface ErpInvoice {
    _id?: unknown;
    invoiceNo?: string;
    createdAt: Date | string;
    totalAmount?: number | null;
    paidAmount?: number | null;
    paymentMethod?: string | null;
    splitPaymentDetails?: { method?: string | null; amount?: number | null }[];
    counterName?: string | null;
    items?: ErpLine[];
}

export interface DimensionRow { name: string; revenue: number; count: number; items?: number }
export interface HourRow { hour: number; label: string; revenue: number; transactions: number }
export interface DayRow {
    date: string; revenue: number; transactions: number; cancelledCount: number; cancelledAmount: number;
    cash: number; card: number; credit: number; upi: number;
}

const IST_OFFSET_MS = 5.5 * 3_600_000;
const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const round2 = (v: number): number => Math.round(v * 100) / 100;
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const asDate = (d: Date | string): Date => (d instanceof Date ? d : new Date(d));

/** Calendar date (YYYY-MM-DD) and hour of a timestamp in India time, the shop's day. */
export const istDate = (d: Date | string): string => new Date(asDate(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
export const istHour = (d: Date | string): number => new Date(asDate(d).getTime() + IST_OFFSET_MS).getUTCHours();

export const hourLabel = (h: number): string => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

export const addDays = (iso: string, days: number): string => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};
const daySpan = (from: string, to: string): number =>
    Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;

/** A sale line's value: its stored total (tax-inclusive, after discount), else rate × qty − discount. */
export function lineValue(l: ErpLine): number {
    const total = n(l.total);
    if (total > 0) return total;
    return Math.max(0, n(l.price) * n(l.quantity) - n(l.discount));
}

/** Billing counter of an invoice: the counter it was billed at, else the single main counter. */
export const counterOf = (inv: ErpInvoice): string => text(inv.counterName) || "Main Counter";

const LINE_KEY: Record<"brand" | "category" | "product", (l: ErpLine) => string> = {
    brand: (l) => text(l.item?.brand) || "No Brand",
    category: (l) => text(l.item?.category) || "Uncategorized",
    // ERP items have no product-type master like Textilesoft's pname, so the item name is the product.
    product: (l) => text(l.item?.name) || text(l.name) || "Other",
};

const byRevenue = (a: DimensionRow, b: DimensionRow) => b.revenue - a.revenue || a.name.localeCompare(b.name);

/** Sale lines grouped by a key (brand, category, product) or by the invoice's counter (sales counter). */
export function aggregateLines(invoices: ErpInvoice[], dim: "brand" | "category" | "product" | "salesCounter"): DimensionRow[] {
    const stats = new Map<string, DimensionRow>();
    for (const inv of invoices) {
        for (const l of inv.items ?? []) {
            const name = dim === "salesCounter" ? counterOf(inv) : LINE_KEY[dim](l);
            const row = stats.get(name) ?? { name, revenue: 0, count: 0, items: 0 };
            row.revenue += lineValue(l);
            row.count += 1;
            row.items = (row.items ?? 0) + n(l.quantity);
            stats.set(name, row);
        }
    }
    const rows = [...stats.values()].map((r) => ({ ...r, revenue: round2(r.revenue) })).sort(byRevenue);
    // Same cap as the SQL builder: only the top 50 categories.
    return dim === "category" ? rows.slice(0, 50) : rows;
}

/** Bills grouped by billing counter. */
export function aggregateCounters(invoices: ErpInvoice[]): DimensionRow[] {
    const stats = new Map<string, DimensionRow>();
    for (const inv of invoices) {
        const name = counterOf(inv);
        const row = stats.get(name) ?? { name, revenue: 0, count: 0 };
        row.revenue += n(inv.totalAmount);
        row.count += 1;
        stats.set(name, row);
    }
    return [...stats.values()].map((r) => ({ ...r, revenue: round2(r.revenue) })).sort(byRevenue);
}

/** Bills and sales by the hour (India time) the bill was made: always 24 rows. */
export function aggregateHours(invoices: ErpInvoice[]): HourRow[] {
    const rows: HourRow[] = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: hourLabel(h), revenue: 0, transactions: 0 }));
    for (const inv of invoices) {
        const r = rows[istHour(inv.createdAt)];
        r.revenue += n(inv.totalAmount);
        r.transactions += 1;
    }
    return rows.map((r) => ({ ...r, revenue: round2(r.revenue) }));
}

const isCard = (method: unknown) => String(method ?? "").trim().toLowerCase() === "card";
const isBankish = (method: unknown) => {
    const m = String(method ?? "").trim().toLowerCase();
    return m !== "" && m !== "cash" && m !== "due" && m !== "credit" && m !== "split";
};

/**
 * Daily-report payment columns for one invoice. Cash / credit follow erpInvoiceSplit (the Sales and Day Book rule);
 * the non-cash part is split into Card and UPI by method. Bank transfer and cheque have no column of their own, so
 * they count under UPI with the other bank receipts.
 */
export function dayPaymentSplit(inv: ErpInvoice): { cash: number; card: number; credit: number; upi: number } {
    const split = erpInvoiceSplit(inv);
    let cardRaw = 0;
    let bankRaw = 0;
    if (String(inv.paymentMethod ?? "") === "split" && inv.splitPaymentDetails?.length) {
        for (const d of inv.splitPaymentDetails) {
            if (!isBankish(d.method)) continue;
            bankRaw += Math.max(0, n(d.amount));
            if (isCard(d.method)) cardRaw += Math.max(0, n(d.amount));
        }
    } else if (isBankish(inv.paymentMethod)) {
        bankRaw = 1;
        cardRaw = isCard(inv.paymentMethod) ? 1 : 0;
    }
    const card = bankRaw > 0 ? round2(split.bank * (cardRaw / bankRaw)) : 0;
    return { cash: split.cash, card, credit: split.credit, upi: round2(split.bank - card) };
}

/** One row per day of [from, to] (zero-filled up to 366 days, else only days with bills), cancelled bills counted apart. */
export function aggregateDays(live: ErpInvoice[], cancelled: ErpInvoice[], from: string, to: string): DayRow[] {
    const blank = (date: string): DayRow => ({ date, revenue: 0, transactions: 0, cancelledCount: 0, cancelledAmount: 0, cash: 0, card: 0, credit: 0, upi: 0 });
    const byDay = new Map<string, DayRow>();
    const span = daySpan(from, to);
    if (span > 0 && span <= 366) for (let i = 0; i < span; i++) byDay.set(addDays(from, i), blank(addDays(from, i)));
    const rowFor = (d: string) => {
        const row = byDay.get(d) ?? blank(d);
        byDay.set(d, row);
        return row;
    };
    for (const inv of live) {
        const row = rowFor(istDate(inv.createdAt));
        const p = dayPaymentSplit(inv);
        row.revenue += n(inv.totalAmount);
        row.transactions += 1;
        row.cash += p.cash; row.card += p.card; row.credit += p.credit; row.upi += p.upi;
    }
    for (const inv of cancelled) {
        const row = rowFor(istDate(inv.createdAt));
        row.cancelledCount += 1;
        row.cancelledAmount += n(inv.totalAmount);
    }
    return [...byDay.values()]
        .map((r) => ({ ...r, revenue: round2(r.revenue), cancelledAmount: round2(r.cancelledAmount), cash: round2(r.cash), card: round2(r.card), credit: round2(r.credit), upi: round2(r.upi) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** The breakdown for one dimension. `cancelled` is only read by "day". */
export function aggregateErpSales(dim: SalesDim, live: ErpInvoice[], cancelled: ErpInvoice[], from: string, to: string): Record<string, unknown>[] {
    switch (dim) {
        case "counter": return aggregateCounters(live) as unknown as Record<string, unknown>[];
        case "hour": return aggregateHours(live) as unknown as Record<string, unknown>[];
        case "day": return aggregateDays(live, cancelled, from, to) as unknown as Record<string, unknown>[];
        default: return aggregateLines(live, dim) as unknown as Record<string, unknown>[];
    }
}

/** How an ERP breakdown differs from the shop-database one, for the report's note line. */
export const ERP_BASIS: Partial<Record<SalesDim, string>> = {
    salesCounter: "ERP POS bills have no sales-floor counter, so ERP sales are grouped by the billing counter.",
    product: "ERP POS items have no product-type master, so ERP sales are grouped by item name.",
};
