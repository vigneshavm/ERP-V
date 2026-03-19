import { Request } from 'express';

export interface JwtPayload {
  sub: string;       // user id (MongoDB _id as string)
  email: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

// ─── Domain types (MongoDB / camelCase) ──────────────────────────────────────

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  emoji?: string;
  color: string;
  type: 'expense' | 'income';
  value: number;        // current month spent/earned (computed)
  limitAmount: number;  // monthly budget cap
  over: boolean;        // computed: value > limitAmount
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  date: Date;
  notes?: string;
  isAnomaly: boolean;
  anomalyReason?: string;
  paymentMethod?: string;
  accountId?: string;
  disputed: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;        // YYYY-MM
  totalAmount: number;
  mode: 'zero-based' | 'flexible';
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  name?: string;
  totalAmount: number;
  spent: number;
  overspent: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  color: string;
  deadline: string;
  dailyNudge: number;
}

export interface Loan {
  id: string;
  userId: string;
  name: string;
  bank: string;
  current: number;
  total: number;
  interestRate: number;
  tenureMonths: number;
  type: 'Borrowed' | 'Lent';
  deadline: string;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'Savings' | 'Checking' | 'Current' | 'Wallet';
  balance: number;
  income: number;
  expense: number;
  color: string;
  selected: boolean;
}

export interface CreditCard {
  id: string;
  userId: string;
  bank: string;
  cardName: string;
  last4: string;
  network: string;
  limit: number;
  spent: number;
  dueDate: string;
  minDue: number;
  color: string;
  gradient: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  amount?: number;
  icon: string;
  color: string;
  read: boolean;
  createdAt: string;
}
