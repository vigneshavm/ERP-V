
import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setActiveTab } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export type PurchaseOrderStatus = 'Draft' | 'Pending' | 'Approved' | 'Converted' | 'Cancelled';

export interface PurchaseOrderItem {
    id?: string;
    product_id: string;
    product_name?: string; // Joined
    quantity: number;
    rate: number;
    tax_percent: number;
    discount_amount: number;
    line_total: number;
}

export interface PurchaseOrder {
    id: string;
    tenant_id: string;
    branch_id?: string;
    po_number: string;
    po_date: string;
    expected_delivery?: string;
    supplier_id: string;
    vendor_name?: string; // Joined
    status: PurchaseOrderStatus;
    notes?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    created_by: string;
    created_at: string;
    items?: PurchaseOrderItem[];
}

export const usePurchaseOrders = () => {
    const { user, role } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            // Join with vendors table for names
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`
                    *,
                    vendors:supplier_id (name)
                `)
                .eq('tenant_id', user.tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map(po => ({
                ...po,
                vendor_name: po.vendors?.name
            }));
            setOrders(formatted);
        } catch (err: any) {
            console.error('Error fetching POs:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    const fetchOrderDetails = async (poId: string) => {
        try {
            const { data: po, error: poError } = await supabase
                .from('purchase_orders')
                .select(`
                    *,
                    vendors:supplier_id (name)
                `)
                .eq('id', poId)
                .single();

            if (poError) throw poError;

            const { data: items, error: itemsError } = await supabase
                .from('purchase_order_items')
                .select(`
                    *,
                    products:product_id (name)
                `)
                .eq('po_id', poId);

            if (itemsError) throw itemsError;

            return {
                ...po,
                vendor_name: po.vendors?.name,
                items: items.map(i => ({ ...i, product_name: i.products?.name }))
            } as PurchaseOrder;

        } catch (error) {
            console.error('Error fetching PO details:', error);
            return null;
        }
    };

    const saveOrder = async (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => {
        try {
            if (!user?.tenantId) throw new Error('No tenant');

            // 1. Upsert Order Header
            const poData = {
                ...order,
                tenant_id: user.tenantId,
                created_by: user.id,
                // Recalculate totals just in case
                total_amount: items.reduce((sum, i) => sum + Number(i.line_total), 0)
            };

            const { data: savedPo, error: poError } = await supabase
                .from('purchase_orders')
                .upsert(poData)
                .select()
                .single();

            if (poError) throw poError;

            // 2. Handle Items (Delete all and re-insert for simplicity in this MVP)
            // If editing, delete old items
            if (order.id) {
                await supabase.from('purchase_order_items').delete().eq('po_id', order.id);
            }

            const itemsToInsert = items.map(i => ({
                po_id: savedPo.id,
                product_id: i.product_id,
                quantity: i.quantity,
                rate: i.rate,
                tax_percent: i.tax_percent,
                discount_amount: i.discount_amount,
                line_total: i.line_total
            }));

            if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }

            fetchOrders();
            return savedPo;
        } catch (error: any) {
            console.error('Error saving PO:', error);
            throw error;
        }
    };

    const updateStatus = async (id: string, status: PurchaseOrderStatus) => {
        try {
            // Validation
            if (status === 'Approved' && role === 'Staff') {
                throw new Error('Unauthorized: Staff cannot approve POs');
            }

            const { error } = await supabase
                .from('purchase_orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            const { error } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('id', id)
                .eq('status', 'Draft'); // Only Drafts

            if (error) throw error;
            fetchOrders();
        } catch (error) {
            console.error('Error deleting PO:', error);
            throw error;
        }
    };

    return {
        orders,
        loading,
        fetchOrders,
        fetchOrderDetails,
        saveOrder,
        updateStatus,
        deleteOrder
    };
};
