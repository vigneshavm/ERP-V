import { z } from "zod";
import * as schemas from "./schemas";

export type User = z.infer<typeof schemas.UserSchema>;
export type ExpenseCategory = z.infer<typeof schemas.ExpenseCategorySchema>;
export type Profile = z.infer<typeof schemas.ProfileSchema>;
export type MonthlySummary = z.infer<typeof schemas.MonthlySummarySchema>;
export type Category = z.infer<typeof schemas.CategorySchema>;
export type Participant = z.infer<typeof schemas.ParticipantSchema>;
export type Goal = z.infer<typeof schemas.GoalSchema>;
export type Loan = z.infer<typeof schemas.LoanSchema>;
export type PersonalTransaction = z.infer<typeof schemas.TransactionSchema>;
export type Budget = z.infer<typeof schemas.BudgetSchema>;

export interface DashboardData {
  profile: Profile;
  smsTransfers: SMSTransfers;
  monthlySummaries: MonthlySummary[];
}

export interface SMSTransfers {
  pendingCount: number;
  lastDetected: string;
}

export interface CalendarTransaction extends PersonalTransaction {
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

export interface StatsData {
  stats: {
    barData: Array<{ name: string; expense: number; limit: number }>;
    remainingBudget: number;
  };
  categories: Category[];
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
