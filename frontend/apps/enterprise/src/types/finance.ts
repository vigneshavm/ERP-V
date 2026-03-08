import { Sector, TransactionType } from './common';

export interface Expense {
    id: string; // Helper for _id
    _id?: string;
    expenseNo: string;
    date: string;
    category: string;
    amount: number;
    description?: string;
    paymentMethod: string;
    bankAccount?: string;
    receipt?: string;
    createdBy?: string;
    tenantId?: string; // Not in model explicitly but usually needed
    branchId?: string; // Not in model explicitly but usually needed
    status?: string; // 'PAID' etc. (Backend model missing status, might need to add it or infer)
    sector?: Sector;
}

export interface DailyFinanceRecord {
    id: string;
    _id?: string;
    tenantId: string;
    date: string; // ISO Date
    cashSales: number;
    onlineSales: number;
    totalSales: number;
    expenses: number;
    cashInDrawer: number;
    notes?: string;
    sector?: string;
    synced?: boolean;
    timestamp?: string; // Legacy/Frontend
}

export interface Transaction {
    id: string;
    _id?: string;
    type: string; // 'sale', 'payment', 'purchase', etc.
    amount: number;
    date: string; // updatedAt or createdAt
    paymentMethod: string;
    description?: string;

    // Relations
    customer?: string;
    invoice?: string;
    returnReference?: string; // Mapped from 'return' in backend
    dueAdjustment?: string;

    // Frontend helpers
    tenantId?: string;
    branchId?: string;
    sector?: Sector;
    category?: string; // Helper for UI groupings
}

export interface Cheque {
    id?: string;
    _id?: string;
    number: string;
    bankName: string;
    payee: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'CLEARED' | 'BOUNCED';
    type: 'ISSUED' | 'RECEIVED';
    sector: Sector;
    notes?: string;
    accountId?: string;
}

// Redux State Interface
export interface FinanceState {
    bankBalance: number;
    effectiveBalance: number;
    cheques: Cheque[];
    transactions: Transaction[];
    dailyFinanceRecords: DailyFinanceRecord[];
    loading: boolean;
    error: string | null;
    pdcAlerts: {
        count: number;
        total: number;
    } | null;
    dayEndSummary: DayEndSummary | null;
}

export interface SupplierLimitAlert {
    supplierId: string;
    businessName: string;
    balance: number;
    creditLimit: number;
    percentage: number;
}

export interface DayEndSummary {
    openingCash: number;
    cashSales: number;
    cashExpenses: number;
    expectedCash: number;
    pendingCheques: Cheque[];
    supplierAlerts: SupplierLimitAlert[];
}
