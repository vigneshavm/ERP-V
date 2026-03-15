import { api } from '@repo/shared';

export const fetchCreditCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/cards/credit');
};

export const fetchDebitCards = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/cards/debit');
};

