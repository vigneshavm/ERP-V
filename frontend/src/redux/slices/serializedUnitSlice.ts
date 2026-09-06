import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/inventory/serial-units";

export type SerializedUnitStatus = 'IN_STOCK' | 'SOLD' | 'RETURNED' | 'DAMAGED';

export interface SerializedUnit {
    _id: string;
    itemId: string | { _id: string; name: string; sku: string; sellingPrice: number };
    serialNumber: string;
    imei1?: string;
    imei2?: string;
    modelNo?: string;
    configuration?: string;
    warrantyMonths?: number;
    warrantyStartDate?: string;
    status: SerializedUnitStatus;
    createdAt: string;
}

export interface NewUnitInput {
    serialNumber: string;
    imei1?: string;
    imei2?: string;
    modelNo?: string;
    configuration?: string;
    warrantyMonths?: number;
    warrantyStartDate?: string;
}

interface SerializedUnitState {
    unitsByItem: SerializedUnit[];
    lookupResult: SerializedUnit | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: SerializedUnitState = {
    unitsByItem: [],
    lookupResult: null,
    isLoading: false,
    isSuccess: false,
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

export const addSerializedUnits = createAsyncThunk<SerializedUnit[], { itemId: string; units: NewUnitInput[] }, { state: RootState }>(
    'serializedUnit/add',
    async ({ itemId, units }, thunkAPI) => {
        try {
            const response = await api.post(API_URL, { itemId, units }, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const getUnitsByItem = createAsyncThunk<SerializedUnit[], { itemId: string; status?: SerializedUnitStatus }, { state: RootState }>(
    'serializedUnit/getByItem',
    async ({ itemId, status }, thunkAPI) => {
        try {
            const response = await api.get(`${API_URL}/item/${itemId}`, { ...authHeader(thunkAPI), params: status ? { status } : {} });
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const lookupSerializedUnit = createAsyncThunk<SerializedUnit, string, { state: RootState }>(
    'serializedUnit/lookup',
    async (value, thunkAPI) => {
        try {
            const response = await api.get(`${API_URL}/lookup/${encodeURIComponent(value)}`, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const updateUnitStatus = createAsyncThunk<SerializedUnit, { id: string; status: SerializedUnitStatus; soldInvoiceId?: string }, { state: RootState }>(
    'serializedUnit/updateStatus',
    async ({ id, status, soldInvoiceId }, thunkAPI) => {
        try {
            const response = await api.patch(`${API_URL}/${id}/status`, { status, soldInvoiceId }, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const deleteSerializedUnit = createAsyncThunk<string, string, { state: RootState }>(
    'serializedUnit/delete',
    async (id, thunkAPI) => {
        try {
            await api.delete(`${API_URL}/${id}`, authHeader(thunkAPI));
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const serializedUnitSlice = createSlice({
    name: 'serializedUnit',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearLookup: (state) => {
            state.lookupResult = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addSerializedUnits.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(addSerializedUnits.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.unitsByItem = [...action.payload, ...state.unitsByItem];
            })
            .addCase(addSerializedUnits.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getUnitsByItem.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getUnitsByItem.fulfilled, (state, action) => {
                state.isLoading = false;
                state.unitsByItem = action.payload;
            })
            .addCase(getUnitsByItem.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(lookupSerializedUnit.pending, (state) => {
                state.isLoading = true;
                state.lookupResult = null;
            })
            .addCase(lookupSerializedUnit.fulfilled, (state, action) => {
                state.isLoading = false;
                state.lookupResult = action.payload;
            })
            .addCase(lookupSerializedUnit.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateUnitStatus.fulfilled, (state, action) => {
                const index = state.unitsByItem.findIndex(u => u._id === action.payload._id);
                if (index !== -1) {
                    state.unitsByItem[index] = action.payload;
                }
            })
            .addCase(deleteSerializedUnit.fulfilled, (state, action) => {
                state.unitsByItem = state.unitsByItem.filter(u => u._id !== action.payload);
            });
    },
});

export const { reset, clearLookup } = serializedUnitSlice.actions;
export default serializedUnitSlice.reducer;
