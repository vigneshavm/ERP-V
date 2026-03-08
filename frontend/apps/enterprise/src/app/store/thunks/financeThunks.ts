import { AppDispatch, RootState } from "../store";
import { db } from '@/shared/lib/db';
import { addDailyRecord, updateDailyRecord, deleteDailyRecord, setDailyRecordSynced } from '@/entities/finance/model/financeSlice';
import api from "@/shared/api/api";

export const saveDailyFinanceRecord = (record: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    const apiData = {
        ...record,
        tenantId: user.tenantId,
        cashSales: parseFloat(record.cashSales) || 0,
        onlineSales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cashInDrawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Save to Offline Queue
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'INSERT',
            data: apiData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(addDailyRecord({ ...record, tenantId: user.tenantId, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine) {
            try {
                const { data } = await api.post('/daily-finance', apiData);
                if (data && data.success) {
                    await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'INSERT' }).modify({ synced: true });
                    dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                    console.log('Daily finance record synced immediately');
                }
            } catch (error) {
                console.error('Immediate sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance record:', err);
    }
};

export const updateDailyFinanceRecord = (record: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    const apiData = {
        ...record,
        tenantId: user.tenantId,
        cashSales: parseFloat(record.cashSales) || 0,
        onlineSales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cashInDrawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Queue Update
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'UPDATE',
            data: apiData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(updateDailyRecord({ ...record, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine) {
            try {
                // Assuming backend supports PUT /daily-finance/:id
                const { data } = await api.put(`/daily-finance/${record.id}`, apiData);
                if (data && data.success) {
                    await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'UPDATE' }).modify({ synced: true });
                    dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                    console.log('Daily finance update synced immediately');
                }
            } catch (error) {
                console.error('Immediate update sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance update:', err);
    }
};

export const deleteDailyFinanceRecord = (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    try {
        // 1. Queue Delete
        await db.dailyFinanceQueue.add({
            recordId: id,
            operation: 'DELETE',
            data: { tenant_id: user.tenantId },
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(deleteDailyRecord(id));

        // 3. Immediate Sync
        if (navigator.onLine) {
            try {
                const { data } = await api.delete(`/daily-finance/${id}`);
                if (data && data.success) {
                    await db.dailyFinanceQueue.where({ recordId: id, operation: 'DELETE' }).modify({ synced: true });
                    console.log('Daily finance deletion synced immediately');
                }
            } catch (error) {
                console.error('Immediate delete sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance deletion:', err);
    }
};
