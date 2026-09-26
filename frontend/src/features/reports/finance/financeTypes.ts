import type { PageInfo, ResolvedSource } from '../components';

/** Shapes returned by /api/reports/finance/* (see backend FinanceReportService). */

export type EntryType =
    | 'sale' | 'sale-return' | 'receipt'
    | 'purchase' | 'purchase-return' | 'supplier-payment'
    | 'expense' | 'cash-in' | 'cash-out' | 'transfer';

export interface FinanceEntry {
    source: 'shop' | 'erp';
    type: EntryType;
    typeLabel: string;
    date: string;
    time: string | null;
    ref: string;
    party: string;
    amount: number;
    cashIn: number;
    bankIn: number;
    cashOut: number;
    bankOut: number;
    credit: number;
    note: string;
}

export interface FlowTotals {
    entries: number;
    amount: number;
    cashIn: number;
    bankIn: number;
    cashOut: number;
    bankOut: number;
    credit: number;
    net: number;
}

export interface TypeRow extends FlowTotals { type: EntryType; label: string }

export interface FinanceChecks { overpaidShopBills: number; returnsAvailable: boolean }

interface Base { asOf: string | null; source: ResolvedSource }

export interface DayBookData extends Base {
    date: string;
    totals: FlowTotals;
    byType: TypeRow[];
    entries: FinanceEntry[];
    checks: FinanceChecks;
}

export interface TransactionsData extends Base {
    range: { from: string; to: string };
    totals: FlowTotals;
    byType: TypeRow[];
    items: FinanceEntry[];
    pagination: PageInfo;
    checks: FinanceChecks;
}

export interface FlowLine { type: EntryType; label: string; cash: number; bank: number; total: number; entries: number }

export interface CashFlowData extends Base {
    range: { from: string; to: string };
    totals: FlowTotals;
    inflows: FlowLine[];
    outflows: FlowLine[];
    credit: { sales: number; purchases: number };
    transfers: number;
    byDay: { date: string; inflow: number; outflow: number; net: number; cashNet: number; bankNet: number }[];
    checks: FinanceChecks;
}

export interface ProfitTotals {
    bills: number;
    netSales: number;
    costedSales: number;
    cost: number;
    grossProfit: number;
    marginPct: number | null;
    coveragePct: number;
}

export interface ProfitLossData extends Base {
    range: { from: string; to: string };
    sales: ProfitTotals;
    returns: ProfitTotals;
    total: ProfitTotals;
    uncostedSales: number;
    expenses: { total: number; byCategory: { category: string; amount: number }[] };
    netProfit: number;
    bySource: { shop: ProfitTotals; erp: ProfitTotals };
    byMonth: { month: string; netSales: number; costedSales: number; cost: number; grossProfit: number; expenses: number; netProfit: number }[];
}

export interface ProfitRow {
    source: 'shop' | 'erp';
    kind: 'bill' | 'return';
    id: string;
    ref: string;
    date: string;
    time: string | null;
    party: string;
    total: number;
    gst: number;
    netSales: number;
    coverage: number;
    cost: number;
    profit: number;
    marginPct: number | null;
}

export interface BillProfitData extends Base {
    range: { from: string; to: string };
    summary: ProfitTotals;
    lossBills: number;
    items: ProfitRow[];
    pagination: PageInfo;
}
