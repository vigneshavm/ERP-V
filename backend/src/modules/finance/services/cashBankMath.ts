/**
 * Cash & bank overview calculations (pure; CashBankOverviewService does the queries).
 *
 * Cash in hand = the physical cash counted at the last Petty Cash close (all counters closed that day), plus cash in
 * minus cash out since that day (the Cash Flow report's rules: shop cash sales, ERP receipts, payments, expenses),
 * plus cash withdrawn from / minus cash deposited to bank. It is an estimate until the next count.
 */

export const ALERT_RULES = {
    /** Days without a cash count before it is flagged. */
    staleCountDays: 2,
    /** Counted-vs-expected difference that is worth a look, and one that is serious. */
    varianceWarn: 100,
    varianceCritical: 1000,
    /** An EMI or cheque due within this many days is "due soon". */
    dueSoonDays: 7,
    /** ERP bank entries older than this and still unreconciled. */
    unreconciledDays: 30,
} as const;

const round2 = (v: number) => Math.round(v * 100) / 100;
const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

export const addDays = (iso: string, days: number): string => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};
export const daysBetween = (from: string, to: string): number =>
    Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000);

/** Same day of month, `months` later; clamps to the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const total = (m - 1) + months;
    const year = y + Math.floor(total / 12);
    const month = ((total % 12) + 12) % 12;
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(d, last))).toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------------------------------------------- Cash */

export interface CashCount {
    /** Date of the last Petty Cash close (India time). */
    date: string;
    counted: number;
    expected: number;
    variance: number;
    counters: number;
}

/** The last count: every COMPLETED close on the latest closed date, added up across counters. */
export function lastCount(closes: { date: string; countedCash?: number; expectedCash?: number; variance?: number }[]): CashCount | null {
    if (!closes.length) return null;
    const date = closes.reduce((max, c) => (c.date > max ? c.date : max), closes[0].date);
    const day = closes.filter((c) => c.date === date);
    return {
        date,
        counted: round2(day.reduce((a, c) => a + n(c.countedCash), 0)),
        expected: round2(day.reduce((a, c) => a + n(c.expectedCash), 0)),
        variance: round2(day.reduce((a, c) => a + n(c.variance), 0)),
        counters: day.length,
    };
}

export interface CashMovement { cashIn: number; cashOut: number; fromBank: number; toBank: number }

export interface CashPosition {
    count: CashCount | null;
    /** Movement is counted from this day (the day after the count) to today. */
    since: string | null;
    movement: CashMovement;
    /** null when there is no count to start from. */
    estimated: number | null;
    daysSinceCount: number | null;
}

export function cashPosition(count: CashCount | null, movement: CashMovement, today: string): CashPosition {
    const m = { cashIn: round2(movement.cashIn), cashOut: round2(movement.cashOut), fromBank: round2(movement.fromBank), toBank: round2(movement.toBank) };
    if (!count) return { count: null, since: null, movement: m, estimated: null, daysSinceCount: null };
    return {
        count,
        since: addDays(count.date, 1),
        movement: m,
        estimated: round2(count.counted + m.cashIn - m.cashOut + m.fromBank - m.toBank),
        daysSinceCount: Math.max(0, daysBetween(count.date, today)),
    };
}


/* ---------------------------------------------------------------------------------------------------- Loans */

export interface LoanInput {
    id: string;
    name: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    emi: number;
    pending: number;
    startDate: string;
    status: string;
    paid: number;
    payments: number;
    lastPayment: string | null;
}

export type LoanHealth = "closed" | "overdue" | "due-soon" | "on-track";

export interface LoanRow extends LoanInput {
    /** EMIs that should have been paid by today (EMI k falls k months after the start date). */
    emisDue: number;
    overdueEmis: number;
    nextDue: string | null;
    paidPct: number;
    health: LoanHealth;
}

export function loanRow(l: LoanInput, today: string): LoanRow {
    let emisDue = 0;
    for (let k = 1; k <= l.termMonths; k++) if (addMonths(l.startDate, k) <= today) emisDue = k; else break;
    const overdueEmis = Math.max(0, emisDue - l.payments);
    const nextDue = l.status === "closed" || l.payments >= l.termMonths ? null : addMonths(l.startDate, l.payments + 1);
    const total = l.paid + l.pending;
    const paidPct = total > 0 ? Math.round((l.paid / total) * 1000) / 10 : 0;
    const health: LoanHealth = l.status === "closed" ? "closed"
        : overdueEmis > 0 ? "overdue"
        : nextDue && daysBetween(today, nextDue) <= ALERT_RULES.dueSoonDays ? "due-soon"
        : "on-track";
    return { ...l, paid: round2(l.paid), pending: round2(l.pending), emisDue, overdueEmis, nextDue, paidPct, health };
}

/* ---------------------------------------------------------------------------------------------------- Alerts */

export type AlertLevel = "critical" | "warning" | "info";
export interface FinanceAlert { level: AlertLevel; code: string; text: string }

export interface AlertInput {
    today: string;
    cash: CashPosition;
    banks: { name: string; type: string; balance: number; unreconciledOld: number }[];
    loans: LoanRow[];
    cheques: { type: "RECEIVED" | "ISSUED"; amount: number; date: string }[];
    overdueBills: { count: number; amount: number };
}

const rupees = (v: number) => `₹${Math.round(Math.abs(v)).toLocaleString("en-IN")}`;
const LEVEL_ORDER: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };

/** Alerts come only from recorded data; each says what it is based on. */
export function buildAlerts(a: AlertInput): FinanceAlert[] {
    const out: FinanceAlert[] = [];
    const { cash } = a;
    if (!cash.count) {
        out.push({ level: "warning", code: "NO_CASH_COUNT", text: "No Petty Cash close recorded yet, so cash in hand can't be worked out. Do a close to count the drawer." });
    } else {
        if ((cash.daysSinceCount ?? 0) > ALERT_RULES.staleCountDays) {
            out.push({ level: "warning", code: "STALE_CASH_COUNT", text: `Cash was last counted ${cash.daysSinceCount} days ago (${cash.count.date}); the cash figure is an estimate since then.` });
        }
        const v = Math.abs(cash.count.variance);
        if (v >= ALERT_RULES.varianceWarn) {
            out.push({ level: v >= ALERT_RULES.varianceCritical ? "critical" : "warning", code: "CASH_VARIANCE", text: `The last count was ${rupees(cash.count.variance)} ${cash.count.variance < 0 ? "short" : "over"} against expected cash (${cash.count.date}).` });
        }
        if (cash.estimated !== null && cash.estimated < 0) {
            out.push({ level: "critical", code: "CASH_NEGATIVE", text: "More cash went out than was counted plus cash received since the count: some cash movement isn't recorded." });
        }
    }
    for (const b of a.banks) {
        if (b.balance < 0 && b.type !== "Overdraft" && b.type !== "Loan") {
            out.push({ level: "critical", code: "BANK_NEGATIVE", text: `${b.name} shows a negative balance of ${rupees(b.balance)} in the ERP.` });
        }
        if (b.unreconciledOld > 0) {
            out.push({ level: "warning", code: "OLD_UNRECONCILED", text: `${b.name}: ${b.unreconciledOld} entr${b.unreconciledOld === 1 ? "y" : "ies"} older than ${ALERT_RULES.unreconciledDays} days not yet matched to the bank statement.` });
        }
    }
    for (const l of a.loans) {
        if (l.health === "overdue") out.push({ level: "critical", code: "EMI_OVERDUE", text: `${l.name}: ${l.overdueEmis} EMI${l.overdueEmis === 1 ? "" : "s"} of ${rupees(l.emi)} not recorded as paid.` });
        else if (l.health === "due-soon" && l.nextDue) out.push({ level: "info", code: "EMI_DUE_SOON", text: `${l.name}: EMI of ${rupees(l.emi)} due on ${l.nextDue}.` });
    }
    const pastDate = a.cheques.filter((c) => c.date < a.today);
    for (const type of ["RECEIVED", "ISSUED"] as const) {
        const list = pastDate.filter((c) => c.type === type);
        if (list.length) {
            const total = list.reduce((s, c) => s + c.amount, 0);
            out.push({ level: "warning", code: `CHEQUE_${type}_PAST_DATE`, text: `${list.length} ${type === "RECEIVED" ? "received" : "issued"} cheque${list.length === 1 ? "" : "s"} (${rupees(total)}) past their date and still pending.` });
        }
    }
    if (a.overdueBills.count > 0) {
        out.push({ level: "warning", code: "BILLS_OVERDUE", text: `${a.overdueBills.count} supplier bill${a.overdueBills.count === 1 ? "" : "s"} past due, ${rupees(a.overdueBills.amount)} still to pay.` });
    }
    return out.sort((x, y) => LEVEL_ORDER[x.level] - LEVEL_ORDER[y.level]);
}

/* ---------------------------------------------------------------------------------------------------- Bank reconciliation */

export interface StatementLine { id: string; date: string; amount: number; type: "credit" | "debit"; description: string; reference: string; balance: number | null; reconciled: boolean }
export interface LedgerEntry { id: string; date: string; amount: number; direction: "credit" | "debit"; description: string; reference: string; reconciled: boolean }
export interface MatchSuggestion { statementId: string; entryId: string; amount: number; direction: "credit" | "debit"; dayGap: number }

export const MATCH_DAY_WINDOW = 3;

/**
 * Suggests one-to-one matches between unreconciled statement lines and unreconciled ERP entries: same direction
 * (money into / out of the bank), same amount to the paisa, dates within MATCH_DAY_WINDOW days. Closest dates first.
 */
export function suggestMatches(lines: StatementLine[], entries: LedgerEntry[]): MatchSuggestion[] {
    const cands: MatchSuggestion[] = [];
    for (const l of lines) {
        if (l.reconciled) continue;
        for (const e of entries) {
            if (e.reconciled || e.direction !== l.type || Math.abs(e.amount - l.amount) >= 0.005) continue;
            const dayGap = Math.abs(daysBetween(l.date, e.date));
            if (dayGap <= MATCH_DAY_WINDOW) cands.push({ statementId: l.id, entryId: e.id, amount: round2(l.amount), direction: l.type, dayGap });
        }
    }
    cands.sort((a, b) => a.dayGap - b.dayGap || a.statementId.localeCompare(b.statementId) || a.entryId.localeCompare(b.entryId));
    const usedL = new Set<string>(), usedE = new Set<string>();
    const out: MatchSuggestion[] = [];
    for (const c of cands) {
        if (usedL.has(c.statementId) || usedE.has(c.entryId)) continue;
        usedL.add(c.statementId); usedE.add(c.entryId);
        out.push(c);
    }
    return out;
}

export function reconciliationSummary(lines: StatementLine[], entries: LedgerEntry[], matches: MatchSuggestion[]) {
    const signed = (dir: "credit" | "debit", v: number) => (dir === "credit" ? v : -v);
    const matchedL = new Set(matches.map((m) => m.statementId));
    const matchedE = new Set(matches.map((m) => m.entryId));
    const openLines = lines.filter((l) => !l.reconciled && !matchedL.has(l.id));
    const openEntries = entries.filter((e) => !e.reconciled && !matchedE.has(e.id));
    const withBalance = [...lines].filter((l) => l.balance !== null).sort((a, b) => (a.date < b.date ? -1 : 1));
    return {
        statementNet: round2(lines.reduce((s, l) => s + signed(l.type, l.amount), 0)),
        erpNet: round2(entries.reduce((s, e) => s + signed(e.direction, e.amount), 0)),
        statementClosing: withBalance.length ? withBalance[withBalance.length - 1].balance : null,
        reconciledLines: lines.filter((l) => l.reconciled).length,
        reconciledEntries: entries.filter((e) => e.reconciled).length,
        suggested: matches.length,
        onlyInStatement: { count: openLines.length, net: round2(openLines.reduce((s, l) => s + signed(l.type, l.amount), 0)) },
        onlyInErp: { count: openEntries.length, net: round2(openEntries.reduce((s, e) => s + signed(e.direction, e.amount), 0)) },
    };
}
