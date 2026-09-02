import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { setOrders } from '../redux/slices/purchaseSlice';
import { PurchaseOrder } from "../types/purchase";
import { getTable } from "../services/dataSource";

export const usePurchaseSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    // react-query rather than a plain useEffect + fetch: under
    // React.StrictMode (enabled in main.tsx) a plain effect's fetch body
    // runs twice on mount, firing a genuine duplicate network request each
    // time. react-query dedupes concurrent requests sharing a queryKey
    // against its cache instead, matching the pattern useFinanceSync.ts and
    // useTenantData.ts already use elsewhere in this codebase.
    const { data: poData } = useQuery({
        queryKey: ['purchase_orders', tenantId],
        queryFn: () => getTable('purchase_orders', { filters: { tenant_id: tenantId } }),
        enabled: !!tenantId,
    });

    useEffect(() => {
        if (!poData) return;
        const mappedPO = poData.map((po: any) => ({
            id: po.id,
            po_number: po.po_number || po.id,
            vendor_name: po.vendor_name || po.vendor || 'Unknown',
            po_date: po.po_date || po.date,
            status: po.status,
            total_amount: po.total_amount || po.total || 0,
            items: po.items || [],
            created_at: po.created_at || new Date().toISOString(),
            branch_id: po.branch_id || po.branchId
        })) as PurchaseOrder[];
        dispatch(setOrders(mappedPO));
    }, [poData, dispatch]);
};
