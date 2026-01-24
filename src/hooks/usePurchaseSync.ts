import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setOrders } from '../store/purchaseSlice';
import { PurchaseOrder } from '../types/purchase';
import { getTable } from '../services/dataSource';

export const usePurchaseSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId) return;

        const fetchPurchaseOrders = async () => {
            const poData = await getTable('purchase_orders', { filters: { tenant_id: tenantId } });

            if (poData) {
                const mappedPO = poData.map((po: any) => ({
                    id: po.id,
                    vendor: po.vendor,
                    date: po.date,
                    status: po.status,
                    total: po.total,
                    items: po.items || [],
                    sector: po.sector,
                    branchId: po.branch_id,
                    tenantId: po.tenant_id
                })) as PurchaseOrder[];
                dispatch(setOrders(mappedPO));
            }
        };

        fetchPurchaseOrders();
    }, [dispatch, tenantId]);
};
