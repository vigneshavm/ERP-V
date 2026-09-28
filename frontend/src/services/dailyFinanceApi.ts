import api from './api';

export type DailyFinanceOperation = 'INSERT' | 'UPDATE' | 'DELETE';

const BASE = '/api/daily-finance';

/**
 * Sends one Daily Finance change to the backend (DailyFinanceController). Used for the immediate
 * save and for replaying the offline queue, so both hit the same endpoints. Resolves only when the
 * server confirms the change; otherwise throws, and the queued item stays pending.
 */
export const sendDailyFinanceChange = async (operation: DailyFinanceOperation, recordId: string, data: Record<string, unknown>): Promise<void> => {
    const { data: res } = operation === 'INSERT'
        ? await api.post(BASE, { ...data, id: recordId })
        : operation === 'UPDATE'
            ? await api.put(`${BASE}/${encodeURIComponent(recordId)}`, data)
            : await api.delete(`${BASE}/${encodeURIComponent(recordId)}`);

    if (!res?.success) {
        throw new Error(res?.message || `Server did not confirm the daily finance ${operation.toLowerCase()}`);
    }
};
