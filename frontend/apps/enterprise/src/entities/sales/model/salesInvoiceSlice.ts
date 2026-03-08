import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { Invoice } from '@repo/shared-kernel';

const API_URL = "/api/sales-invoice";

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

interface SalesInvoiceState {
    invoices: Invoice[];
    invoice: Invoice | null;
    summary: any | null; // Define InvoiceSummary if available
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string | any;
}

const initialState: SalesInvoiceState = {
    invoices: [],
    invoice: null,
    summary: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get sales invoice summary
export const getSalesInvoiceSummary = createAsyncThunk(
    'salesInvoice/getSummary',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/summary`, getConfig(token));
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

// Get all sales invoices
export const getAllSalesInvoices = createAsyncThunk(
    'salesInvoice/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Get sales invoice by ID
export const getSalesInvoiceById = createAsyncThunk(
    'salesInvoice/getById',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Delete sales invoice
export const deleteSalesInvoice = createAsyncThunk(
    'salesInvoice/delete',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Mark sales invoice as paid
export const markSalesInvoiceAsPaid = createAsyncThunk(
    'salesInvoice/markPaid',
    async ({ id, amount, bankAccount, paymentMethod }: { id: string; amount: number; bankAccount?: string; paymentMethod?: string }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/invoice/${id}/mark-paid`, {
                amount,
                bankAccount,
                paymentMethod
            }, getConfig(token));
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

// Create new sales invoice
export const createSalesInvoice = createAsyncThunk(
    'salesInvoice/create',
    async (invoiceData: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(API_URL, invoiceData, getConfig(token));
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

export const salesInvoiceSlice = createSlice({
    name: 'salesInvoice',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearSalesInvoice: (state) => {
            state.invoice = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get sales invoice summary
            .addCase(getSalesInvoiceSummary.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSalesInvoiceSummary.fulfilled, (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.summary = action.payload;
            })
            .addCase(getSalesInvoiceSummary.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all sales invoices
            .addCase(getAllSalesInvoices.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllSalesInvoices.fulfilled, (state, action: PayloadAction<Invoice[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = action.payload;
            })
            .addCase(getAllSalesInvoices.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create sales invoice
            .addCase(createSalesInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSalesInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices.push(action.payload);
            })
            .addCase(createSalesInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get sales invoice by ID
            .addCase(getSalesInvoiceById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSalesInvoiceById.fulfilled, (state, action: PayloadAction<Invoice>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoice = action.payload;
            })
            .addCase(getSalesInvoiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete sales invoice
            .addCase(deleteSalesInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSalesInvoice.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
            })
            .addCase(deleteSalesInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Mark sales invoice as paid
            .addCase(markSalesInvoiceAsPaid.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(markSalesInvoiceAsPaid.fulfilled, (state, action: PayloadAction<{ invoice: Invoice }>) => { // Assuming response has { success, invoice: ... }
                state.isLoading = false;
                state.isSuccess = true;
                // Update the invoice in the list if it exists
                const index = state.invoices.findIndex(inv => inv._id === action.payload.invoice._id);
                if (index !== -1) {
                    state.invoices[index] = action.payload.invoice;
                }
                // Update the current invoice if it's the same one
                if (state.invoice && state.invoice._id === action.payload.invoice._id) {
                    state.invoice = action.payload.invoice;
                }
            })
            .addCase(markSalesInvoiceAsPaid.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearSalesInvoice } = salesInvoiceSlice.actions;
export default salesInvoiceSlice.reducer;

