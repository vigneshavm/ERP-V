import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Sale, Customer, Session, SaleStatus } from '../../types/sales';

const API_URL = "/api/pos";

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

interface POSState {
    invoices: any[]; // Or a more specific type if available
    salesHistory: Sale[];
    customers: Customer[];
    sessions: Session[];
    activeSessionIndex: number;
    invoice: any | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: POSState = {
    invoices: [],
    salesHistory: [],
    customers: [],
    sessions: [],
    activeSessionIndex: 0,
    invoice: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Create invoice
export const createInvoice = createAsyncThunk(
    'pos/createInvoice',
    async (invoiceData: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user.token;
            const response = await api.post(`${API_URL}/invoice`, invoiceData, getConfig(token));
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

// Get all invoices
export const getAllInvoices = createAsyncThunk(
    'pos/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user.token;
            const response = await api.get(`${API_URL}/invoices`, getConfig(token));
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

// Get invoice by ID
export const getInvoiceById = createAsyncThunk(
    'pos/getById',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user.token;
            const response = await api.get(`${API_URL}/invoice/${id}`, getConfig(token));
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

// Delete invoice
export const deleteInvoice = createAsyncThunk(
    'pos/delete',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user.token;
            await api.delete(`${API_URL}/invoice/${id}`, getConfig(token));
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

// Update sale status
export const updateSaleStatus = createAsyncThunk<
    { id: string; status: SaleStatus },
    { id: string; status: SaleStatus },
    { state: any }
>(
    'pos/updateStatus',
    async ({ id, status }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user.token;
            const response = await api.put(`${API_URL}/invoice/${id}/status`, { status }, getConfig(token));
            // Return BOTH id and status to fulfill the expected payload for the reducer
            return { id, status: response.data.status || status };
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const posSlice = createSlice({
    name: 'pos',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearInvoice: (state) => {
            state.invoice = null;
            state.isSuccess = false;
        },
        // Adding standard reducers for POSState compatibility if needed
        setSessions: (state, action: PayloadAction<Session[]>) => {
            state.sessions = action.payload;
        },
        setActiveSessionIndex: (state, action: PayloadAction<number>) => {
            state.activeSessionIndex = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create invoice
            .addCase(createInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createInvoice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoice = action.payload.invoice;
                state.invoices.unshift(action.payload.invoice);
            })
            .addCase(createInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Get all invoices
            .addCase(getAllInvoices.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllInvoices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = action.payload;
                state.salesHistory = action.payload; // Sync salesHistory with invoices
            })
            .addCase(getAllInvoices.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Get invoice by ID
            .addCase(getInvoiceById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getInvoiceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoice = action.payload;
            })
            .addCase(getInvoiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Delete invoice
            .addCase(deleteInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteInvoice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
            })
            .addCase(deleteInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Update sale status
            .addCase(updateSaleStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateSaleStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const { id, status } = action.payload;
                const index = state.salesHistory.findIndex((s) => s.id === id || (s as any)._id === id);
                if (index !== -1) {
                    state.salesHistory[index].status = status;
                }
                // Also update invoices for consistency
                const invIndex = state.invoices.findIndex((inv) => inv._id === id);
                if (invIndex !== -1) {
                    state.invoices[invIndex].status = status;
                }
            })
            .addCase(updateSaleStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearInvoice, setSessions, setActiveSessionIndex } = posSlice.actions;
export default posSlice.reducer;
