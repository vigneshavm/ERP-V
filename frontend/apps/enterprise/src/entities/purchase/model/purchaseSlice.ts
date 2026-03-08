import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder, PurchasePayment, GRN, GRNItem, PurchaseOrderItem } from "@repo/shared-kernel";
import api from "@/shared/api/api";
import { RootState } from '@/app/store/store';

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
            const response = await api.get('/api/purchases');
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
            const response = await api.get('/api/purchase-payments');
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
            const response = await api.get(`/api/purchases/${id}`);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const createPurchaseOrder = createAsyncThunk(
    'purchase/createOrder',
    async (orderData: Partial<PurchaseOrder>, thunkAPI) => {
        try {
            const response = await api.post('/api/purchases', orderData);
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
        },
        addGRN: (state, action: PayloadAction<GRN>) => {
            state.grns.unshift(action.payload);

            // Update associated order status and received quantities
            const order = state.orders.find((o: PurchaseOrder) => o.id === action.payload.poId);
            if (order) {
                action.payload.items.forEach((grnItem: GRNItem) => {
                    const poItem = order.items.find((pi: PurchaseOrderItem) => pi.product_id === grnItem.productId || pi.sku === grnItem.sku);
                    if (poItem) {
                        poItem.received_quantity = (poItem.received_quantity || 0) + grnItem.acceptedQty;
                    }
                });

                const totalOrdered = order.items.reduce((sum: number, i: PurchaseOrderItem) => sum + i.quantity, 0);
                const totalReceived = order.items.reduce((sum: number, i: PurchaseOrderItem) => sum + (i.received_quantity || 0), 0);

                if (totalReceived >= totalOrdered) {
                    order.status = 'Fully Received';
                } else if (totalReceived > 0) {
                    order.status = 'Partial Receipt';
                }
            }
        },
        updateGRN: (state, action: PayloadAction<{ id: string; updates: Partial<GRN> }>) => {
            const index = state.grns.findIndex((g: GRN) => g.id === action.payload.id);
            if (index !== -1) {
                state.grns[index] = { ...state.grns[index], ...action.payload.updates } as GRN;
            }
        },
        deleteGRN: (state, action: PayloadAction<string>) => {
            state.grns = state.grns.filter((g: GRN) => g.id !== action.payload);
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
            })
            .addCase(fetchPurchaseById.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(fetchPurchaseById.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.selectedOrder = action.payload;
            })
            .addCase(fetchPurchaseById.rejected, (state) => {
                state.isProcessing = false;
            })
            .addCase(createPurchaseOrder.pending, (state) => {
                state.isProcessing = true;
            })
            .addCase(createPurchaseOrder.fulfilled, (state, action) => {
                state.isProcessing = false;
                if (action.payload.success && action.payload.data) {
                    state.orders.unshift(action.payload.data);
                }
            })
            .addCase(createPurchaseOrder.rejected, (state) => {
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
