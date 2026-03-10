import api from '@/shared/api/api';

/**
 * Raw data fetching for transactions.
 */
export const fetchTransactionsRaw = async (tenantId: string) => {
    const response = await api.get('/cashbank/transactions', {
        params: { tenantId }
    });
    return response.data;
};

/**
 * Raw data fetching for cheques.
 */
export const fetchChequesRaw = async (tenantId: string) => {
    const response = await api.get('/cashbank/cheques', {
        params: { tenantId }
    });
    return response.data;
};

/**
 * Raw data fetching for daily finance records.
 */
export const fetchDailyFinanceRaw = async (tenantId: string) => {
    const response = await api.get('/daily-finance', {
        params: { tenantId }
    });
    return response.data;
};
