import { api } from '@repo/shared';
import { Loan } from '@repo/shared';

export const fetchLoans = async (): Promise<Loan[]> => {
    return api.get<Loan[]>('/personal/finance/loans');
};

export const createLoan = async (loan: Omit<Loan, 'id'>): Promise<Loan> => {
    return api.post<Loan>('/personal/finance/loans', loan);
};

export const updateLoan = async (id: number | string, updates: Partial<Loan>): Promise<void> => {
    return api.put(`/personal/finance/loans/${id}`, updates);
};

export const deleteLoan = async (id: number | string): Promise<void> => {
    return api.delete(`/personal/finance/loans/${id}`);
};

export const recordLoanPayment = async (id: number | string, amount: number): Promise<void> => {
    return api.post(`/personal/finance/loans/${id}/payments`, { amount });
};

export const fetchCreditCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/finance/accounts?type=credit'); // Fallback to accounts if cards missing
};

export const fetchDebitCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/finance/accounts?type=debit');
};

