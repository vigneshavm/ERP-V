import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setOrders } from '@/entities/purchase/model/purchaseSlice';
import { PurchaseOrder } from "@repo/shared-kernel";
import { getTable } from "@/shared/api/dataSource";

export const usePurchaseSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchPurchaseOrders = async () => {
            const poData = await getTable('purchase_orders', { filters: { tenant_id: tenantId } });

            if (poData) {
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
            }
        };

        fetchPurchaseOrders();
    }, [dispatch, tenantId]);
};
