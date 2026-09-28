import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "../../services/api";
import { Invoice } from "../../types/sales";

const API_URL = "/api/sales-invoice";

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export interface SalesInvoicePagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface SalesInvoiceState {
    invoices: Invoice[];
    invoice: Invoice | null;
    summary: any | null; // Define InvoiceSummary if available
    pagination: SalesInvoicePagination | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string | any;
}

const initialState: SalesInvoiceState = {
    invoices: [],
    invoice: null,
    summary: null,
    pagination: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

export interface GetSalesInvoicesParams {
    search?: string;
    status?: string;
    customerId?: string;
    page?: number;
    pageSize?: number;
}

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

// Get all sales invoices. Pass nothing (or a bare search string, kept for back-compat) for the
// full unpaginated list (e.g. EMIPlans.tsx); pass { page, pageSize, ... } for the paginated,
// server-filtered Sales Invoices page.
export const getAllSalesInvoices = createAsyncThunk(
    'salesInvoice/getAll',
    async (params: string | GetSalesInvoicesParams | undefined, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const query = typeof params === "string" ? { search: params } : params;
            const response = await api.get(`${API_URL}/invoices`, { ...getConfig(token), params: query });
            return response.data as { success: boolean; data: Invoice[]; pagination?: SalesInvoicePagination };
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

// Correct a completed POS invoice's line quantities/prices/discount (see backend's
// PosController.editInvoice) -- lives under /api/pos/invoice rather than API_URL since it's
// the same underlying Invoice document but a POS-specific action, not a sales-invoice CRUD one.
export const editSalesInvoice = createAsyncThunk(
    'salesInvoice/edit',
    async (
        { id, items, discount, editReason }: {
            id: string;
            items: Array<{ item: string; quantity?: number; price?: number; discount?: number }>;
            discount?: number;
            editReason?: string;
        },
        thunkAPI
    ) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.patch(`/api/pos/invoice/${id}/edit`, { items, discount, editReason }, getConfig(token));
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
                state.isError = false;
            })
            .addCase(getSalesInvoiceSummary.fulfilled, (state, action: PayloadAction<{ success: boolean; data: any }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.summary = action.payload?.data ?? null;
            })
            .addCase(getSalesInvoiceSummary.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all sales invoices
            .addCase(getAllSalesInvoices.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(getAllSalesInvoices.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Invoice[]; pagination?: SalesInvoicePagination }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = Array.isArray(action.payload?.data) ? action.payload.data : [];
                state.pagination = action.payload?.pagination ?? null;
            })
            .addCase(getAllSalesInvoices.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create sales invoice
            .addCase(createSalesInvoice.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(createSalesInvoice.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Invoice }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                if (action.payload?.data) state.invoices.push(action.payload.data);
            })
            .addCase(createSalesInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get sales invoice by ID
            .addCase(getSalesInvoiceById.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(getSalesInvoiceById.fulfilled, (state, action: PayloadAction<{ success: boolean; data: Invoice }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoice = action.payload?.data ?? null;
            })
            .addCase(getSalesInvoiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete sales invoice
            .addCase(deleteSalesInvoice.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
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
                state.isError = false;
            })
            .addCase(markSalesInvoiceAsPaid.fulfilled, (state, action: PayloadAction<{ success: boolean; data: { message: string; invoice: Invoice } }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                const updated = action.payload?.data?.invoice;
                if (!updated) return;
                // Update the invoice in the list if it exists
                const index = state.invoices.findIndex(inv => inv._id === updated._id);
                if (index !== -1) {
                    state.invoices[index] = updated;
                }
                // Update the current invoice if it's the same one
                if (state.invoice && state.invoice._id === updated._id) {
                    state.invoice = updated;
                }
            })
            .addCase(markSalesInvoiceAsPaid.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Edit sales invoice
            .addCase(editSalesInvoice.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(editSalesInvoice.fulfilled, (state, action: PayloadAction<{ invoice: Invoice }>) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.invoices.findIndex(inv => inv._id === action.payload.invoice._id);
                if (index !== -1) {
                    state.invoices[index] = action.payload.invoice;
                }
                if (state.invoice && state.invoice._id === action.payload.invoice._id) {
                    state.invoice = action.payload.invoice;
                }
            })
            .addCase(editSalesInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearSalesInvoice } = salesInvoiceSlice.actions;
export default salesInvoiceSlice.reducer;

