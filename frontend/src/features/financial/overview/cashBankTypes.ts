/** Shapes returned by /api/reports/finance/{cash-bank-overview, loans, bank-reconciliation} (CashBankOverviewService). */

export type AlertLevel = 'critical' | 'warning' | 'info';
export interface FinanceAlert { level: AlertLevel; code: string; text: string }

export interface CashCount { date: string; counted: number; expected: number; variance: number; counters: number }
export interface CashPosition {
    count: CashCount | null;
    since: string | null;
    movement: { cashIn: number; cashOut: number; fromBank: number; toBank: number };
    estimated: number | null;
    daysSinceCount: number | null;
}

export interface BankRow {
    id: string; name: string; type: string; branch: string; balance: number; opening: number; status: string;
    unreconciled: number; unreconciledAmount: number; unreconciledOld: number;
}

export type LoanHealth = 'closed' | 'overdue' | 'due-soon' | 'on-track';
export interface LoanRow {
    id: string; name: string; principal: number; interestRate: number; termMonths: number; emi: number; pending: number;
    startDate: string; status: string; paid: number; payments: number; lastPayment: string | null;
    emisDue: number; overdueEmis: number; nextDue: string | null; paidPct: number; health: LoanHealth;
}

export interface ChequeRow { id: string; number: string; payee: string; bank: string; amount: number; date: string; type: 'RECEIVED' | 'ISSUED' }
export interface OverdueBill { id: string; billNo: string; supplier: string; due: string; outstanding: number; daysOverdue: number }

export interface CashBankOverviewData {
    today: string;
    cash: CashPosition;
    banks: BankRow[];
    bankTotal: number;
    loans: LoanRow[];
    loanTotals: { active: number; pending: number; monthlyEmi: number; nextDue: string | null };
    cheques: { rows: ChequeRow[]; toReceive: number; toPay: number };
    overdueBills: { count: number; amount: number; rows: OverdueBill[] };
    trend: {
        from: string; to: string;
        totals: { cashIn: number; bankIn: number; cashOut: number; bankOut: number; net: number };
        byDay: { date: string; inflow: number; outflow: number; net: number; cashNet: number; bankNet: number }[];
    };
    alerts: FinanceAlert[];
    rules: { staleCountDays: number; varianceWarn: number; varianceCritical: number; dueSoonDays: number; unreconciledDays: number };
    asOf: string | null;
    source?: 'sql' | 'mongo';
}

export interface LoansData {
    today: string;
    loans: LoanRow[];
    totals: { active: number; pending: number; paid: number; monthlyEmi: number; overdue: number };
    banks: { id: string; name: string; type: string }[];
}

export interface StatementLine { id: string; date: string; amount: number; type: 'credit' | 'debit'; description: string; reference: string; balance: number | null; reconciled: boolean }
export interface LedgerEntry { id: string; date: string; amount: number; direction: 'credit' | 'debit'; description: string; reference: string; reconciled: boolean }
export interface MatchSuggestion { statementId: string; entryId: string; amount: number; direction: 'credit' | 'debit'; dayGap: number }

export interface ReconciliationData {
    range: { from: string; to: string };
    account: { id: string; name: string; type: string; erpBalance: number };
    summary: {
        statementNet: number; erpNet: number; statementClosing: number | null; reconciledLines: number; reconciledEntries: number; suggested: number;
        onlyInStatement: { count: number; net: number }; onlyInErp: { count: number; net: number };
    };
    matches: MatchSuggestion[];
    lines: StatementLine[];
    entries: LedgerEntry[];
    asOf: string;
}
