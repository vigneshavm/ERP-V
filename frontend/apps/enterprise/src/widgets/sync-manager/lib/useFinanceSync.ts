import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { setTransactions, setCheques, setDailyRecords } from '@/entities/finance/model/financeSlice';
import { FinanceTransaction, Cheque } from "@repo/shared"; // Check shared-kernel for finance types
import { SyncManager } from "./SyncManager";
import { fetchTransactionsRaw, fetchChequesRaw, fetchDailyFinanceRaw } from './financeQueries';

export const useFinanceSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    // 1. Transactions Query
    const { data: rawTx } = useQuery({
        queryKey: ['transactions', tenantId],
        queryFn: () => fetchTransactionsRaw(tenantId!),
        enabled: !!tenantId,
        refetchInterval: 30000 // Polling every 30s
    });

    // 2. Cheques Query
    const { data: rawCheques } = useQuery({
        queryKey: ['cheques', tenantId],
        queryFn: () => fetchChequesRaw(tenantId!),
        enabled: !!tenantId,
        refetchInterval: 30000
    });

    // 3. Daily Finance Query
    const { data: rawDF } = useQuery({
        queryKey: ['daily_finance', tenantId],
        queryFn: () => fetchDailyFinanceRaw(tenantId!),
        enabled: !!tenantId,
        refetchInterval: 30000
    });

    // 4. Sync to Redux (Bridge)
    useEffect(() => {
        if (!rawTx) return;
        const mappedTx = rawTx.map((t: any) => ({
            id: t.id,
            type: t.type,
            category: t.category,
            amount: t.amount,
            date: t.date,
            description: t.description,
            sector: t.sector,
            branchId: t.branch_id,
            tenantId: t.tenant_id,
            paymentMethod: t.payment_method || 'Cash'
        })) as FinanceTransaction[];
        dispatch(setTransactions(mappedTx));
    }, [rawTx, dispatch]);

    useEffect(() => {
        if (!rawCheques) return;
        const mappedCheques = rawCheques.map((c: any) => ({
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
    }, [rawCheques, dispatch]);

    useEffect(() => {
        if (!rawDF) return;
        const mappedDF = rawDF.map((df: any) => ({
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
    }, [rawDF, dispatch]);

    // 5. Background Sync Manager Trigger
    useEffect(() => {
        if (!tenantId) return;
        const syncInterval = setInterval(() => {
            if (navigator.onLine) {
                SyncManager.syncDailyFinanceEntries();
            }
        }, 60000); // Background sync every minute
        return () => clearInterval(syncInterval);
    }, [tenantId]);
};

