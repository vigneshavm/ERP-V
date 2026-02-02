import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder, PurchasePayment } from "../../types/purchase";
import api from "../../services/api";
import { RootState } from '../store';

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
    pendingInvoice: null,
    isProcessing: false,
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

const purchaseSlice = createSlice({
    name: 'purchase',
    initialState: loadState('purchase', initialPurchaseState),
    reducers: {
        addOrder: (state, action: PayloadAction<PurchaseOrder>) => {
            state.orders.unshift(action.payload);
        },
        approveOrder: (state, action: PayloadAction<string>) => {
            const order = state.orders.find((o: PurchaseOrder) => o.id === action.payload);
            if (order) order.status = 'Approved';
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
            if (order) order.status = 'Converted';
        },
        setOrders: (state, action: PayloadAction<PurchaseOrder[]>) => {
            state.orders = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPurchaseOrders.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.orders = action.payload;
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
            });
    },
});

export const { addOrder, approveOrder, updateOrder, deleteOrder, convertOrder, setOrders } = purchaseSlice.actions;
export { fetchPurchaseOrders as getAllPurchases };
export default purchaseSlice.reducer;
