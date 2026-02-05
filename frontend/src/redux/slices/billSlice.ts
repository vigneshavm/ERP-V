```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';
import { Supplier } from './supplierSlice';
import { PurchaseBill, BillStatus, TaxBreakdown } from '../../types/purchase';

const API_URL = "/api/bills";

export interface Bill extends PurchaseBill {
    // Extending PurchaseBill for full compatibility
    // Legacy mapping if needed
    date: string;
    amount: number;
    status: BillStatus;
}

interface BillState {
    bills: Bill[];
    bill: Bill | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: BillState = {
    bills: [],
    bill: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${ token } `,
    },
});

// Get all bills
export const getAllBills = createAsyncThunk<Bill[], void, { state: RootState, rejectValue: string }>(
    'bill/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Not authorized');
            const response = await api.get(API_URL, getConfig(token));
            return response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create bill
export const createBill = createAsyncThunk<Bill, any, { state: RootState, rejectValue: string }>(
    'bill/create',
    async (billData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Not authorized');
            const response = await api.post(API_URL, billData, getConfig(token));
            return response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get bill by ID
export const getBillById = createAsyncThunk<Bill, string, { state: RootState, rejectValue: string }>(
    'bill/getById',
    async (id, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Not authorized');
            const response = await api.get(`${ API_URL }/${id}`, getConfig(token));
return response.data;
        } catch (error: any) {
    const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
    return thunkAPI.rejectWithValue(message);
}
    }
);

// Update bill
export const updateBill = createAsyncThunk<Bill, { id: string, billData: any }, { state: RootState, rejectValue: string }>(
    'bill/update',
    async ({ id, billData }, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Not authorized');
            const response = await api.put(`${API_URL}/${id}`, billData, getConfig(token));
            return response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete bill
export const deleteBill = createAsyncThunk<string, string, { state: RootState, rejectValue: string }>(
    'bill/delete',
    async (id, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Not authorized');
            await api.delete(`${API_URL}/${id}`, getConfig(token));
            return id;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const billSlice = createSlice({
    name: 'bill',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearBill: (state) => {
            state.bill = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get all bills
            .addCase(getAllBills.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllBills.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bills = action.payload;
            })
            .addCase(getAllBills.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Create bill
            .addCase(createBill.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createBill.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bills.unshift(action.payload);
            })
            .addCase(createBill.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Get bill by ID
            .addCase(getBillById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBillById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bill = action.payload;
            })
            .addCase(getBillById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Update bill
            .addCase(updateBill.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateBill.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.bills.findIndex(bill => bill._id === action.payload._id);
                if (index !== -1) {
                    state.bills[index] = action.payload;
                }
            })
            .addCase(updateBill.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Delete bill
            .addCase(deleteBill.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteBill.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bills = state.bills.filter((bill) => bill._id !== action.payload);
            })
            .addCase(deleteBill.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearBill } = billSlice.actions;
export default billSlice.reducer;
