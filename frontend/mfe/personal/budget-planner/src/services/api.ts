import { appData, undoStack, redoStack, delay, setAppData } from './mockState';
export type { Goal, Notification, Category, Transaction, Participant, CalendarTransaction } from '@repo/shared';

export const undo = async (): Promise<void> => {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(appData));
    setAppData(JSON.parse(undoStack.pop()!));
    await delay(100);
};

export const redo = async (): Promise<void> => {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(appData));
    setAppData(JSON.parse(redoStack.pop()!));
    await delay(100);
};

/**
 * ⚠️ LEGACY API SERVICE
 * Most functions have been moved to feature-specific API services:
 * - Dashboard: features/dashboard/services/dashboardApi.ts
 * - Transactions: features/transactions/services/transactionsApi.ts
 * - Expenses: features/expenses/services/expensesApi.ts
 * - Goals: features/goals/services/goalsApi.ts
 * - Loans: features/cards-and-loans/services/loansApi.ts
 * - Cards: features/cards-and-loans/services/cardsApi.ts
 * - Budgets: features/budgets/services/budgetsApi.ts
 * - Reports: features/reports/services/reportsApi.ts
 * - Notifications: features/predictions-and-alerts/services/notificationsApi.ts
 */
