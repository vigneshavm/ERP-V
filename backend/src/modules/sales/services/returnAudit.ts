/**
 * Returns & Refund Audit: flags computed only from what the ERP records about each return. There is no manager
 * approval, receipt scan or branch policy stored on a return, so no rule pretends to check them.
 *
 * Rules (the highest one decides the risk level):
 *   REFUND_EXCEEDS_BILL   CRITICAL  all returns against the bill add up to more than the bill total
 *   CASH_ABOVE_LIMIT      HIGH      refunded in cash, above CASH_REFUND_LIMIT
 *   CASHIER_BURST         HIGH      the same cashier made CASHIER_DAILY_LIMIT or more returns that day
 *   REPEAT_CUSTOMER       MEDIUM    the same (named) customer returned REPEAT_CUSTOMER_COUNT or more times in REPEAT_WINDOW_DAYS
 *
 * Not flagged: whether a refund was paid out. The ERP only marks bank-transfer refunds as processed, so the
 * field says nothing about cash, UPI or card refunds.
 */

export const CASH_REFUND_LIMIT = 1000;
export const CASHIER_DAILY_LIMIT = 3;
export const REPEAT_CUSTOMER_COUNT = 2;
export const REPEAT_WINDOW_DAYS = 30;

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RefundMode = "cash" | "bank" | "credit_note";
export type FlagCode = "REFUND_EXCEEDS_BILL" | "CASH_ABOVE_LIMIT" | "CASHIER_BURST" | "REPEAT_CUSTOMER";

export const FLAG_LEVEL: Record<FlagCode, RiskLevel> = {
    REFUND_EXCEEDS_BILL: "CRITICAL",
    CASH_ABOVE_LIMIT: "HIGH",
    CASHIER_BURST: "HIGH",
    REPEAT_CUSTOMER: "MEDIUM",
};

export const FLAG_LABEL: Record<FlagCode, string> = {
    REFUND_EXCEEDS_BILL: "Refunds exceed the bill",
    CASH_ABOVE_LIMIT: `Cash refund above ₹${CASH_REFUND_LIMIT.toLocaleString("en-IN")}`,
    CASHIER_BURST: `Cashier's ${CASHIER_DAILY_LIMIT}+ returns that day`,
    REPEAT_CUSTOMER: `Customer's ${REPEAT_CUSTOMER_COUNT}+ returns in ${REPEAT_WINDOW_DAYS} days`,
};

const LEVEL_RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

/** A return as loaded for the audit (populated invoice / creator, lean). */
export interface ReturnDoc {
    _id: unknown;
    returnId?: string;
    returnDate?: Date | string;
    createdAt?: Date | string;
    invoice?: { _id?: unknown; invoiceNo?: string; totalAmount?: number } | null;
    customer?: { _id?: unknown; name?: string } | null;
    customerName?: string;
    createdBy?: { _id?: unknown; name?: string } | null;
    refundMethod?: string;
    actualRefundMethod?: string;
    status?: string;
    totalReturnAmount?: number;
    subtotal?: number;
    items?: { productName?: string; returnedQty?: number; lineTotal?: number; reason?: string; condition?: string }[];
}

export interface AuditRow {
    id: string;
    returnId: string;
    date: string;
    time: string | null;
    bill: string | null;
    customer: string;
    cashier: string;
    amount: number;
    refundMode: RefundMode;
    refundMethod: string;
    reasons: string;
    items: number;
    status: string;
    flags: FlagCode[];
    level: RiskLevel;
}

const IST_OFFSET_MS = 5.5 * 3_600_000;
const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const round2 = (v: number): number => Math.round(v * 100) / 100;
const idOf = (v: unknown): string => (v && typeof v === "object" && "_id" in (v as object) ? String((v as { _id: unknown })._id) : v ? String(v) : "");
const when = (r: ReturnDoc): Date => new Date(String(r.returnDate ?? r.createdAt ?? ""));
export const istDay = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const istTime = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(11, 16);

/** The method the money actually went back by (actualRefundMethod once resolved, else what was asked for). */
export function refundModeOf(r: Pick<ReturnDoc, "refundMethod" | "actualRefundMethod">): { mode: RefundMode; method: string } {
    const method = String(r.actualRefundMethod || r.refundMethod || "credit");
    if (method === "cash") return { mode: "cash", method };
    if (["bank", "bank_transfer", "upi", "card", "cheque"].includes(method)) return { mode: "bank", method };
    // credit, or original_payment not resolved yet
    return { mode: "credit_note", method };
}

export const amountOf = (r: ReturnDoc): number => n(r.totalReturnAmount ?? r.subtotal);

const WALK_IN = /^(walk[- ]?in|cash)(\s+customer)?$/i;
/** Customer key for repeat-return checks: the customer record, else a real typed name. Walk-ins are never "repeat". */
export function customerKey(r: ReturnDoc): string | null {
    const id = idOf(r.customer);
    if (id) return `id:${id}`;
    const name = String(r.customerName ?? "").trim();
    return name && !WALK_IN.test(name) ? `name:${name.toLowerCase()}` : null;
}

export interface AuditContext {
    /** Returns in the lookback window (period start − REPEAT_WINDOW_DAYS … period end), for cashier / customer checks. */
    window: ReturnDoc[];
    /** All-time returned value per invoice id, for the refund-exceeds-bill check. */
    returnedByInvoice: Map<string, number>;
}

export function auditReturn(r: ReturnDoc, ctx: AuditContext): AuditRow {
    const d = when(r);
    const day = istDay(d);
    const amount = amountOf(r);
    const { mode, method } = refundModeOf(r);
    const flags: FlagCode[] = [];

    const invId = idOf(r.invoice);
    const billTotal = n(r.invoice?.totalAmount);
    if (invId && billTotal > 0 && (ctx.returnedByInvoice.get(invId) ?? 0) > billTotal + 0.5) flags.push("REFUND_EXCEEDS_BILL");

    if (mode === "cash" && amount > CASH_REFUND_LIMIT) flags.push("CASH_ABOVE_LIMIT");

    const cashier = idOf(r.createdBy);
    if (cashier && ctx.window.filter((w) => idOf(w.createdBy) === cashier && istDay(when(w)) === day).length >= CASHIER_DAILY_LIMIT) {
        flags.push("CASHIER_BURST");
    }

    const cust = customerKey(r);
    if (cust) {
        const since = d.getTime() - REPEAT_WINDOW_DAYS * 86_400_000;
        const count = ctx.window.filter((w) => customerKey(w) === cust && when(w).getTime() >= since && when(w).getTime() <= d.getTime()).length;
        if (count >= REPEAT_CUSTOMER_COUNT) flags.push("REPEAT_CUSTOMER");
    }

    const level = flags.reduce<RiskLevel>((lvl, f) => (LEVEL_RANK[FLAG_LEVEL[f]] > LEVEL_RANK[lvl] ? FLAG_LEVEL[f] : lvl), "LOW");
    const reasons = [...new Set((r.items ?? []).map((i) => String(i.reason ?? "").trim()).filter(Boolean))].join(", ");

    return {
        id: String(r._id),
        returnId: String(r.returnId ?? ""),
        date: day,
        time: Number.isNaN(d.getTime()) ? null : istTime(d),
        bill: r.invoice?.invoiceNo ?? null,
        customer: r.customer?.name || String(r.customerName ?? "").trim() || "Walk-in",
        cashier: r.createdBy?.name || "Unknown user",
        amount: round2(amount),
        refundMode: mode,
        refundMethod: method,
        reasons: reasons || "Not given",
        items: (r.items ?? []).reduce((a, i) => a + n(i.returnedQty), 0),
        status: String(r.status ?? "processed"),
        flags,
        level,
    };
}

export interface AuditSummary {
    returns: number;
    value: number;
    cash: number;
    bank: number;
    creditNote: number;
    byLevel: Record<RiskLevel, number>;
    byFlag: { code: FlagCode; label: string; level: RiskLevel; returns: number; value: number }[];
    byReason: { reason: string; lines: number; value: number }[];
    byCashier: { cashier: string; returns: number; value: number; cash: number }[];
}

export function summarize(rows: AuditRow[], periodReturns: ReturnDoc[]): AuditSummary {
    const byLevel: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const flagMap = new Map<FlagCode, { returns: number; value: number }>();
    const cashiers = new Map<string, { cashier: string; returns: number; value: number; cash: number }>();
    let value = 0, cash = 0, bank = 0, creditNote = 0;
    for (const r of rows) {
        value += r.amount;
        if (r.refundMode === "cash") cash += r.amount;
        else if (r.refundMode === "bank") bank += r.amount;
        else creditNote += r.amount;
        byLevel[r.level] += 1;
        for (const f of r.flags) {
            const s = flagMap.get(f) ?? { returns: 0, value: 0 };
            s.returns += 1; s.value += r.amount;
            flagMap.set(f, s);
        }
        const c = cashiers.get(r.cashier) ?? { cashier: r.cashier, returns: 0, value: 0, cash: 0 };
        c.returns += 1; c.value += r.amount; if (r.refundMode === "cash") c.cash += r.amount;
        cashiers.set(r.cashier, c);
    }
    // Reasons are per returned line (one return can have several).
    const reasons = new Map<string, { reason: string; lines: number; value: number }>();
    for (const doc of periodReturns) {
        for (const i of doc.items ?? []) {
            const reason = String(i.reason ?? "").trim() || "Not given";
            const s = reasons.get(reason) ?? { reason, lines: 0, value: 0 };
            s.lines += 1; s.value += n(i.lineTotal);
            reasons.set(reason, s);
        }
    }
    const order = Object.keys(FLAG_LEVEL) as FlagCode[];
    return {
        returns: rows.length,
        value: round2(value), cash: round2(cash), bank: round2(bank), creditNote: round2(creditNote),
        byLevel,
        byFlag: order.filter((f) => flagMap.has(f)).map((f) => ({ code: f, label: FLAG_LABEL[f], level: FLAG_LEVEL[f], returns: flagMap.get(f)!.returns, value: round2(flagMap.get(f)!.value) })),
        byReason: [...reasons.values()].map((r) => ({ ...r, value: round2(r.value) })).sort((a, b) => b.lines - a.lines || b.value - a.value),
        byCashier: [...cashiers.values()].map((c) => ({ ...c, value: round2(c.value), cash: round2(c.cash) })).sort((a, b) => b.value - a.value),
    };
}
