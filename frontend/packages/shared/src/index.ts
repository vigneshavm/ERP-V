export * from "./utils";
export * from "./schemas";

// Domain Types (Explicitly exported to avoid ambiguity)
export type {
    ExpenseCategory,
    Profile,
    MonthlySummary,
    Category,
    Participant,
    Goal,
    Loan,
    Budget,
    BankAccount,
    DashboardData,
    SMSTransfers,
    CalendarTransaction,
    ExpenseHistory,
    SMSMessage,
    StatsData,
    Notification,
} from "./types";

// Conflict Resolution: Rename User from types.ts to SchemaUser
export type { PersonalTransaction as Transaction, User as SchemaUser } from "./types";
export { PersonalTransactionType } from './adapters/types';

export * from './finance/finance';
export * from './inventory/product'; export * from './inventory/attributes'; export * from './inventory/enums';
export * from './purchase/purchase';
export * from './contact/supplier';

// Sales Types (Explicitly exported to avoid ambiguity with domain types)
export type {
    CartItem,
    CartItem as SalesCartItem,
    Customer,
    Customer as SalesCustomer,
    Invoice,
    Invoice as SalesInvoice,
    PopulatedInvoice,
    Sale,
    Sale as SalesSale,
    SaleStatus,
    SaleStatus as SalesSaleStatus,
    Session,
    Session as SalesSession,
    Estimate,
    EstimateItem,
    SalesOrder,
    SalesOrderItem
} from './sales/sales';

export * from './sales/salesReturn';
export { posSlice, default as posReducer } from './sales/posSlice';
export * from '@bizzai/auth';

export { useExpenseStore, ExpenseProvider, useExpenses } from './store/expenseStore';

export * from './common/common';
export { api } from './services/apiClient';
export * from './i18n/LanguageContext';
export * from './services/mockState';
export * from './services/gemini';
export * from './hooks/usePersonalFinance';

// Query
export * from './query/queryClient';
export * from './query/QueryProvider';

// Adapters Layer (Mock/DB)
export * from './adapters';
export * from './adapters/context';
export * from './adapters/hooks';
export * from './adapters/types';
