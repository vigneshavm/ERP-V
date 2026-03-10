import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { RootState } from '@/app/store/store';

const API_URL = "/api/purchases/supplier-groups";

export interface SupplierGroup {
    _id: string;
    name: string;
    description: string;
    color: string;
    paymentTerms: number;
    creditLimit: number;
    discountPercent: number;
    icon: string;
    nature?: string;
    region?: string;
    financialCategory?: string;
    priority?: string;
    taxType?: string;
    memberCount?: number; // Computed on frontend for now
}

interface SupplierGroupState {
    groups: SupplierGroup[];
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const initialState: SupplierGroupState = {
    groups: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get all groups
export const getSupplierGroups = createAsyncThunk<SupplierGroup[], void, { state: RootState, rejectValue: string }>(
    'supplierGroups/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.get(API_URL, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create group
export const createSupplierGroup = createAsyncThunk<SupplierGroup, Partial<SupplierGroup>, { state: RootState, rejectValue: string }>(
    'supplierGroups/create',
    async (groupData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.post(API_URL, groupData, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update group
export const updateSupplierGroup = createAsyncThunk<SupplierGroup, { id: string, data: Partial<SupplierGroup> }, { state: RootState, rejectValue: string }>(
    'supplierGroups/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.put(`${API_URL}/${id}`, data, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete group
export const deleteSupplierGroup = createAsyncThunk<string, string, { state: RootState, rejectValue: string }>(
    'supplierGroups/delete',
    async (id, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
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

export const supplierGroupSlice = createSlice({
    name: 'supplierGroups',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSupplierGroups.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSupplierGroups.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.groups = action.payload;
            })
            .addCase(getSupplierGroups.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createSupplierGroup.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSupplierGroup.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.groups.push(action.payload);
            })
            .addCase(createSupplierGroup.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateSupplierGroup.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.groups.findIndex(g => g._id === action.payload._id);
                if (index !== -1) {
                    state.groups[index] = action.payload;
                }
            })
            .addCase(deleteSupplierGroup.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.groups = state.groups.filter(g => g._id !== action.payload);
            });
    },
});

export const { reset } = supplierGroupSlice.actions;
export default supplierGroupSlice.reducer;
