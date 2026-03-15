import { useAuthStore } from '@repo/shared';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";

const API_URL = "/delivery-challan";

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Define basic interface for DeliveryChallan since it's not found in types
export interface DeliveryChallan {
    _id: string;
    challanNo?: string;
    customer?: any; // Replace with Customer type if strictly needed, avoiding circular deps if any
    items?: any[];
    [key: string]: any;
}

interface DeliveryChallanState {
    challans: DeliveryChallan[];
    challan: DeliveryChallan | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string | any;
}

const initialState: DeliveryChallanState = {
    challans: [],
    challan: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Create delivery challan
export const createDeliveryChallan = createAsyncThunk(
    'deliveryChallan/create',
    async (challanData: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(API_URL, challanData, getConfig(token));
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

// Get all delivery challans
export const getAllDeliveryChallans = createAsyncThunk(
    'deliveryChallan/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Get delivery challan by ID
export const getDeliveryChallanById = createAsyncThunk(
    'deliveryChallan/getById',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Update delivery challan
export const updateDeliveryChallan = createAsyncThunk(
    'deliveryChallan/update',
    async ({ id, data }: { id: string; data: any }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/${id}`, data, getConfig(token));
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

// Convert to invoice
export const convertToInvoice = createAsyncThunk(
    'deliveryChallan/convertToInvoice',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/${id}/convert-to-invoice`, {}, getConfig(token));
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

// Delete delivery challan
export const deleteDeliveryChallan = createAsyncThunk(
    'deliveryChallan/delete',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

export const deliveryChallanSlice = createSlice({
    name: 'deliveryChallan',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.challan = null; // Clear cached challan
        },
        clearChallan: (state) => {
            state.challan = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create delivery challan
            .addCase(createDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createDeliveryChallan.fulfilled, (state, action: PayloadAction<{ challan: DeliveryChallan }>) => { // Assuming response structure { success: true, challan: ... }
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(createDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all delivery challans
            .addCase(getAllDeliveryChallans.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllDeliveryChallans.fulfilled, (state, action: PayloadAction<DeliveryChallan[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challans = action.payload;
            })
            .addCase(getAllDeliveryChallans.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get delivery challan by ID
            .addCase(getDeliveryChallanById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDeliveryChallanById.fulfilled, (state, action: PayloadAction<DeliveryChallan>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload;
            })
            .addCase(getDeliveryChallanById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update delivery challan
            .addCase(updateDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateDeliveryChallan.fulfilled, (state, action: PayloadAction<{ challan: DeliveryChallan }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(updateDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Convert to invoice
            .addCase(convertToInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(convertToInvoice.fulfilled, (state, action: PayloadAction<{ challan: DeliveryChallan }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(convertToInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete delivery challan
            .addCase(deleteDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteDeliveryChallan.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challans = state.challans.filter((c) => c._id !== action.payload);
            })
            .addCase(deleteDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearChallan } = deliveryChallanSlice.actions;
export default deliveryChallanSlice.reducer;

