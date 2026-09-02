import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
// import { supabase } from '../lib/supabase'; // Removed
import { setCustomersList, setSalesHistory } from "../redux/slices/posSlice";
import { Sale, Customer } from "../types/sales";
import { SyncManager } from "../services/SyncManager";
import { getTable } from "../services/dataSource";

export const useSalesSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    // Customers and Sales, via react-query rather than a plain useEffect +
    // fetch: under React.StrictMode (enabled in main.tsx) a plain effect's
    // fetch body runs twice on mount, firing a genuine duplicate network
    // request each time. react-query dedupes concurrent requests sharing a
    // queryKey against its cache instead, matching the pattern
    // useFinanceSync.ts and useTenantData.ts already use elsewhere in this
    // codebase.
    const { data: custData } = useQuery({
        queryKey: ['customers', tenantId],
        queryFn: () => getTable('customers', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    const { data: salesData } = useQuery({
        queryKey: ['sales', tenantId],
        queryFn: () => getTable('sales', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    useEffect(() => {
        // getTable() always resolves to an array (empty on failure -- see
        // dataSource.ts), so this is always truthy once the query has run;
        // the original effect's offline fallback branch was equally
        // unreachable for the same reason and is left as-is here rather
        // than changed as part of this StrictMode-duplication fix.
        if (!custData) return;
        dispatch(setCustomersList(custData as Customer[]));
        SyncManager.cacheCustomers(custData as Customer[]);
    }, [custData, dispatch]);

    useEffect(() => {
        if (!salesData) return;
        const mappedSales = salesData.map((s: any) => ({
            id: s.id,
            date: s.date,
            items: s.items || [],
            total: s.total,
            customerId: s.customer_id,
            sector: s.sector,
            branchId: s.branch_id,
            taxMode: s.tax_mode,
            paymentMethod: s.payment_method,
            status: s.status || 'COMPLETED',
            paymentStatus: s.payment_status || 'PAID'
        })) as Sale[];
        dispatch(setSalesHistory(mappedSales));
    }, [salesData, dispatch]);

    // Background Sync Manager Trigger -- unrelated to the fetch queries
    // above, kept as its own effect exactly as before.
    useEffect(() => {
        if (!tenantId || !navigator.onLine) return;
        SyncManager.syncOfflineSales().catch((err: any) => console.error('Background sync failed:', err));
    }, [tenantId]);
};
