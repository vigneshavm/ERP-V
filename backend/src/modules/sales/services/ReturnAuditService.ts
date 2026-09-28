import mongoose from "mongoose";
import Return from "../models/Return.js";
import Invoice from "../models/Invoice.js";
import User from "../../core/models/User.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { salesReturnEntries } from "../../../integrations/textilesoft/sqlPartyReports.js";
import {
    CASH_REFUND_LIMIT, CASHIER_DAILY_LIMIT, FLAG_LABEL, FLAG_LEVEL, REPEAT_CUSTOMER_COUNT, REPEAT_WINDOW_DAYS,
    auditReturn, summarize, type AuditRow, type ReturnDoc,
} from "./returnAudit.js";

/**
 * GET /api/reports/returns-audit?from&to — every sales return in the shop for the period (all users of the tenant;
 * GET /api/returns only lists the caller's own), with risk flags from returnAudit.ts.
 *
 * Returns are recorded only in the ERP: the Textilesoft sales-return tables are empty in the shop database. If they
 * ever hold rows, `shopReturnRows` says so, so the page can warn that those returns aren't included.
 */

const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const IST_OFFSET_MS = 5.5 * 3_600_000;
const todayIst = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

export async function buildReturnsAudit(tenantId: string, range: { from: string; to: string }) {
    const users = (await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean()).map((u) => u._id);
    const start = istStart(range.from);
    const end = istEndExclusive(range.to);
    const windowStart = new Date(start.getTime() - REPEAT_WINDOW_DAYS * 86_400_000);

    const [windowDocs, erpBills, shopReturnRows] = await Promise.all([
        Return.find({ createdBy: { $in: users }, returnDate: { $gte: windowStart, $lt: end } },
            { returnId: 1, returnDate: 1, createdAt: 1, invoice: 1, customer: 1, customerName: 1, createdBy: 1, refundMethod: 1, actualRefundMethod: 1, status: 1, totalReturnAmount: 1, subtotal: 1, items: 1 })
            .populate("invoice", "invoiceNo totalAmount")
            .populate("customer", "name")
            .populate("createdBy", "name")
            .sort({ returnDate: -1 })
            .lean(),
        Invoice.countDocuments({ tenantId: tenantKey(tenantId), isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] }, createdAt: { $gte: start, $lt: end } }),
        isSqlItemSource() ? salesReturnEntries().catch(() => 0) : Promise.resolve(0),
    ]);
    const window = windowDocs as unknown as ReturnDoc[];
    const inPeriod = window.filter((r) => {
        const t = new Date(String(r.returnDate ?? r.createdAt)).getTime();
        return t >= start.getTime() && t < end.getTime();
    });

    // All-time returned value per bill (any date, any user of the shop), for the refund-exceeds-bill check.
    const invoiceIds = [...new Set(inPeriod.map((r) => r.invoice?._id).filter(Boolean).map(String))];
    const totals = invoiceIds.length
        ? await Return.aggregate<{ _id: unknown; value: number }>([
            { $match: { createdBy: { $in: users }, invoice: { $in: invoiceIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
            { $group: { _id: "$invoice", value: { $sum: { $ifNull: ["$totalReturnAmount", "$subtotal"] } } } },
        ])
        : [];
    const returnedByInvoice = new Map(totals.map((t) => [String(t._id), t.value]));

    const rows: AuditRow[] = inPeriod.map((r) => auditReturn(r, { window, returnedByInvoice }));
    return {
        range,
        summary: { ...summarize(rows, inPeriod), erpBills, returnRatePct: erpBills ? Math.round((rows.length / erpBills) * 1000) / 10 : null },
        rows,
        rules: (Object.keys(FLAG_LEVEL) as (keyof typeof FLAG_LEVEL)[]).map((code) => ({ code, label: FLAG_LABEL[code], level: FLAG_LEVEL[code] })),
        limits: { cashRefund: CASH_REFUND_LIMIT, cashierDaily: CASHIER_DAILY_LIMIT, repeatCount: REPEAT_CUSTOMER_COUNT, repeatDays: REPEAT_WINDOW_DAYS },
        shopReturnRows,
        asOf: todayIst(),
        source: "mongo" as const,
    };
}
