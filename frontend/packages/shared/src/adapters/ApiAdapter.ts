import { IDataAdapter } from './IDataAdapter';
import api from '../services/apiClient';
import { 
    PersonalUser, 
    PersonalTransaction, 
    PersonalCategory, 
    PersonalBankAccount, 
    PersonalGoal, 
    PersonalLoan, 
    PersonalBudget, 
    SmsRule, 
    SmsTransaction,
    AnalyticsSummary,
    YearlyOverview,
    JournalEntry,
    StockReport,
    DashboardStats,
    SupplierAnalytics
} from './types';

/**
 * ApiAdapter implements IDataAdapter by making real network requests.
 * This ensures the frontend is decoupled from the data source and 
 * relies on the Backend/API to provide either live or mock data.
 */
class ApiAdapterImpl implements IDataAdapter {
    // User & Settings
    async getUser(): Promise<PersonalUser> {
        return api.get<PersonalUser>('/v1/auth/me');
    }

    async updateUserSettings(settings: Partial<PersonalUser>): Promise<PersonalUser> {
        return api.put<PersonalUser>('/v1/settings', settings);
    }

    async getContacts(): Promise<any[]> {
        return api.get<any[]>('/v1/transactions/contacts');
    }

    // Transactions
    async getTransactions(limit?: number): Promise<PersonalTransaction[]> {
        return api.get<PersonalTransaction[]>(`/v1/transactions${limit ? `?limit=${limit}` : ''}`);
    }

    async getTransactionById(id: string): Promise<PersonalTransaction | null> {
        return api.get<PersonalTransaction>(`/v1/transactions/${id}`);
    }

    async createTransaction(transaction: Omit<PersonalTransaction, 'id' | 'createdAt'>): Promise<PersonalTransaction> {
        return api.post<PersonalTransaction>('/v1/transactions', transaction);
    }

    async updateTransaction(id: string, updates: Partial<PersonalTransaction>): Promise<PersonalTransaction> {
        return api.put<PersonalTransaction>(`/v1/transactions/${id}`, updates);
    }

    async deleteTransaction(id: string): Promise<boolean> {
        await api.delete(`/v1/transactions/${id}`);
        return true;
    }

    // Categories
    async getCategories(): Promise<PersonalCategory[]> {
        return api.get<PersonalCategory[]>('/v1/categories');
    }

    async createCategory(category: Omit<PersonalCategory, 'id'>): Promise<PersonalCategory> {
        return api.post<PersonalCategory>('/v1/categories', category);
    }

    // Bank Accounts
    async getBankAccounts(): Promise<PersonalBankAccount[]> {
        return api.get<PersonalBankAccount[]>('/v1/accounts');
    }

    // Goals
    async getGoals(): Promise<PersonalGoal[]> {
        return api.get<PersonalGoal[]>('/v1/goals');
    }

    async createGoal(goal: Omit<PersonalGoal, 'id' | 'status'>): Promise<PersonalGoal> {
        return api.post<PersonalGoal>('/v1/goals', goal);
    }

    async updateGoalProgress(id: string, currentAmount: number): Promise<PersonalGoal> {
        return api.put<PersonalGoal>(`/v1/goals/${id}/progress`, { currentAmount });
    }

    // Loans
    async getLoans(): Promise<PersonalLoan[]> {
        return api.get<PersonalLoan[]>('/v1/loans');
    }

    async getLoanDetails(id: string): Promise<PersonalLoan | null> {
        return api.get<PersonalLoan>(`/v1/loans/${id}`);
    }

    async createLoan(loan: Omit<PersonalLoan, 'id' | 'status'>): Promise<PersonalLoan> {
        return api.post<PersonalLoan>('/v1/loans', loan);
    }

    async recordLoanPayment(id: string, amount: number): Promise<PersonalLoan> {
        return api.post<PersonalLoan>(`/v1/loans/${id}/payment`, { amount });
    }

    async deleteLoan(id: string): Promise<boolean> {
        await api.delete(`/v1/loans/${id}`);
        return true;
    }

    // Budget
    async getBudget(): Promise<PersonalBudget> {
        return api.get<PersonalBudget>('/v1/budget');
    }

    async updateBudgetMode(mode: 'zero-based' | 'flexible'): Promise<PersonalBudget> {
        return api.put<PersonalBudget>('/v1/budget/mode', { mode });
    }

    async updateCategoryBudget(categoryId: string, allotted: number): Promise<PersonalBudget> {
        return api.put<PersonalBudget>(`/v1/budget/categories/${categoryId}`, { allotted });
    }

    // SMS Rules & Transactions
    async getSmsRules(): Promise<SmsRule[]> {
        // Fallback or move to settings if implemented
        return api.get<SmsRule[]>('/v1/settings/sms-rules').catch(() => []);
    }

    async getPendingSmsTransactions(): Promise<SmsTransaction[]> {
        return api.get<SmsTransaction[]>('/v1/transactions/sms/pending');
    }

    async convertSmsToTransaction(smsId: string, categoryId: string): Promise<PersonalTransaction> {
        return api.post<PersonalTransaction>(`/v1/transactions/sms/${smsId}/convert`, { categoryId });
    }

    // Analytics
    async getAnalyticsSummary(period: 'month' | 'year'): Promise<AnalyticsSummary> {
        return api.get<AnalyticsSummary>(`/v1/personal/reports/analytics?period=${period}`);
    }

    async getYearlyOverview(year: number): Promise<YearlyOverview> {
        return api.get<YearlyOverview>(`/v1/personal/reports/yearly/${year}`);
    }

    // ERP & Enterprise Methods
    async getJournalEntries(): Promise<JournalEntry[]> {
        return api.get<JournalEntry[]>('/v1/finance/journal-entries');
    }

    async getStockReport(): Promise<StockReport> {
        return api.get<StockReport>('/v1/inventory/stock-reports');
    }

    async getDashboardStats(): Promise<DashboardStats> {
        return api.get<DashboardStats>('/v1/enterprise/dashboard/stats');
    }

    async getSuppliers(): Promise<SupplierAnalytics[]> {
        return api.get<SupplierAnalytics[]>('/v1/crm/suppliers/analytics');
    }
}

export const ApiAdapter = new ApiAdapterImpl();
