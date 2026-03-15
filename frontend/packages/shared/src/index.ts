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

export * from './finance/finance';
export * from './inventory/product';
export * from './inventory/attributes';
export * from './purchase/purchase';
export * from './contact/supplier';

// Sales Types (Explicitly exported to avoid ambiguity with domain types)
export type { 
  CartItem as SalesCartItem, 
  Customer as SalesCustomer, 
  Invoice as SalesInvoice, 
  Sale as SalesSale, 
  SaleStatus as SalesSaleStatus,
  Session as SalesSession
} from './sales/sales';

export * from './sales/salesReturn';
export { posSlice, default as posReducer } from './sales/posSlice';
export * from './auth/auth.schema';

// Auth Store - Export User as the primary 'User' type for authentication context
export { useAuthStore } from './auth/authStore';
export type { AuthState, User } from './auth/authStore';

export * from './common/common';
export { api } from './services/apiClient';
export * from './i18n/LanguageContext';
export * from './auth/auth.utils';
export * from './contexts/ExpenseContext';
export * from './services/mockState';
export * from './services/gemini';
export * from './events/eventTypes';
export * from './events/eventBus';
export * from './hooks/usePersonalFinance';
