import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/masters";

// Backs every "simple master" list-type in one slice (customer groups, employee structure,
// transaction/cash/payment/booking groups, GST type/group, textile product descriptors) --
// mirrors the backend's single generic MasterEntry collection rather than one slice per type.
export type MasterType =
    | 'CUSTOMER_GROUP'
    | 'CUSTOMER_RELATIONSHIP_TYPE'
    | 'EMPLOYEE_CATEGORY'
    | 'EMPLOYEE_GROUP'
    | 'EMPLOYEE_SECTION'
    | 'TRANSACTION_GROUP'
    | 'TRANSACTION_NAME'
    | 'CASH_GROUP'
    | 'CASH_NAME'
    | 'PAYMENT_TYPE'
    | 'BOOKING_GROUP'
    | 'EXPENSE_GROUP'
    | 'GST_TYPE'
    | 'GST_GROUP'
    | 'PRODUCT_DESIGN'
    | 'PRODUCT_PATTERN'
    | 'PRODUCT_FASHION_NAME'
    | 'PRODUCT_MODEL_NO'
    | 'PRODUCT_GROUP'
    | 'PRODUCT_SUBGROUP'
    | 'PRODUCT_BRAND'
    | 'PRODUCT_COLOR'
    | 'PRODUCT_SIZE'
    | 'PRODUCT_RACK'
    | 'UNIT'
    | 'WAREHOUSE';

export interface MasterEntry {
    _id: string;
    type: MasterType;
    name: string;
    description?: string;
    parentId?: string;
    meta?: Record<string, any>;
    isActive: boolean;
    createdAt: string;
}

export interface MasterEntryInput {
    name: string;
    description?: string;
    parentId?: string;
    meta?: Record<string, any>;
}

interface MasterDataState {
    entriesByType: Partial<Record<MasterType, MasterEntry[]>>;
    isLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: MasterDataState = {
    entriesByType: {},
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

export const fetchMasterEntries = createAsyncThunk<
    { type: MasterType; entries: MasterEntry[] },
    { type: MasterType; parentId?: string },
    { state: RootState }
>(
    'masterData/fetch',
    async ({ type, parentId }, thunkAPI) => {
        try {
            const response = await api.get(`${API_URL}/${type}`, { ...authHeader(thunkAPI), params: parentId ? { parentId } : {} });
            return { type, entries: response.data };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const createMasterEntry = createAsyncThunk<
    MasterEntry,
    { type: MasterType; data: MasterEntryInput },
    { state: RootState }
>(
    'masterData/create',
    async ({ type, data }, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/${type}`, data, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const updateMasterEntry = createAsyncThunk<
    MasterEntry,
    { id: string; data: Partial<MasterEntryInput> & { isActive?: boolean } },
    { state: RootState }
>(
    'masterData/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const response = await api.put(`${API_URL}/entry/${id}`, data, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const deleteMasterEntry = createAsyncThunk<
    { id: string; type: MasterType },
    { id: string; type: MasterType },
    { state: RootState }
>(
    'masterData/delete',
    async ({ id, type }, thunkAPI) => {
        try {
            await api.delete(`${API_URL}/entry/${id}`, authHeader(thunkAPI));
            return { id, type };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const masterDataSlice = createSlice({
    name: 'masterData',
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
            .addCase(fetchMasterEntries.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchMasterEntries.fulfilled, (state, action) => {
                state.isLoading = false;
                state.entriesByType[action.payload.type] = action.payload.entries;
            })
            .addCase(fetchMasterEntries.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createMasterEntry.fulfilled, (state, action) => {
                const list = state.entriesByType[action.payload.type] || [];
                state.entriesByType[action.payload.type] = [...list, action.payload].sort((a, b) => a.name.localeCompare(b.name));
            })
            .addCase(createMasterEntry.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateMasterEntry.fulfilled, (state, action) => {
                const list = state.entriesByType[action.payload.type] || [];
                state.entriesByType[action.payload.type] = list.map((e) => (e._id === action.payload._id ? action.payload : e));
            })
            .addCase(updateMasterEntry.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteMasterEntry.fulfilled, (state, action) => {
                const list = state.entriesByType[action.payload.type] || [];
                state.entriesByType[action.payload.type] = list.filter((e) => e._id !== action.payload.id);
            })
            .addCase(deleteMasterEntry.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset } = masterDataSlice.actions;
export default masterDataSlice.reducer;
