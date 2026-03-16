import { api } from '@repo/shared';
import { formatCurrency, ExpenseHistory, Transaction, Category } from '@repo/shared';

/**
 * Checks if a transaction is an anomaly based on past spending in that category.
 * Criteria: > 3x the average of last 5 transactions.
 */
export const checkAnomaly = async (categoryId: string, amount: number): Promise<{ isAnomaly: boolean; reason?: string }> => {
    return api.get(`/personal/expenses/check-anomaly?categoryId=${categoryId}&amount=${amount}`);
};

export const fetchExpenses = async (): Promise<Category[]> => {
    return api.get<Category[]>('/personal/expenses');
};

export const fetchCategories = async (): Promise<Category[]> => {
    const response = await api.get<{ categories: Category[] }>('/personal/expenses/categories');
    return response.categories;
};


export const fetchExpensesHistory = async (): Promise<ExpenseHistory> => {
    return api.get<ExpenseHistory>('/personal/expenses/history');
};

export const fetchTransactionsByCategory = async (categoryId: string): Promise<Transaction[]> => {
    return api.get<Transaction[]>(`/personal/expenses/categories/${categoryId}/transactions`);
};

export const submitExpenseTransaction = async (amount: number, categoryName: string, notes?: string): Promise<{ id: string; isAnomaly: boolean; anomalyReason?: string }> => {
    return api.post('/personal/expenses/transactions', { amount, categoryName, notes });
};

export const createCategory = async (
    name: string,
    icon: string,
    color: string,
    limit: number
): Promise<Category> => {
    return api.post<Category>('/personal/expenses/categories', { name, icon, color, limit });
};

export const updateCategory = async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'limit'>>
): Promise<void> => {
    return api.put(`/personal/expenses/categories/${id}`, updates);
};

export const deleteCategory = async (id: string): Promise<void> => {
    return api.delete(`/personal/expenses/categories/${id}`);
};

