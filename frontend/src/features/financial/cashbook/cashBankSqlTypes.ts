/** Response of GET /api/reports/finance/cash-bank (Textilesoft's own cash, day-close and bank tables). */
export type Unavailable = { available: false; reason: string };

export interface CashDayRow { date: string; in: number; out: number; entries: number }
export interface CashEntryRow { date: string; counter: string; cashier: string; party: string; bill: string; in: number; out: number }
export interface CashSection {
    available: true; in: number; out: number; net: number; byDay: CashDayRow[]; rows: CashEntryRow[]; truncated: boolean;
}

export interface DayCloseRow {
    date: string; counter: string; cashier: string; slNo: string; bills: number; sales: number; card: number; upi: number; selfPay: number;
    credit: number; cashIn: number; cashOut: number; opening: number; handedOver: number; counted: number; status: string;
}
export interface DayCloseSection {
    available: true; rows: DayCloseRow[]; openings: { date: string; counter: string; cashier: string; opened: number }[];
    totals: { days: number; sales: number; card: number; upi: number; credit: number };
}

export interface BankSummaryRow { bank: string; in: number; out: number; net: number; entries: number }
export interface BankEntryRow {
    date: string; tranNo: string; code: string; name: string; bank: string; account: string; mode: string; remarks: string;
    counter: string; in: number; out: number; balance: number;
}
export interface BankSection {
    available: true; in: number; out: number; net: number; byBank: BankSummaryRow[]; rows: BankEntryRow[]; truncated: boolean;
}

export interface TakingsDayRow { date: string; bills: number; total: number; cash: number; card: number; upi: number; credit: number; selfPay: number }
export interface TakingsSection {
    available: true; days: TakingsDayRow[];
    totals: { bills: number; total: number; cash: number; card: number; upi: number; credit: number; selfPay: number };
}

export interface CashBankSqlData {
    takings: TakingsSection | Unavailable;
    range: { from: string; to: string };
    cash: CashSection | Unavailable;
    dayClose: DayCloseSection | Unavailable;
    bank: BankSection | Unavailable;
    asOf: string | null;
    source: 'sql';
}
