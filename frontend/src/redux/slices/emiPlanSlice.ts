import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/emi-plans";

export interface EMIInstallment {
    dueDate: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: string;
    paidAmount?: number;
}

export interface EMIPlan {
    _id: string;
    invoiceId: string | { _id: string; invoiceNumber?: string };
    customerId: string | { _id: string; name?: string; phone?: string };
    totalAmount: number;
    numberOfInstallments: number;
    installmentAmount: number;
    startDate: string;
    frequency: 'MONTHLY' | 'WEEKLY';
    installments: EMIInstallment[];
    status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
}

interface EMIPlanState {
    plans: EMIPlan[];
    isLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: EMIPlanState = {
    plans: [],
    isLoading: false,
    isError: false,
    message: '',
};

function authHeader(thunkAPI: any) {
    const token = (thunkAPI.getState() as RootState).auth.user?.token;
    return { headers: { Authorization: `Bearer ${token}` } };
}

function extractError(error: any): string {
    return (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
}

export const getEMIPlans = createAsyncThunk<EMIPlan[], void, { state: RootState }>(
    'emiPlans/getAll',
    async (_, thunkAPI) => {
        try {
            const response = await api.get(API_URL, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const createEMIPlan = createAsyncThunk<EMIPlan, Partial<EMIPlan>, { state: RootState }>(
    'emiPlans/create',
    async (data, thunkAPI) => {
        try {
            const response = await api.post(API_URL, data, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const recordInstallmentPayment = createAsyncThunk<
    EMIPlan,
    { id: string; installmentIndex: number; paidAmount?: number },
    { state: RootState }
>(
    'emiPlans/recordPayment',
    async ({ id, installmentIndex, paidAmount }, thunkAPI) => {
        try {
            const response = await api.patch(`${API_URL}/${id}/installments/pay`, { installmentIndex, paidAmount }, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const deleteEMIPlan = createAsyncThunk<string, string, { state: RootState }>(
    'emiPlans/delete',
    async (id, thunkAPI) => {
        try {
            await api.delete(`${API_URL}/${id}`, authHeader(thunkAPI));
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const emiPlanSlice = createSlice({
    name: 'emiPlans',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getEMIPlans.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getEMIPlans.fulfilled, (state, action) => {
                state.isLoading = false;
                state.plans = action.payload;
            })
            .addCase(getEMIPlans.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createEMIPlan.fulfilled, (state, action) => {
                state.plans.unshift(action.payload);
            })
            .addCase(recordInstallmentPayment.fulfilled, (state, action) => {
                const index = state.plans.findIndex(p => p._id === action.payload._id);
                if (index !== -1) state.plans[index] = action.payload;
            })
            .addCase(deleteEMIPlan.fulfilled, (state, action) => {
                state.plans = state.plans.filter(p => p._id !== action.payload);
            });
    },
});

export const { reset } = emiPlanSlice.actions;
export default emiPlanSlice.reducer;
