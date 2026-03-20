import { appData, delay, saveState } from '../../../services/mockState';
import { Loan } from '@repo/shared';

export const fetchLoans = async (): Promise<Loan[]> => {
    await delay(500);
    return appData.loans as Loan[];
};

export const createLoan = async (loan: Omit<Loan, 'id'>): Promise<Loan> => {
    await delay(300);
    saveState();
    const newLoan: Loan = { ...loan, id: Date.now() };
    if (!appData.loans) appData.loans = [];
    appData.loans.push(newLoan);
    return newLoan;
};

export const updateLoan = async (id: number, updates: Partial<Loan>): Promise<void> => {
    await delay(300);
    saveState();
    const loan = appData.loans?.find((l: Loan) => l.id === id);
    if (loan) Object.assign(loan, updates);
};

export const deleteLoan = async (id: number): Promise<void> => {
    await delay(300);
    saveState();
    if (appData.loans) {
        appData.loans = appData.loans.filter((l: Loan) => l.id !== id);
    }
};

export const recordLoanPayment = async (id: number, amount: number): Promise<void> => {
    await delay(300);
    saveState();
    const loan = appData.loans?.find((l: Loan) => l.id === id);
    if (loan) {
        loan.current += amount;
        if (loan.current > loan.total) loan.current = loan.total;

        // Assume paying back borrowed decreases wealth, receiving lent increases wealth
        if (loan.type === 'Borrowed') {
            appData.profile.totalWealth -= amount;
            if (appData.monthlySummaries?.[0]) {
                appData.monthlySummaries[0].expense += amount;
            }
        } else {
            appData.profile.totalWealth += amount;
            if (appData.monthlySummaries?.[0]) {
                appData.monthlySummaries[0].income += amount;
            }
        }
    }
};

export const fetchCreditCards = async (): Promise<any[]> => {
    await delay(300);
    return appData.creditCards || [];
};

export const fetchDebitCards = async (): Promise<any[]> => {
    await delay(300);
    return appData.debitCards || [];
};
