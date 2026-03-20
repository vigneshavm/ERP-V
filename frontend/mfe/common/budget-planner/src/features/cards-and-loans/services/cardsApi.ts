import { appData, delay } from '../../../services/mockState';

export const fetchCreditCards = async (): Promise<any[]> => {
    await delay(500);
    return appData.creditCards || [];
};

export const fetchDebitCards = async (): Promise<any[]> => {
    await delay(500);
    // In our mock data, debit cards are essentially bank accounts with card info
    return appData.accounts.filter((acc: any) => acc.type === 'Savings' || acc.type === 'Checking') || [];
};
