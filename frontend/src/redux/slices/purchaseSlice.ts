import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder } from '../../types/purchase';

const loadState = (key: string, initialState: any) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialState;
};

const initialPurchaseState: PurchaseState = {
    orders: [],
    pendingInvoice: null,
    isProcessing: false,
};

const purchaseSlice = createSlice({
    name: 'purchase',
    initialState: loadState('purchase', initialPurchaseState),
    reducers: {
        addOrder: (state, action: PayloadAction<PurchaseOrder>) => {
            state.orders.unshift(action.payload);
        },
        approveOrder: (state, action: PayloadAction<string>) => {
            const order = state.orders.find(o => o.id === action.payload);
            if (order) order.status = 'Approved';
        },
        updateOrder: (state, action: PayloadAction<{ id: string; updates: Partial<PurchaseOrder> }>) => {
            const index = state.orders.findIndex(o => o.id === action.payload.id);
            if (index !== -1) {
                state.orders[index] = { ...state.orders[index], ...action.payload.updates };
            }
        },
        deleteOrder: (state, action: PayloadAction<string>) => {
            state.orders = state.orders.filter(o => o.id !== action.payload);
        },
        convertOrder: (state, action: PayloadAction<{ order: PurchaseOrder; items: any[] }>) => {
            const order = state.orders.find(o => o.id === action.payload.order.id);
            if (order) order.status = 'Converted';
        },
        setOrders: (state, action: PayloadAction<PurchaseOrder[]>) => {
            state.orders = action.payload;
        }
    },
});

export const { addOrder, approveOrder, updateOrder, deleteOrder, convertOrder, setOrders } = purchaseSlice.actions;
export default purchaseSlice.reducer;
