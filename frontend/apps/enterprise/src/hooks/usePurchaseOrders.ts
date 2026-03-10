import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import {
    getAllPurchases as fetchOrders,
    createPurchaseOrder as saveOrder,
    fetchPurchaseById as fetchOrderDetails,
    approveOrder as approveAction,
    updateOrder as updateAction,
    deleteOrder as deleteAction
} from "@/entities/purchase/model/purchaseSlice";

export const usePurchaseOrders = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, selectedOrder: currentOrder, isProcessing: isLoading } = useSelector((state: RootState) => state.purchase);

    const loadOrders = useCallback(() => {
        dispatch(fetchOrders());
    }, [dispatch]);

    const loadOrderDetails = useCallback(async (id: string) => {
        return dispatch(fetchOrderDetails(id)).unwrap();
    }, [dispatch]);

    const createOrder = useCallback(async (orderData: any, items: any[]) => {
        return dispatch(saveOrder({ ...orderData, items })).unwrap();
    }, [dispatch]);

    const updateOrderStatus = useCallback((id: string, status: any) => {
        dispatch(approveAction(id));
    }, [dispatch]);

    const removeOrder = useCallback((id: string) => {
        dispatch(deleteAction(id));
    }, [dispatch]);

    return {
        orders,
        currentOrder,
        isLoading,
        loadOrders,
        loadOrderDetails,
        createOrder,
        updateOrderStatus,
        removeOrder
    };
};
