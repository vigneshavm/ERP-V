import { Request } from 'express';

export interface JwtPayload {
  sub: string;       // user id
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
  sortOrder: 'ASC' | 'DESC';
  search: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

// ─── Domain types (mirroring frontend @repo/shared) ───────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  color: string;
  type: 'expense' | 'income';
  value: number;        // current month spent/earned
  limit: number;        // monthly budget cap
  over: boolean;
  user_id: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  notes?: string;
  is_anomaly: boolean;
  anomaly_reason?: string;
  payment_method?: string;
  account_id?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string;        // YYYY-MM
  total: number;
  mode: 'zero-based' | 'flexible';
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  name: string;
  total: number;
  spent: number;
  overspent: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  color: string;
  deadline: string;
  daily_nudge: number;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  current: number;
  total: number;
  interest_rate: number;
  tenure_months: number;
  type: 'Borrowed' | 'Lent';
  deadline: string;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  user_id: string;
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
  user_id: string;
  bank: string;
  card_name: string;
  last4: string;
  network: string;
  limit: number;
  spent: number;
  due_date: string;
  min_due: number;
  color: string;
  gradient: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  amount?: number;
  icon: string;
  color: string;
  read: boolean;
  created_at: string;
}
