import { logger } from '@/shared/lib/logger';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
// import { supabase } from '../lib/supabase'; // Removed
import { setCustomersList, setSalesHistory } from "@/entities/sales/model/posSlice";
import { Sale, Customer } from "@repo/shared";
import { SyncManager } from "./SyncManager";
import { getTable } from "@/shared/api/dataSource";

export const useSalesSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchSalesData = async () => {
            // Customers - Switches between DEMO/DB
            const custData = await getTable('customers', { filters: { tenant_id: tenantId } });

            if (custData) {
                dispatch(setCustomersList(custData as Customer[]));
                SyncManager.cacheCustomers(custData as Customer[]);
            } else if (!navigator.onLine) {
                const offlineCustomers = await SyncManager.getOfflineCustomers(tenantId);
                dispatch(setCustomersList(offlineCustomers));
            }

            // Sales - Switches between DEMO/DB
            const salesData = await getTable('sales', { filters: { tenant_id: tenantId } });

            if (salesData) {
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
                SyncManager.syncOfflineSales().catch((err: any) => logger.error('Background sync failed:', err));
            }
        };

        fetchSalesData();
    }, [dispatch, tenantId]);
};

