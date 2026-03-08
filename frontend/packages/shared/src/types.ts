export interface User {
  id: string;
  name: string;
  email: string;
}

export type ExpenseCategory = "Personal" | "Business" | "Travel" | "Food" | "Other";

export interface Profile {
  totalWealth: number;
  currency: string;
}

export interface SMSTransfers {
  pendingCount: number;
  lastDetected: string;
}

export interface MonthlySummary {
  month: string;
  expense: number;
  income: number;
  budget: number;
  progress: number;
  showPredictive?: boolean;
  isCurrentMonth?: boolean;
}

export interface DashboardData {
  profile: Profile;
  smsTransfers: SMSTransfers;
  monthlySummaries: MonthlySummary[];
}

export interface Category {
  id: string;
  name: string;
  value: number;
  limit: number;
  color: string;
  icon: string;
  over?: boolean;
}

export interface StatsData {
  stats: {
    barData: Array<{ name: string; expense: number; limit: number }>;
    remainingBudget: number;
  };
  categories: Category[];
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  contribution: number;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  icon: string;
  color: string;
  deadline: string;
  dailyNudge: number;
  isCollaborative?: boolean;
  participants?: Participant[];
  ownerId?: string;
}

export interface Loan {
  id: number;
  name: string;
  bank: string;
  current: number;
  total: number;
  interestRate?: number;
  tenureMonths?: number;
  type: 'Borrowed' | 'Lent';
  deadline: string;
  icon: string;
  color: string;
}

export interface BudgetItem {
  name: string;
  spent: number;
  total: number;
  icon: string;
  color: string;
  overspent: boolean;
  rollover?: number;
}

export interface Budget {
  total: number;
  mode: 'zero-based' | 'flexible';
  items: BudgetItem[];
  history?: ExpenseHistory;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  time: string;
  amount?: number;
  message: string;
  icon: string;
  color: string;
  read: boolean;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  time: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
  notes?: string;
}

export interface CalendarTransaction extends Transaction {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

export interface ExpenseHistory {
  totalSpent: number;
  month: string;
  categories: Array<{ name: string; value: number; color: string }>;
  paymentMethods: Array<{ name: string; value: number; color: string }>;
  dailyTrend: Array<{ day: string; amount: number }>;
}

export interface SMSMessage {
  id: number;
  sender: string;
  amount: number;
  date: string;
  message: string;
  type: 'Debit' | 'Credit';
}

