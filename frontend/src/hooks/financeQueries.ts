import { getTable } from "../services/dataSource";

export const fetchTransactionsRaw = async (tenantId: string) => {
    return await getTable('transactions', { filters: { tenant_id: tenantId } });
};

export const fetchChequesRaw = async (tenantId: string) => {
    return await getTable('cheques', { filters: { tenant_id: tenantId } });
};

export const fetchDailyFinanceRaw = async (tenantId: string) => {
    return await getTable('daily_finance', { filters: { tenant_id: tenantId } });
};
