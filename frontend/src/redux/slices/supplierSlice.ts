import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../store';

const API_URL = "/api/suppliers";

export interface Supplier {
    _id: string;
    supplierId: string;
    businessName: string;
    contactPersonName: string;
    contactNo: string;
    email?: string;
    physicalAddress?: string;
    gstNo?: string;
    supplierType: 'manufacturer' | 'wholesaler' | 'retailer' | string;
    openingBalance?: number;
    balanceType?: 'payable' | 'receivable' | string;
    creditPeriod?: number;
    status: 'active' | 'inactive' | string;
    itemsSupplied?: string[];
    updatedAt?: string;
    [key: string]: any;
}

interface SupplierState {
    suppliers: Supplier[];
    supplier: Supplier | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const initialState: SupplierState = {
    suppliers: [],
    supplier: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get all suppliers
export const getAllSuppliers = createAsyncThunk<Supplier[], void, { state: RootState, rejectValue: string }>(
    'suppliers/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
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

// Get supplier by ID
export const getSupplierById = createAsyncThunk<Supplier, string, { state: RootState, rejectValue: string }>(
    'suppliers/getById',
    async (id, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.get(`${API_URL}/${id}`, getConfig(token));
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

// Add supplier
export const addSupplier = createAsyncThunk<Supplier, Partial<Supplier>, { state: RootState, rejectValue: string }>(
    'suppliers/add',
    async (supplierData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.post(API_URL, supplierData, getConfig(token));
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

// Update supplier
export const updateSupplier = createAsyncThunk<Supplier, { id: string, supplierData: Partial<Supplier> }, { state: RootState, rejectValue: string }>(
    'suppliers/update',
    async ({ id, supplierData }, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.put(
                `${API_URL}/${id}`,
                supplierData,
                getConfig(token)
            );
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

// Delete supplier
export const deleteSupplier = createAsyncThunk<string, string, { state: RootState, rejectValue: string }>(
    'suppliers/delete',
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

export const supplierSlice = createSlice({
    name: 'suppliers',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearSupplier: (state) => {
            state.supplier = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get all suppliers
            .addCase(getAllSuppliers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllSuppliers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers = action.payload;
            })
            .addCase(getAllSuppliers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Get supplier by ID
            .addCase(getSupplierById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSupplierById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.supplier = action.payload;
            })
            .addCase(getSupplierById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Add supplier
            .addCase(addSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(addSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers.push(action.payload);
            })
            .addCase(addSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Update supplier
            .addCase(updateSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers = state.suppliers.map((supplier) =>
                    supplier._id === action.payload._id ? action.payload : supplier
                );
                state.supplier = action.payload;
            })
            .addCase(updateSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Delete supplier
            .addCase(deleteSupplier.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSupplier.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.suppliers = state.suppliers.filter(
                    (supplier) => supplier._id !== action.payload
                );
            })
            .addCase(deleteSupplier.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearSupplier } = supplierSlice.actions;
export default supplierSlice.reducer;
