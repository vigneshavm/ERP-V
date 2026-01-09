import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setCustomersList, setSalesHistory } from '../store/posSlice';
import { Sale, Customer } from '../types/sales';
import { SyncManager } from '../services/SyncManager';

export const useSalesSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId) return;

        const fetchSalesData = async () => {
            // Customers
            const { data: custData, error: custError } = await supabase.from('customers').select('*').eq('tenant_id', tenantId);
            if (custError && !navigator.onLine) {
                const offlineCustomers = await SyncManager.getOfflineCustomers();
                dispatch(setCustomersList(offlineCustomers));
            } else if (!custError && custData) {
                dispatch(setCustomersList(custData as Customer[]));
                SyncManager.cacheCustomers(custData as Customer[]);
            }

            // Sales
            const { data: salesData, error: salesError } = await supabase.from('sales').select('*').eq('tenant_id', tenantId).limit(100);
            if (!salesError && salesData) {
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
            }

            if (navigator.onLine) {
                SyncManager.syncOfflineSales().catch(err => console.error('Background sync failed:', err));
            }
        };

        fetchSalesData();
    }, [dispatch, tenantId]);
};
