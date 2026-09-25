import mongoose from "mongoose";
import Invoice from "../../sales/models/Invoice.js";
import { ERP_BASIS, addDays, aggregateErpSales, istDate, type ErpInvoice, type SalesDim } from "./erpSalesMath.js";

/**
 * Detailed Analytics from the ERP's own POS invoices, for when the shop database is not the item source
 * (ITEM_DATA_SOURCE != sql). Replaces the old in-browser fallback, which only saw the sales loaded on that device.
 *
 * Same rules as the Sales and Day Book reports: a live invoice is not deleted and not CANCELLED / REFUNDED; a
 * cancelled one is fulfillmentStatus CANCELLED; days and hours are India time.
 */

const LINE_DIMS = new Set<SalesDim>(["brand", "category", "product", "salesCounter"]);
const validDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const between = (from: string, to: string) => ({ $gte: istStart(from), $lt: istEndExclusive(to) });

const LIVE = { isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] } };
const CANCELLED = { isDeleted: { $ne: true }, fulfillmentStatus: "CANCELLED" };
const INVOICE_FIELDS = { invoiceNo: 1, createdAt: 1, totalAmount: 1, paidAmount: 1, paymentMethod: 1, splitPaymentDetails: 1, counterName: 1 };

export interface ErpSalesReportResult {
    rows: Record<string, unknown>[];
    range: { from: string; to: string };
    asOf: string;
    source: "mongo";
    /** How this breakdown differs from the shop-database one, if it does. */
    basis?: string;
}

/** Same period defaults as sqlSalesReport: explicit from/to, else the last 1 / 7 / 30 days ending today. */
export function resolveRange(range: string | undefined, fromQ?: string, toQ?: string): { from: string; to: string } {
    const to = validDate(toQ) ?? istDate(new Date());
    const span = range === "TODAY" ? 0 : range === "WEEK" ? -6 : -29;
    return { from: validDate(fromQ) ?? addDays(to, span), to };
}

export async function erpSalesReport(dim: SalesDim, tenantId: string, range: string | undefined, fromQ?: string, toQ?: string): Promise<ErpSalesReportResult> {
    const { from, to } = resolveRange(range, fromQ, toQ);
    const tid = tenantKey(tenantId);
    const createdAt = between(from, to);
    const liveQuery = Invoice.find({ tenantId: tid, ...LIVE, createdAt }, LINE_DIMS.has(dim) ? { ...INVOICE_FIELDS, items: 1 } : INVOICE_FIELDS);
    if (LINE_DIMS.has(dim)) liveQuery.populate("items.item", "name brand category");
    const [live, cancelled] = await Promise.all([
        liveQuery.lean(),
        dim === "day" ? Invoice.find({ tenantId: tid, ...CANCELLED, createdAt }, INVOICE_FIELDS).lean() : Promise.resolve([]),
    ]);
    const rows = aggregateErpSales(dim, live as unknown as ErpInvoice[], cancelled as unknown as ErpInvoice[], from, to);
    return { rows, range: { from, to }, asOf: istDate(new Date()), source: "mongo", ...(ERP_BASIS[dim] ? { basis: ERP_BASIS[dim] } : {}) };
}

export interface DayBill {
    _id: string;
    invoiceNo: string;
    createdAt: Date;
    customer: { name?: string; phone?: string } | null;
    paymentMethod: string;
    totalAmount: number;
    cancelled: boolean;
}

/** Every ERP bill on one India-time day (cancelled ones flagged), in the shape the SQL day-bills list uses. */
export async function erpDayBills(tenantId: string, date: string): Promise<DayBill[]> {
    const docs = await Invoice.find(
        { tenantId: tenantKey(tenantId), isDeleted: { $ne: true }, fulfillmentStatus: { $ne: "REFUNDED" }, createdAt: between(date, date) },
        { invoiceNo: 1, createdAt: 1, customer: 1, paymentMethod: 1, totalAmount: 1, fulfillmentStatus: 1 },
    ).populate("customer", "name phone").sort({ createdAt: 1 }).lean();
    return docs.map((d) => {
        const c = d.customer as unknown as { name?: string; phone?: string } | null | undefined;
        return {
            _id: String(d._id),
            invoiceNo: String(d.invoiceNo ?? ""),
            createdAt: d.createdAt as unknown as Date,
            customer: c && typeof c === "object" ? { name: c.name, phone: c.phone } : null,
            paymentMethod: String(d.paymentMethod ?? "cash"),
            totalAmount: Number(d.totalAmount) || 0,
            cancelled: d.fulfillmentStatus === "CANCELLED",
        };
    });
}
