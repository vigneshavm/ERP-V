import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder } from "../../types/purchase";
import api from "../../services/api";
import { RootState } from '../store';
import { normalizePurchaseOrder, normalizePurchaseOrders } from "../../utils/purchaseNormalize";

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const loadState = <T>(key: string, initialState: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialState;
};

const initialPurchaseState: PurchaseState = {
    orders: [],
    payments: [],
    grns: [],
    bills: [],
    pendingInvoice: null,
    isProcessing: false,
    selectedOrder: null,
};

// Async Thunks
export const fetchPurchaseOrders = createAsyncThunk(
    'purchase/fetchOrders',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get('/api/purchases', getConfig(token));
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchPurchasePayments = createAsyncThunk(
    'purchase/fetchPayments',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get('/api/purchase-payments', getConfig(token));
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchPurchaseById = createAsyncThunk(
    'purchase/fetchById',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`/api/purchases/${id}`, getConfig(token));
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const purchaseSlice = createSlice({
    name: 'purchase',
    initialState: loadState('purchase', initialPurchaseState),
    reducers: {
        addOrder: (state, action: PayloadAction<PurchaseOrder>) => {
            state.orders.unshift(action.payload);
        },
        approveOrder: (state, action: PayloadAction<string>) => {
            const order = state.orders.find((o: PurchaseOrder) => o.id === action.payload);
            if (order) order.status = 'APPROVED';
        },
        updateOrder: (state, action: PayloadAction<{ id: string; updates: Partial<PurchaseOrder> }>) => {
            const index = state.orders.findIndex((o: PurchaseOrder) => o.id === action.payload.id);
            if (index !== -1) {
                state.orders[index] = { ...state.orders[index], ...action.payload.updates };
            }
        },
        deleteOrder: (state, action: PayloadAction<string>) => {
            state.orders = state.orders.filter((o: PurchaseOrder) => o.id !== action.payload);
        },
        convertOrder: (state, action: PayloadAction<{ order: PurchaseOrder; items: any[] }>) => {
            const order = state.orders.find((o: PurchaseOrder) => o.id === action.payload.order.id);
            if (order) order.status = 'COMPLETED';
        },
        setOrders: (state, action: PayloadAction<PurchaseOrder[]>) => {
            state.orders = action.payload;
        },
        addGRN: (state, action: PayloadAction<any>) => {
            state.grns.unshift(action.payload);

            // Update associated order status and received quantities
            const order = state.orders.find(o => o.id === action.payload.poId);
            if (order) {
                // Logic to update order based on GRN acceptance
                // This would normally be handled by the backend, but we'll simulate it
                action.payload.items.forEach((grnItem: any) => {
                    const poItem = order.items.find(pi => pi.product_id === grnItem.productId || pi.sku === grnItem.sku);
                    if (poItem) {
                        poItem.received_quantity = (poItem.received_quantity || 0) + grnItem.acceptedQty;
                    }
                });

                const totalOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const totalReceived = order.items.reduce((sum, i) => sum + (i.received_quantity || 0), 0);

                if (totalReceived >= totalOrdered) {
                    order.status = 'COMPLETED';
                } else if (totalReceived > 0) {
                    order.status = 'PARTIALLY_RECEIVED';
                }
            }
        },
        updateGRN: (state, action: PayloadAction<{ id: string; updates: Partial<any> }>) => {
            const index = state.grns.findIndex(g => g.id === action.payload.id);
            if (index !== -1) {
                state.grns[index] = { ...state.grns[index], ...action.payload.updates };
            }
        },
        deleteGRN: (state, action: PayloadAction<string>) => {
            state.grns = state.grns.filter(g => g.id !== action.payload);
        },
        resetSelectedOrder: (state) => {
            state.selectedOrder = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPurchaseOrders.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.orders = normalizePurchaseOrders(action.payload);
            })
            .addCase(fetchPurchaseOrders.rejected, (state) => {
                state.isProcessing = false;
            })
            .addCase(fetchPurchasePayments.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(fetchPurchasePayments.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.payments = action.payload;
            })
            .addCase(fetchPurchasePayments.rejected, (state) => {
                state.isProcessing = false;
            })
            .addCase(fetchPurchaseById.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(fetchPurchaseById.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.selectedOrder = normalizePurchaseOrder(action.payload);
            })
            .addCase(fetchPurchaseById.rejected, (state) => {
                state.isProcessing = false;
            });
    },
});

export const {
    addOrder,
    approveOrder,
    updateOrder,
    deleteOrder,
    convertOrder,
    setOrders,
    addGRN,
    updateGRN,
    deleteGRN,
    resetSelectedOrder
} = purchaseSlice.actions;
export { fetchPurchaseOrders as getAllPurchases };
export default purchaseSlice.reducer;
