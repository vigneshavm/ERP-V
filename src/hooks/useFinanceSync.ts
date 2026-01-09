import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setTransactions, setCheques, setDailyRecords } from '../store/financeSlice';
import { Transaction, Cheque } from '../types/finance';
import { SyncManager } from '../services/SyncManager';

export const useFinanceSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId) return;

        const fetchFinanceData = async () => {
            // Transactions
            const { data: txData, error: txError } = await supabase.from('transactions').select('*').eq('tenant_id', tenantId);
            if (!txError && txData) {
                const mappedTx = txData.map((t: any) => ({
                    id: t.id,
                    type: t.type,
                    category: t.category,
                    amount: t.amount,
                    date: t.date,
                    description: t.description,
                    sector: t.sector,
                    branchId: t.branch_id,
                    tenantId: t.tenant_id
                })) as Transaction[];
                dispatch(setTransactions(mappedTx));
            }

            // Cheques
            const { data: chequeData, error: chequeError } = await supabase.from('cheques').select('*').eq('tenant_id', tenantId);
            if (!chequeError && chequeData) {
                const mappedCheques = chequeData.map((c: any) => ({
                    id: c.id,
                    number: c.number,
                    bankName: c.bank_name,
                    payee: c.payee,
                    amount: c.amount,
                    date: c.date,
                    status: c.status,
                    type: c.type,
                    sector: c.sector,
                    tenantId: c.tenant_id
                })) as Cheque[];
                dispatch(setCheques(mappedCheques));
            }

            // Daily Finance
            const { data: dfData, error: dfError } = await supabase.from('daily_finance').select('*').eq('tenant_id', tenantId);
            if (!dfError && dfData) {
                const mappedDF = dfData.map((df: any) => ({
                    id: df.id,
                    date: df.date,
                    cashSales: df.cash_sales,
                    onlineSales: df.online_sales,
                    totalSales: df.total_sales,
                    expenses: df.expenses,
                    cashInDrawer: df.cash_in_drawer,
                    notes: df.notes,
                    timestamp: df.timestamp,
                    tenantId: df.tenant_id
                }));
                dispatch(setDailyRecords(mappedDF));
            }
        };

        fetchFinanceData();

        const syncInterval = setInterval(() => {
            if (navigator.onLine) {
                SyncManager.syncDailyFinanceEntries();
            }
        }, 30000);

        return () => clearInterval(syncInterval);
    }, [dispatch, tenantId]);
};
