import { api } from '@repo/shared';
import { Transaction, Category, CalendarTransaction } from '@repo/shared';

export const fetchAllTransactions = async (): Promise<CalendarTransaction[]> => {
    return api.get<CalendarTransaction[]>('/personal/expenses/transactions');
};

export const bulkUpdateTransactions = async (ids: string[], targetCategoryId: string): Promise<void> => {
    return api.post('/personal/expenses/transactions/bulk-update', { ids, targetCategoryId });
};

export const bulkDeleteTransactions = async (ids: string[]): Promise<void> => {
    return api.post('/personal/expenses/transactions/bulk-delete', { ids });
};

export const fetchAccounts = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/finance/accounts');
};

export const createAccount = async (account: {
    name: string;
    type: string;
    balance: number;
    color: string;
}): Promise<any> => {
    return api.post('/personal/finance/accounts', account);
};

export const disputeTransaction = async (transactionId: string): Promise<void> => {
    return api.post(`/personal/expenses/transactions/${transactionId}/dispute`);
};

export const fetchContacts = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/expenses/contacts');
};

