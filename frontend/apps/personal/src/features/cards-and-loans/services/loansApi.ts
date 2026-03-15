import { api } from '@repo/shared';
import { Loan } from '@repo/shared';

export const fetchLoans = async (): Promise<Loan[]> => {
    return api.get<Loan[]>('/personal/loans');
};

export const createLoan = async (loan: Omit<Loan, 'id'>): Promise<Loan> => {
    return api.post<Loan>('/personal/loans', loan);
};

export const updateLoan = async (id: number | string, updates: Partial<Loan>): Promise<void> => {
    return api.put(`/personal/loans/${id}`, updates);
};

export const deleteLoan = async (id: number | string): Promise<void> => {
    return api.delete(`/personal/loans/${id}`);
};

export const recordLoanPayment = async (id: number | string, amount: number): Promise<void> => {
    return api.post(`/personal/loans/${id}/payments`, { amount });
};

export const fetchCreditCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/cards/credit');
};

export const fetchDebitCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/cards/debit');
};

