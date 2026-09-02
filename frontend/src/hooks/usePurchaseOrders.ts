import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../redux/store";
import {
    addOrder as addOrderAction,
    convertOrder as convertOrderAction,
    deleteOrder as deleteOrderAction,
    updateOrder as updateOrderAction,
    setOrders
} from "../redux/slices/purchaseSlice";
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from "../types/purchase";
import api from "../services/api.js";
import { normalizePurchaseOrder, normalizePurchaseOrders } from "../utils/purchaseNormalize";

// Re-export types for convenience
export type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus };

// Status values that PATCH /api/purchases/:id/status (PurchaseController.updatePOStatus) will
// accept - it saves the Mongoose document, so validators run and anything outside the real
// Purchase.status enum is rejected. 'Billed'/'Paid' are local-only labels (see types/purchase.ts)
// and must keep going through the legacy unvalidated PUT below.
const LIFECYCLE_STATUSES = new Set([
    'DRAFT', 'SUBMITTED', 'APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'RECEIVED'
]);

export const usePurchaseOrders = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders } = useSelector((state: RootState) => state.purchase);
    const [loading, setLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/purchases');
            dispatch(setOrders(normalizePurchaseOrders(response.data)));
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const fetchOrderDetails = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/purchases/${id}`);
            return normalizePurchaseOrder(response.data);
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
                await api.put(`/api/purchases/${order.id}`, payload);
                dispatch(updateOrderAction({ id: order.id, updates: order }));
            } else {
                await api.post('/api/purchases', payload);
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

    // Legacy, unvalidated status update. Still used for the local-only 'Billed'/'Paid' labels
    // that don't exist on the backend Purchase.status enum. Anything that IS a real lifecycle
    // status should go through updatePOLifecycleStatus below instead, which hits the dedicated,
    // validated PATCH /api/purchases/:id/status route.
    const updateStatus = useCallback(async (id: string, status: string) => {
        try {
            setLoading(true);
            await api.put(`/api/purchases/${id}`, { status });
            dispatch(updateOrderAction({ id, updates: { status: status as PurchaseOrderStatus } }));
        } catch (error) {
            console.error("Failed to update status:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Real lifecycle transitions: DRAFT -> SUBMITTED -> APPROVED -> SENT_TO_VENDOR (and reject
    // back to DRAFT). Hits PurchaseController.updatePOStatus, which also stamps
    // approvedBy/approvedAt/sentToVendorAt server-side.
    const updatePOLifecycleStatus = useCallback(async (id: string, status: PurchaseOrderStatus) => {
        if (!LIFECYCLE_STATUSES.has(status)) {
            // Guard against accidentally routing a local-only status (Billed/Paid) through the
            // validated endpoint, where it would be rejected by the Mongoose enum.
            return updateStatus(id, status);
        }
        try {
            setLoading(true);
            const response = await api.patch(`/api/purchases/${id}/status`, { status });
            const purchase = response.data?.purchase;
            dispatch(updateOrderAction({
                id,
                updates: {
                    status,
                    ...(purchase ? {
                        approvedBy: purchase.approvedBy,
                        approvedAt: purchase.approvedAt,
                        sentToVendorAt: purchase.sentToVendorAt,
                    } : {})
                }
            }));
            return response.data;
        } catch (error) {
            console.error("Failed to update PO lifecycle status:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [dispatch, updateStatus]);

    // Legacy sync actions (kept for compatibility or optimistic updates if needed)
    const addOrder = useCallback((order: PurchaseOrder) => {
        dispatch(addOrderAction(order));
    }, [dispatch]);

    const submitOrder = useCallback((id: string) => updatePOLifecycleStatus(id, 'SUBMITTED'), [updatePOLifecycleStatus]);
    const approveOrder = useCallback((id: string) => updatePOLifecycleStatus(id, 'APPROVED'), [updatePOLifecycleStatus]);
    const rejectOrder = useCallback((id: string) => updatePOLifecycleStatus(id, 'DRAFT'), [updatePOLifecycleStatus]);
    const sendToVendor = useCallback((id: string) => updatePOLifecycleStatus(id, 'SENT_TO_VENDOR'), [updatePOLifecycleStatus]);

    const updateOrder = useCallback((id: string, updates: Partial<PurchaseOrder>) => {
        dispatch(updateOrderAction({ id, updates }));
    }, [dispatch]);

    const deleteOrder = useCallback(async (id: string) => {
        try {
            await api.delete(`/api/purchases/${id}`);
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
            pending: orders.filter(o => o.status === 'SUBMITTED').length,
            approved: orders.filter(o => o.status === 'APPROVED').length,
            converted: orders.filter(o => o.status === 'COMPLETED').length,
            draft: orders.filter(o => o.status === 'DRAFT').length
        };
    }, [orders]);

    return {
        orders,
        fetchOrders,
        fetchOrderDetails,
        saveOrder,
        updateStatus,
        updatePOLifecycleStatus,
        submitOrder,
        approveOrder,
        rejectOrder,
        sendToVendor,
        loading,
        addOrder,
        updateOrder,
        deleteOrder,
        convertOrder,
        stats
    };
};
