/**
 * Shared Type Definitions for Expancer (Personal Finance)
 */

export enum PersonalTransactionType {
    INCOME = 'income',
    EXPENSE = 'expense'
}

export enum AdapterPaymentMethod {
    CASH = 'cash',
    UPI = 'upi',
    CARD = 'card',
    CHEQUE = 'cheque',
    BANK_TRANSFER = 'bank_transfer'
}

export enum AccountType {
    SAVINGS = 'Savings',
    CURRENT = 'Current',
    OD = 'OD',
    CC = 'CC',
    LOAN = 'Loan',
    OTHER = 'Other'
}

export enum LoanStatus {
    ACTIVE = 'active',
    CLOSED = 'closed'
}

export enum GoalStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface PersonalUser {
    id: string;
    name: string;
    email: string;
    currency: string;
    totalWealth: number;
    monthStartDay: number;
    createdAt: string;
}

export interface PersonalTransaction {
    id: string;
    type: PersonalTransactionType;
    amount: number;
    category: string;
    categoryId: string;
    accountId: string;
    accountName: string;
    date: string;
    description: string;
    paymentMethod: AdapterPaymentMethod;
    isRecurring: boolean;
    receiptUrl?: string;
    createdAt: string;
}

export interface PersonalCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense' | 'both';
    monthlyBudget?: number;
}

export interface PersonalBankAccount {
    id: string;
    bankName: string;
    accountNumber: string; // Last 4 digits for display
    accountType: AccountType;
    currentBalance: number;
    isActive: boolean;
}

export interface PersonalGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    status: GoalStatus;
    color: string;
    category: string;
    icon?: string;
    dailyNudge?: number;
    isCollaborative?: boolean;
    participants?: Array<{
        id: string;
        name: string;
        initials: string;
        color: string;
        contribution: number;
    }>;
}

export interface PersonalLoan {
    id: string;
    name: string;
    bank: string;
    type: 'Borrowed' | 'Lent';
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    emiAmount: number;
    totalPendingAmount: number;
    paidAmount: number;
    startDate: string;
    deadline: string;
    status: LoanStatus;
    color: string;
    icon: string;
}

export interface PersonalBudget {
    id: string;
    mode: 'zero-based' | 'flexible';
    totalBudget: number;
    spentAmount: number;
    categoryBudgets: {
        categoryId: string;
        categoryName: string;
        allotted: number;
        spent: number;
    }[];
}

export interface SmsRule {
    id: string;
    sender: string; // e.g., 'SBI'
    pattern: string; // Regex or keyword
    suggestedCategory: string;
}

export interface SmsTransaction {
    id: string;
    rawText: string;
    sender: string;
    amount: number;
    date: string;
    type: 'debit' | 'credit' | 'unknown';
    merchant?: string;
    status: 'pending' | 'converted' | 'ignored';
}

export interface AnalyticsSummary {
    totalIncome: number;
    totalExpense: number;
    savingsRate: number;
    topCategories: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expense: number }[];
}

export interface YearlyOverview {
    year: number;
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    months: {
        month: string;
        income: number;
        expense: number;
        savings: number;
    }[];
}

export interface ExpenseHistory {
    totalSpent: number;
    month: string;
    categories: Array<{ name: string; value: number; color: string }>;
    paymentMethods: Array<{ name: string; value: number; color: string }>;
    dailyTrend: Array<{ day: string; amount: number }>;
}

/**
 * ERP & Enterprise Specific Types
 */

export interface JournalEntry {
    id: string;
    date: string;
    reference: string;
    description: string;
    status: 'POSTED' | 'DRAFT';
    entries: { accountId: string; accountName: string; debit: number; credit: number; }[];
}

export interface StockReport {
    summary: {
        totalItems: number;
        lowStockItems: number;
        totalValue: number;
    };
    items: Array<{
        id: string;
        name: string;
        sku: string;
        stockQty: number;
        minStockLevel: number;
        costPrice: number;
    }>;
}

export interface DashboardStats {
    totalRevenue: number;
    totalOutstanding: number;
    totalBalance: number;
    totalProfit: number;
    dailySales: Array<{ _id: string; totalSales: number }>;
    revenueVsExpenses?: Array<{ month: string; revenue: number; expenses: number }>;
}

export interface SupplierAnalytics {
    id: string;
    name: string;
    netBalance: number;
    totalInvoices: number;
    lastPaymentDate?: string;
}
