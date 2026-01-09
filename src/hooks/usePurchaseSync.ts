import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setOrders } from '../store/purchaseSlice';
import { PurchaseOrder } from '../types/purchase';

export const usePurchaseSync = (tenantId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId) return;

        const fetchPurchaseOrders = async () => {
            const { data: poData, error: poError } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId);
            if (!poError && poData) {
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
