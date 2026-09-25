/**
 * Expense analysis (pure; ExpenseAnalysisService does the queries). Works only from what an Expense records:
 * date, category, amount, payment method, receipt, description and the user who entered it. There is no claim or
 * approval workflow on expenses, so nothing here reports "pending / approved / rejected claims".
 */

export const EXPENSE_RULES = {
    /** Expenses at or above this should carry a receipt. */
    receiptFrom: 2000,
    /** Same category and amount within this many days = possible duplicate. */
    duplicateDays: 3,
    /** An expense this many times its category's median (and at least largeFrom) is unusually large. */
    largeMultiple: 3,
    largeFrom: 5000,
    /** Income-tax s.40A(3): a cash payment above this to one person in a day is not deductible. */
    cashLimit: 10000,
} as const;

export type ExpenseFlag = "NO_RECEIPT" | "POSSIBLE_DUPLICATE" | "UNUSUALLY_LARGE" | "CASH_ABOVE_LIMIT" | "CASH_NOT_ALLOWED";

export const EXPENSE_FLAG_LABEL: Record<ExpenseFlag, string> = {
    NO_RECEIPT: `No receipt on an expense of ₹${EXPENSE_RULES.receiptFrom.toLocaleString("en-IN")} or more`,
    POSSIBLE_DUPLICATE: `Same category and amount within ${EXPENSE_RULES.duplicateDays} days`,
    UNUSUALLY_LARGE: `${EXPENSE_RULES.largeMultiple}× or more the usual amount for its category`,
    CASH_ABOVE_LIMIT: `Paid in cash above ₹${EXPENSE_RULES.cashLimit.toLocaleString("en-IN")} (not deductible under Income-tax s.40A(3))`,
    CASH_NOT_ALLOWED: "Paid in cash in a category set to no cash",
};

export interface ExpenseDoc {
    id: string;
    expenseNo: string;
    date: string; // India-time YYYY-MM-DD
    category: string;
    amount: number;
    paymentMethod: string;
    hasReceipt: boolean;
    description: string;
    recordedBy: string;
}

export interface CategoryPolicy { name: string; monthlyBudget: number; cashAllowed: boolean }

export interface ExpenseRow extends ExpenseDoc { flags: ExpenseFlag[] }

const round2 = (v: number) => Math.round(v * 100) / 100;
const dayMs = 86_400_000;
const dayNum = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / dayMs);
const isCash = (m: string) => m.trim().toLowerCase() === "cash";

function median(values: number[]): number {
    if (!values.length) return 0;
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Flags the expenses dated inside [from, to]. `history` must include the expenses before `from` that the rules look
 * back on (the duplicate window and the category's usual amount); only in-period expenses become rows.
 */
export function flagExpenses(history: ExpenseDoc[], policies: CategoryPolicy[], from: string, to: string): ExpenseRow[] {
    const policy = new Map(policies.map((p) => [p.name.trim().toLowerCase(), p]));
    const byCategory = new Map<string, ExpenseDoc[]>();
    for (const e of history) {
        const k = e.category.trim().toLowerCase();
        byCategory.set(k, [...(byCategory.get(k) ?? []), e]);
    }
    const typical = new Map([...byCategory].map(([k, list]) => [k, median(list.map((e) => e.amount))]));

    const rows: ExpenseRow[] = [];
    for (const e of history) {
        if (e.date < from || e.date > to) continue;
        const k = e.category.trim().toLowerCase();
        const flags: ExpenseFlag[] = [];
        if (!e.hasReceipt && e.amount >= EXPENSE_RULES.receiptFrom) flags.push("NO_RECEIPT");
        const twin = (byCategory.get(k) ?? []).some((o) => o.id !== e.id && Math.abs(o.amount - e.amount) < 0.005 && Math.abs(dayNum(o.date) - dayNum(e.date)) <= EXPENSE_RULES.duplicateDays);
        if (twin) flags.push("POSSIBLE_DUPLICATE");
        const usual = typical.get(k) ?? 0;
        const peers = byCategory.get(k)?.length ?? 0;
        if (peers >= 3 && usual > 0 && e.amount >= EXPENSE_RULES.largeFrom && e.amount >= usual * EXPENSE_RULES.largeMultiple) flags.push("UNUSUALLY_LARGE");
        if (isCash(e.paymentMethod) && e.amount > EXPENSE_RULES.cashLimit) flags.push("CASH_ABOVE_LIMIT");
        if (isCash(e.paymentMethod) && policy.get(k)?.cashAllowed === false) flags.push("CASH_NOT_ALLOWED");
        rows.push({ ...e, amount: round2(e.amount), flags });
    }
    return rows.sort((a, b) => (a.date === b.date ? b.amount - a.amount : a.date < b.date ? 1 : -1));
}

/** Days in [from, to], inclusive. */
export const daysIn = (from: string, to: string) => dayNum(to) - dayNum(from) + 1;

export function summarizeExpenses(rows: ExpenseRow[], policies: CategoryPolicy[], from: string, to: string) {
    const days = Math.max(1, daysIn(from, to));
    // A monthly budget pro-rated to the period (30.44 days = an average month).
    const budgetFactor = days / 30.44;
    const policy = new Map(policies.map((p) => [p.name.trim().toLowerCase(), p]));
    const total = rows.reduce((s, r) => s + r.amount, 0);

    const group = <K extends string>(keyOf: (r: ExpenseRow) => K) => {
        const m = new Map<K, { count: number; amount: number }>();
        for (const r of rows) {
            const g = m.get(keyOf(r)) ?? { count: 0, amount: 0 };
            g.count += 1; g.amount += r.amount;
            m.set(keyOf(r), g);
        }
        return m;
    };

    const byCategory = [...group((r) => r.category)].map(([category, g]) => {
        const budget = round2((policy.get(category.trim().toLowerCase())?.monthlyBudget ?? 0) * budgetFactor);
        return { category, count: g.count, amount: round2(g.amount), sharePct: total ? Math.round((g.amount / total) * 1000) / 10 : 0, budget: budget || null, overBudget: budget > 0 && g.amount > budget };
    }).sort((a, b) => b.amount - a.amount);

    const byMethod = [...group((r) => r.paymentMethod || "cash")].map(([method, g]) => ({ method, count: g.count, amount: round2(g.amount) })).sort((a, b) => b.amount - a.amount);
    const byRecorder = [...group((r) => r.recordedBy)].map(([name, g]) => ({ name, count: g.count, amount: round2(g.amount) })).sort((a, b) => b.amount - a.amount);

    const byDay = new Map<string, number>();
    for (const r of rows) byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.amount);
    const byMonth = new Map<string, number>();
    for (const r of rows) byMonth.set(r.date.slice(0, 7), (byMonth.get(r.date.slice(0, 7)) ?? 0) + r.amount);

    const flagCounts = (Object.keys(EXPENSE_FLAG_LABEL) as ExpenseFlag[]).map((flag) => {
        const hit = rows.filter((r) => r.flags.includes(flag));
        return { flag, label: EXPENSE_FLAG_LABEL[flag], count: hit.length, amount: round2(hit.reduce((s, r) => s + r.amount, 0)) };
    });

    return {
        total: round2(total),
        count: rows.length,
        days,
        avgPerDay: round2(total / days),
        withReceipt: rows.filter((r) => r.hasReceipt).length,
        cash: round2(rows.filter((r) => isCash(r.paymentMethod)).reduce((s, r) => s + r.amount, 0)),
        flagged: rows.filter((r) => r.flags.length).length,
        byCategory,
        byMethod,
        byRecorder,
        byDay: [...byDay].map(([date, amount]) => ({ date, amount: round2(amount) })).sort((a, b) => (a.date < b.date ? -1 : 1)),
        byMonth: [...byMonth].map(([month, amount]) => ({ month, amount: round2(amount) })).sort((a, b) => (a.month < b.month ? -1 : 1)),
        flagCounts,
    };
}
