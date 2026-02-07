import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface PaymentAllocation {
    billId: string;
    amount: number;
    discount?: number;
}

export interface PaymentOut {
    _id?: string;
    paymentNo?: string;
    supplierId: string | any;
    paymentDate: string;
    amount: number;
    paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
    referenceNo?: string;
    bankAccountId?: string;
    chequeDate?: string;
    status?: 'pending' | 'cleared' | 'bounced' | 'cancelled';
    allocations: PaymentAllocation[];
    notes?: string;
    createdAt?: string;
}

interface PaymentOutState {
    payments: PaymentOut[];
    loading: boolean;
    error: string | null;
}

const initialState: PaymentOutState = {
    payments: [],
    loading: false,
    error: null,
};

export const createPayment = createAsyncThunk(
    'paymentOut/create',
    async (paymentData: PaymentOut, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/purchase-payments', paymentData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
        }
    }
);

export const getPayments = createAsyncThunk(
    'paymentOut/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/purchase-payments');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
        }
    }
);

export const updatePaymentStatus = createAsyncThunk(
    'paymentOut/updateStatus',
    async ({ id, status, bounceReason }: { id: string, status: string, bounceReason?: string }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/purchase-payments/${id}/status`, { status, bounceReason });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

const paymentOutSlice = createSlice({
    name: 'paymentOut',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getPayments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = action.payload;
            })
            .addCase(getPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.payments.unshift(action.payload);
            })
            .addCase(updatePaymentStatus.fulfilled, (state, action) => {
                const index = state.payments.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.payments[index] = action.payload;
                }
            });
    },
});

export default paymentOutSlice.reducer;
