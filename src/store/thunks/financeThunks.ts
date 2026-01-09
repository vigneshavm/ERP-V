import { AppDispatch, RootState } from '../index';
import { db } from '../../services/db';
import { addDailyRecord, updateDailyRecord, deleteDailyRecord, setDailyRecordSynced } from '../financeSlice';
import { supabase } from '../../lib/supabase';

export const saveDailyFinanceRecord = (record: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    if (!user) return;

    const supabaseData = {
        id: record.id,
        tenant_id: user.tenantId,
        date: record.date,
        cash_sales: parseFloat(record.cashSales) || 0,
        online_sales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cash_in_drawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Save to Offline Queue
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'INSERT',
            data: supabaseData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(addDailyRecord({ ...record, tenantId: user.tenantId, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').insert([supabaseData]);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'INSERT' }).modify({ synced: true });
                dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                console.log('Daily finance record synced immediately');
            } else {
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

    const supabaseData = {
        tenant_id: user.tenantId,
        date: record.date,
        cash_sales: parseFloat(record.cashSales) || 0,
        online_sales: parseFloat(record.onlineSales) || 0,
        expenses: parseFloat(record.expenses) || 0,
        cash_in_drawer: parseFloat(record.cashInDrawer) || 0,
        notes: record.notes || '',
        timestamp: record.timestamp || new Date().toISOString()
    };

    try {
        // 1. Queue Update
        await db.dailyFinanceQueue.add({
            recordId: record.id,
            operation: 'UPDATE',
            data: supabaseData,
            synced: false,
            retryCount: 0,
            timestamp: new Date().toISOString()
        });

        // 2. Optimistic Update (Redux)
        dispatch(updateDailyRecord({ ...record, synced: false }));

        // 3. Immediate Sync
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').update(supabaseData).eq('id', record.id).eq('tenant_id', user.tenantId);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: record.id, operation: 'UPDATE' }).modify({ synced: true });
                dispatch(setDailyRecordSynced({ id: record.id, synced: true }));
                console.log('Daily finance update synced immediately');
            } else {
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
        if (navigator.onLine && supabase) {
            const { error } = await supabase.from('daily_finance').delete().eq('id', id).eq('tenant_id', user.tenantId);
            if (!error) {
                await db.dailyFinanceQueue.where({ recordId: id, operation: 'DELETE' }).modify({ synced: true });
                console.log('Daily finance deletion synced immediately');
            } else {
                console.error('Immediate delete sync failed:', error);
            }
        }
    } catch (err) {
        console.error('Failed to queue daily finance deletion:', err);
    }
};
