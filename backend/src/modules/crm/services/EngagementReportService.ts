import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import WhatsAppCampaign from "../models/WhatsAppCampaign.js";
import Invoice from "../../sales/models/Invoice.js";
import Expense from "../../expense/models/Expense.js";
import User from "../../core/models/User.js";
import { MetaIntegration } from "../../marketing/models/MetaIntegration.js";
import ConfigService from "../../core/services/ConfigService.js";
import { summarizeLoyalty, type MemberInput } from "./loyaltyReportMath.js";

/**
 * Customer-engagement pages (Growth > Loyalty, WhatsApp marketing, Marketing metrics) from the ERP's own records,
 * for the whole shop. Nothing is estimated: where the ERP records nothing (message delivery, campaign attribution),
 * the result says so instead of showing a number.
 */

const IST_OFFSET_MS = 5.5 * 3_600_000;
const istDate = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const between = (r: { from: string; to: string }) => ({ $gte: istStart(r.from), $lt: istEndExclusive(r.to) });
const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);
const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const round2 = (v: number) => Math.round(v * 100) / 100;
const dateOf = (v: unknown): string | null => {
    const d = v instanceof Date ? v : v ? new Date(String(v)) : null;
    return d && !Number.isNaN(d.getTime()) ? istDate(d) : null;
};
const LIVE_INVOICE = { isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] } };

async function tenantUserIds(tenantId: string) {
    return (await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean()).map((u) => u._id as mongoose.Types.ObjectId);
}

/* ---------------------------------------------------------------------------------------------------- Loyalty */

export async function buildLoyaltyReport(tenantId: string, range: { from: string; to: string }) {
    const tid = tenantKey(tenantId);
    const today = istDate(new Date());
    const [customers, withLedger, ledger, rules] = await Promise.all([
        Customer.find({ tenantId: tid }, { name: 1, phone: 1, points: 1, lastPurchaseDate: 1, totalSpend: 1, marketingConsent: 1 }).lean(),
        LoyaltyTransaction.distinct("customerId", { tenantId: tid }),
        LoyaltyTransaction.find({ tenantId: tid, createdAt: between(range) }, { customerId: 1, type: 1, points: 1, balanceAfter: 1, description: 1, invoiceId: 1, createdAt: 1 })
            .sort({ createdAt: -1 }).lean(),
        ConfigService.getLoyaltyRuleConfig(String(tenantId)),
    ]);
    const ledgerSet = new Set(withLedger.map(String));
    const members: MemberInput[] = customers.map((c) => {
        const consent = (c as unknown as { marketingConsent?: { optIn?: boolean; channels?: { whatsapp?: boolean } } }).marketingConsent;
        return {
            id: String(c._id), name: String(c.name ?? ""), phone: String(c.phone ?? ""), points: n(c.points),
            lastPurchase: dateOf(c.lastPurchaseDate), totalSpend: n(c.totalSpend),
            whatsappOptIn: !!(consent?.optIn && consent.channels?.whatsapp), hasLedger: ledgerSet.has(String(c._id)),
        };
    });
    const memberIds = members.filter((m) => m.points > 0 || m.hasLedger).map((m) => new mongoose.Types.ObjectId(m.id));

    const [salesAll, salesMembers] = await Promise.all([
        Invoice.aggregate([{ $match: { tenantId: tid, ...LIVE_INVOICE, createdAt: between(range) } }, { $group: { _id: null, v: { $sum: "$totalAmount" } } }]),
        memberIds.length
            ? Invoice.aggregate([{ $match: { tenantId: tid, ...LIVE_INVOICE, createdAt: between(range), customer: { $in: memberIds } } }, { $group: { _id: null, v: { $sum: "$totalAmount" } } }])
            : Promise.resolve([]),
    ]);

    const names = new Map(members.map((m) => [m.id, m.name]));
    const summary = summarizeLoyalty(
        members,
        ledger.map((l) => ({ customerId: String(l.customerId), type: String(l.type), points: n(l.points), date: dateOf(l.createdAt) ?? range.from })),
        { spendPerPoint: n(rules.spendPerPoint) || 100, rupeesPer100Points: n(rules.rupeesPer100Points) },
        today,
        { memberSales: n(salesMembers[0]?.v), totalSales: n(salesAll[0]?.v) },
    );
    return {
        range,
        summary,
        activity: ledger.slice(0, 300).map((l) => ({
            id: String(l._id), date: dateOf(l.createdAt) ?? range.from, customer: names.get(String(l.customerId)) ?? "Unknown customer",
            type: String(l.type), points: n(l.points), balanceAfter: n(l.balanceAfter), description: String(l.description ?? ""),
        })),
        activityTotal: ledger.length,
        asOf: today,
        source: "mongo" as const,
    };
}

/* ---------------------------------------------------------------------------------------------------- WhatsApp campaigns */

async function whatsappConnection(userIds: mongoose.Types.ObjectId[]) {
    const integrations = await MetaIntegration.find({ user: { $in: userIds } }, { whatsappBusinessAccounts: 1 }).lean();
    const accounts = integrations.flatMap((i) => (i.whatsappBusinessAccounts ?? []) as { name?: string; isConnected?: boolean }[]);
    return { connected: accounts.some((a) => a.isConnected), accounts: accounts.filter((a) => a.isConnected).map((a) => String(a.name ?? "")) };
}

export async function buildWhatsAppCampaignsReport(tenantId: string, range: { from: string; to: string }) {
    const userIds = await tenantUserIds(tenantId);
    const [campaigns, connection, audience] = await Promise.all([
        WhatsAppCampaign.find({ userId: { $in: userIds }, createdAt: between(range) }, "name status scheduleDate targetGroups sent delivered read failed message createdAt")
            .sort({ createdAt: -1 }).lean(),
        whatsappConnection(userIds),
        Customer.countDocuments({ tenantId: tenantKey(tenantId), "marketingConsent.optIn": true, "marketingConsent.channels.whatsapp": true, phone: { $nin: ["", null] } }),
    ]);
    const rows = campaigns.map((c) => ({
        id: String(c._id), name: String(c.name ?? ""), status: String(c.status ?? "scheduled"), created: dateOf(c.createdAt) ?? range.from,
        scheduled: dateOf(c.scheduleDate), groups: (c.targetGroups ?? []).map(String), message: String(c.message ?? ""),
        sent: n(c.sent), delivered: n(c.delivered), read: n(c.read), failed: n(c.failed),
    }));
    const recorded = rows.some((r) => r.sent + r.delivered + r.read + r.failed > 0);
    return {
        range,
        campaigns: rows,
        counts: { total: rows.length, scheduled: rows.filter((r) => r.status === "scheduled").length, completed: rows.filter((r) => r.status === "completed").length, failed: rows.filter((r) => r.status === "failed").length },
        audience: { whatsappOptIn: audience },
        connection,
        /**
         * Nothing in the ERP sends campaign messages or records delivery (the Meta webhook ignores WhatsApp events),
         * so sent / delivered / read counts are only shown if some were actually recorded.
         */
        deliveryTracked: recorded,
        asOf: istDate(new Date()),
        source: "mongo" as const,
    };
}

/* ---------------------------------------------------------------------------------------------------- Marketing metrics */

export async function buildMarketingMetrics(tenantId: string, range: { from: string; to: string }) {
    const tid = tenantKey(tenantId);
    const userIds = await tenantUserIds(tenantId);
    const [spendRows, campaigns, newCustomers, consent, segments, sales, connection] = await Promise.all([
        Expense.find({ createdBy: { $in: userIds }, category: "Marketing", date: between(range) }, { expenseNo: 1, date: 1, amount: 1, description: 1, paymentMethod: 1 }).sort({ date: -1 }).lean(),
        WhatsAppCampaign.countDocuments({ userId: { $in: userIds }, createdAt: between(range) }),
        Customer.countDocuments({ tenantId: tid, createdAt: between(range) }),
        Customer.aggregate([
            { $match: { tenantId: tid, "marketingConsent.optIn": true } },
            { $group: { _id: null, whatsapp: { $sum: { $cond: ["$marketingConsent.channels.whatsapp", 1, 0] } }, sms: { $sum: { $cond: ["$marketingConsent.channels.sms", 1, 0] } }, email: { $sum: { $cond: ["$marketingConsent.channels.email", 1, 0] } }, any: { $sum: 1 } } },
        ]),
        Customer.aggregate([{ $match: { tenantId: tid } }, { $group: { _id: "$segment", customers: { $sum: 1 } } }]),
        Invoice.aggregate([{ $match: { tenantId: tid, ...LIVE_INVOICE, createdAt: between(range) } }, { $group: { _id: null, v: { $sum: "$totalAmount" }, bills: { $sum: 1 } } }]),
        whatsappConnection(userIds),
    ]);
    const spend = round2(spendRows.reduce((s, e) => s + n(e.amount), 0));
    const c = consent[0] ?? {};
    return {
        range,
        spend: {
            total: spend,
            entries: spendRows.slice(0, 50).map((e) => ({ id: String(e._id), expenseNo: String(e.expenseNo ?? ""), date: dateOf(e.date) ?? range.from, amount: round2(n(e.amount)), description: String(e.description ?? ""), paymentMethod: String(e.paymentMethod ?? "") })),
            count: spendRows.length,
        },
        campaigns,
        newCustomers,
        optIn: { any: n(c.any), whatsapp: n(c.whatsapp), sms: n(c.sms), email: n(c.email) },
        segments: segments.map((s) => ({ segment: String(s._id ?? "NEW"), customers: n(s.customers) })).sort((a, b) => b.customers - a.customers),
        erpSales: { value: round2(n(sales[0]?.v)), bills: n(sales[0]?.bills) },
        connections: { whatsapp: connection.connected },
        /** No campaign or channel is recorded on a sale, so revenue can't be attributed to marketing and ROI isn't computed. */
        attribution: false,
        asOf: istDate(new Date()),
        source: "mongo" as const,
    };
}
