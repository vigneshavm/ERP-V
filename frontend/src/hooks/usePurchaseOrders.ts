import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../redux/store";
import {
    addOrder as addOrderAction,
    approveOrder as approveOrderAction,
    convertOrder as convertOrderAction,
    deleteOrder as deleteOrderAction,
    updateOrder as updateOrderAction,
    setOrders
} from "../redux/slices/purchaseSlice";
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from "../types/purchase";
import api from "../services/api.js";

// Re-export types for convenience
export type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus };

export const usePurchaseOrders = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders } = useSelector((state: RootState) => state.purchase);
    const [loading, setLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchases');
            dispatch(setOrders(response.data));
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const fetchOrderDetails = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/purchases/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveOrder = useCallback(async (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => {
        try {
            setLoading(true);
            /* 
               Backend expects:
               details: { ...order fields... }
               items: [ ...items... ]
               status: ...
               p_vendor_id: order.supplier_id
            */

            // Map frontend naming to expected backend payload if necessary
            // Based on PurchaseController.ts:
            // req.body.p_vendor_id is required
            // details, items, status

            const payload = {
                p_vendor_id: order.vendor_id,
                details: {
                    invoice_no: order.po_number, // Mapping po_number to invoice_no ??
                    date: order.po_date,
                    // Map other fields as necessary, frontend seems to store them in 'order' object
                    ...order
                },
                items: items,
                status: order.status
            };

            if (order.id) {
                await api.put(`/purchases/${order.id}`, payload);
                dispatch(updateOrderAction({ id: order.id, updates: order }));
            } else {
                await api.post('/purchases', payload);
                // Ideally, we fetch orders again or add the returned order to Redux
                fetchOrders();
            }
        } catch (error) {
            console.error("Failed to save order:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [dispatch, fetchOrders]);

    const updateStatus = useCallback(async (id: string, status: string) => {
        try {
            setLoading(true);
            await api.put(`/purchases/${id}`, { status });
            dispatch(updateOrderAction({ id, updates: { status: status as PurchaseOrderStatus } }));
        } catch (error) {
            console.error("Failed to update status:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Legacy sync actions (kept for compatibility or optimistic updates if needed)
    const addOrder = useCallback((order: PurchaseOrder) => {
        dispatch(addOrderAction(order));
    }, [dispatch]);

    const approveOrder = useCallback((id: string) => {
        updateStatus(id, 'Approved');
    }, [updateStatus]);

    const updateOrder = useCallback((id: string, updates: Partial<PurchaseOrder>) => {
        dispatch(updateOrderAction({ id, updates }));
    }, [dispatch]);

    const deleteOrder = useCallback(async (id: string) => {
        try {
            await api.delete(`/purchases/${id}`);
            dispatch(deleteOrderAction(id));
        } catch (error) {
            console.error("Failed to delete order:", error);
        }
    }, [dispatch]);

    const convertOrder = useCallback((order: PurchaseOrder, items: PurchaseOrderItem[]) => {
        dispatch(convertOrderAction({ order, items }));
    }, [dispatch]);

    const stats = useMemo(() => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length,
            approved: orders.filter(o => o.status === 'Approved').length,
            converted: orders.filter(o => o.status === 'Converted').length,
            draft: orders.filter(o => o.status === 'Draft').length
        };
    }, [orders]);

    return {
        orders,
        fetchOrders,
        fetchOrderDetails,
        saveOrder,
        updateStatus,
        loading,
        addOrder,
        updateOrder,
        deleteOrder,
        approveOrder,
        convertOrder,
        stats
    };
};
