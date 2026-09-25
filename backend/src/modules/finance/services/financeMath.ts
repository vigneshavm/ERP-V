/**
 * Pure arithmetic for the financial reports (Day Book, All Transactions, Cash Flow, P&L, Bill-wise Profit).
 * No DB access, so each rule is unit-tested on its own.
 *
 * Every transaction becomes one FinanceEntry that says how much money actually moved and how:
 *   cashIn / bankIn    money received (bank = UPI, card, bank transfer, cheque)
 *   cashOut / bankOut  money paid
 *   credit             billed but not settled (credit sale or credit purchase): no money moved yet
 * Transfers between the shop's own cash and bank accounts are kept as their own type and never counted
 * as inflow or outflow.
 */

export type EntrySource = "shop" | "erp";

export type EntryType =
    | "sale" | "sale-return" | "receipt"
    | "purchase" | "purchase-return" | "supplier-payment"
    | "expense" | "cash-in" | "cash-out" | "transfer";

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
    "sale": "Sale",
    "sale-return": "Sales return",
    "receipt": "Customer receipt",
    "purchase": "Purchase",
    "purchase-return": "Purchase return",
    "supplier-payment": "Supplier payment",
    "expense": "Expense",
    "cash-in": "Cash in",
    "cash-out": "Cash out",
    "transfer": "Transfer",
};

export interface FinanceEntry {
    source: EntrySource;
    type: EntryType;
    /** 'YYYY-MM-DD' (IST). */
    date: string;
    /** 'HH:MM' when the record has a time. */
    time: string | null;
    ref: string;
    party: string;
    /** Document value (bill total, expense amount…), always positive. */
    amount: number;
    cashIn: number;
    bankIn: number;
    cashOut: number;
    bankOut: number;
    credit: number;
    note: string;
}

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const n = (v: unknown): number => {
    const x = typeof v === "number" ? v : Number(String(v ?? "").trim());
    return Number.isFinite(x) ? x : 0;
};

export type Mode = "cash" | "bank" | "credit";

/** Payment method text from any model → how the money moved. Unknown methods count as bank (never as cash). */
export function modeOf(method: unknown): Mode {
    const m = String(method ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (m === "cash") return "cash";
    if (m === "due" || m === "credit" || m === "oncredit") return "credit";
    return "bank";
}

export interface Split { cash: number; bank: number; credit: number }

/**
 * Textilesoft bill payment split. The bill records card, UPI (s_googlepay), s_credit_amt and s_selfamt;
 * cash is what is left of the bill total, because s_recevied_cashamt can hold the tendered amount (with change)
 * and older bills record no split at all (whole bill in cash). s_credit_amt and s_selfamt count as bank, the
 * convention the existing sales-intelligence report uses. A split larger than the total is capped and reported.
 */
export function shopBillSplit(total: number, card: number, upi: number, creditAmt: number, self: number): Split & { overpaid: boolean } {
    const nonCash = Math.max(0, card) + Math.max(0, upi) + Math.max(0, creditAmt) + Math.max(0, self);
    const overpaid = nonCash > total + 0.5;
    const bank = Math.min(nonCash, Math.max(0, total));
    return { cash: round2(Math.max(0, total - bank)), bank: round2(bank), credit: 0, overpaid };
}

/**
 * ERP invoice split from paymentMethod / splitPaymentDetails / paidAmount. Anything not received is credit.
 */
export function erpInvoiceSplit(inv: { totalAmount?: unknown; paidAmount?: unknown; paymentMethod?: unknown; splitPaymentDetails?: { method?: unknown; amount?: unknown }[] }): Split {
    const total = Math.max(0, n(inv.totalAmount));
    const out: Split = { cash: 0, bank: 0, credit: 0 };
    if (String(inv.paymentMethod ?? "") === "split" && Array.isArray(inv.splitPaymentDetails) && inv.splitPaymentDetails.length) {
        for (const d of inv.splitPaymentDetails) out[modeOf(d.method)] += Math.max(0, n(d.amount));
    } else {
        const mode = modeOf(inv.paymentMethod);
        const paid = inv.paidAmount === undefined || inv.paidAmount === null ? (mode === "credit" ? 0 : total) : Math.max(0, n(inv.paidAmount));
        if (mode === "credit") out.credit += total;
        else { out[mode] += Math.min(paid, total); out.credit += Math.max(0, total - paid); }
    }
    // Received more than billed (e.g. old dues paid with this bill): cap at the bill total; dues are receipts.
    const received = out.cash + out.bank;
    if (received > total && received > 0) {
        const f = total / received;
        out.cash *= f; out.bank *= f;
    }
    // Whatever was not received is on credit.
    return { cash: round2(out.cash), bank: round2(out.bank), credit: round2(Math.max(0, total - round2(out.cash) - round2(out.bank))) };
}

/** An entry with money received into the given mode. */
export function inflow(e: Omit<FinanceEntry, "cashIn" | "bankIn" | "cashOut" | "bankOut" | "credit">, split: Split): FinanceEntry {
    return { ...e, cashIn: split.cash, bankIn: split.bank, cashOut: 0, bankOut: 0, credit: split.credit };
}

/** An entry with money paid from the given mode. */
export function outflow(e: Omit<FinanceEntry, "cashIn" | "bankIn" | "cashOut" | "bankOut" | "credit">, split: Split): FinanceEntry {
    return { ...e, cashIn: 0, bankIn: 0, cashOut: split.cash, bankOut: split.bank, credit: split.credit };
}

/** The whole amount in one mode. */
export const all = (amount: number, mode: Mode): Split => ({ cash: mode === "cash" ? amount : 0, bank: mode === "bank" ? amount : 0, credit: mode === "credit" ? amount : 0 });

export interface FlowTotals {
    entries: number;
    amount: number;
    cashIn: number;
    bankIn: number;
    cashOut: number;
    bankOut: number;
    credit: number;
    /** (cashIn + bankIn) − (cashOut + bankOut). Transfers excluded. */
    net: number;
}

export function flowTotals(list: FinanceEntry[]): FlowTotals {
    const t = { entries: 0, amount: 0, cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 0, credit: 0 };
    for (const e of list) {
        t.entries += 1;
        t.amount += e.amount;
        if (e.type === "transfer") continue;
        t.cashIn += e.cashIn; t.bankIn += e.bankIn; t.cashOut += e.cashOut; t.bankOut += e.bankOut; t.credit += e.credit;
    }
    return {
        entries: t.entries, amount: round2(t.amount), cashIn: round2(t.cashIn), bankIn: round2(t.bankIn),
        cashOut: round2(t.cashOut), bankOut: round2(t.bankOut), credit: round2(t.credit),
        net: round2(t.cashIn + t.bankIn - t.cashOut - t.bankOut),
    };
}

/** Totals per entry type, in ENTRY_TYPE_LABEL order, only types that occur. */
export function byType(list: FinanceEntry[]): (FlowTotals & { type: EntryType; label: string })[] {
    return (Object.keys(ENTRY_TYPE_LABEL) as EntryType[])
        .map((type) => ({ type, label: ENTRY_TYPE_LABEL[type], ...flowTotals(list.filter((e) => e.type === type)) }))
        .filter((r) => r.entries > 0);
}

/** Totals per day, in date order. */
export function byDay(list: FinanceEntry[]): (FlowTotals & { date: string })[] {
    const days = [...new Set(list.map((e) => e.date))].sort();
    return days.map((date) => ({ date, ...flowTotals(list.filter((e) => e.date === date)) }));
}

/** Entries in time order: date, then time (untimed entries first in their day), then ref. */
export const chronological = (a: FinanceEntry, b: FinanceEntry): number =>
    a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "") || a.ref.localeCompare(b.ref, undefined, { numeric: true });

/* ------------------------------------------------------------------------------------------------ Profit */

export interface BillProfit {
    /** Sales excluding GST (bill total − GST). */
    netSales: number;
    /** Share (0..1) of the bill's line value whose cost is known. */
    coverage: number;
    cost: number;
    /** On the costed share of the bill only. */
    profit: number;
    /** % of costed net sales; null when nothing is costed. */
    marginPct: number | null;
}

/**
 * Gross profit of one bill, the Party P&L formula: net sales = bill total − GST; the costed share of it is
 * net × (line value with a known cost ÷ all line value); profit = costed net − cost. Lines without a cost are left
 * out of both sides, never treated as costing nothing.
 */
export function billProfit(total: number, gst: number, lineValue: number, uncostedValue: number, cost: number): BillProfit {
    const net = total - gst;
    const coverage = lineValue > 0 ? Math.max(0, Math.min(1, (lineValue - uncostedValue) / lineValue)) : 0;
    const costedNet = net * coverage;
    const profit = costedNet - cost;
    return {
        netSales: round2(net),
        coverage: Math.round(coverage * 1000) / 1000,
        cost: round2(cost),
        profit: round2(profit),
        marginPct: costedNet > 0 ? Math.round((profit / costedNet) * 1000) / 10 : null,
    };
}

export interface ProfitTotals {
    bills: number;
    netSales: number;
    /** Net sales whose cost is known (the base for gross profit). */
    costedSales: number;
    cost: number;
    grossProfit: number;
    marginPct: number | null;
    coveragePct: number;
}

export function profitTotals(list: BillProfit[]): ProfitTotals {
    let net = 0, costed = 0, cost = 0, profit = 0;
    for (const b of list) { net += b.netSales; costed += b.netSales * b.coverage; cost += b.cost; profit += b.profit; }
    return {
        bills: list.length,
        netSales: round2(net),
        costedSales: round2(costed),
        cost: round2(cost),
        grossProfit: round2(profit),
        marginPct: costed > 0 ? Math.round((profit / costed) * 1000) / 10 : null,
        coveragePct: net > 0 ? Math.round((costed / net) * 1000) / 10 : 0,
    };
}
