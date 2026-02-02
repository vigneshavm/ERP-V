import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "../../services/api";
import { Sale, Customer, Session, SaleStatus, CartItem, Invoice } from "../../types/sales";
import { TaxMode, PaymentMethod } from "../../types/common";

const API_URL = "/api/pos";

// Get token from state
const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export interface HeldBill {
    id: string;
    note?: string;
    timestamp: string;
    session: Session;
}

interface POSState {
    invoices: Invoice[];
    salesHistory: Sale[];
    customers: Customer[];
    sessions: Session[];
    activeSessionIndex: number;
    invoice: Invoice | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
    activeCounterId?: string;
    heldBills: HeldBill[];
}

const defaultSession: Session = {
    id: 'default',
    label: 'Session 1',
    cart: [],
    customerId: null,
    taxMode: 'EXCLUSIVE',
    paymentMethod: 'CASH',
    redeemedPoints: 0
};

const initialState: POSState = {
    invoices: [],
    salesHistory: [],
    customers: [],
    sessions: [defaultSession],
    activeSessionIndex: 0,
    invoice: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    heldBills: []
};

// Create invoice
export const createInvoice = createAsyncThunk(
    'pos/createInvoice',
    async (invoiceData: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Get invoice by ID
export const getInvoiceById = createAsyncThunk(
    'pos/getById',
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

// Delete invoice
export const deleteInvoice = createAsyncThunk(
    'pos/delete',
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
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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
        resetPosState: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearInvoice: (state) => {
            state.invoice = null;
            state.isSuccess = false;
        },
        setSessions: (state, action: PayloadAction<Session[]>) => {
            state.sessions = action.payload;
        },
        setActiveSessionIndex: (state, action: PayloadAction<number>) => {
            state.activeSessionIndex = action.payload;
        },
        setActiveCounter: (state, action: PayloadAction<string>) => {
            state.activeCounterId = action.payload;
        },
        setCustomersList: (state, action: PayloadAction<Customer[]>) => {
            state.customers = action.payload;
        },
        setSalesHistory: (state, action: PayloadAction<Sale[]>) => {
            state.salesHistory = action.payload;
        },

        // Cart Reducers
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (!session) return;
            // Check dedupe based on variant or id
            const existingIdx = session.cart.findIndex(
                item => item.id === action.payload.id
                // && item.variantId === action.payload.variantId 
            );
            if (existingIdx >= 0) {
                // Determine if we should stack or not. 
                // Typically we stack unless it's a unique item.
                session.cart[existingIdx].qty += action.payload.qty;
            } else {
                session.cart.push(action.payload);
            }
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (!session) return;
            session.cart = session.cart.filter(i => i.id !== action.payload);
        },
        updateCartQty: (state, action: PayloadAction<{ id: string; qty: number }>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (!session) return;
            const item = session.cart.find(i => i.id === action.payload.id);
            if (item) {
                item.qty = action.payload.qty;
            }
        },
        updateCartLength: (state, action: PayloadAction<{ id: string; length: number }>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (!session) return;
            const item = session.cart.find(i => i.id === action.payload.id);
            if (item) {
                item.cutLength = action.payload.length;
            }
        },
        clearCart: (state) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session) {
                session.cart = [];
            }
        },

        // Session Actions
        addSession: (state) => {
            state.sessions.push({
                ...defaultSession,
                id: Date.now().toString(),
                label: `Session ${state.sessions.length + 1}`
            });
            state.activeSessionIndex = state.sessions.length - 1;
        },
        removeSession: (state, action: PayloadAction<number>) => {
            // Don't remove the last remaining session
            if (state.sessions.length <= 1) return;
            const idxToRemove = action.payload;
            state.sessions.splice(idxToRemove, 1);
            if (state.activeSessionIndex >= state.sessions.length) {
                state.activeSessionIndex = state.sessions.length - 1;
            }
        },
        setActiveSession: (state, action: PayloadAction<number>) => {
            state.activeSessionIndex = action.payload;
        },

        // Checkout State Actions
        setCustomer: (state, action: PayloadAction<string | null>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session) session.customerId = action.payload;
        },
        addCustomer: (state, action: PayloadAction<Customer>) => {
            const exists = state.customers.find(c => c.phone === action.payload.phone || c.id === action.payload.id);
            if (!exists) {
                state.customers.push(action.payload);
            }
        },
        updateCustomerPoints: (state, action: PayloadAction<{ id: string; points: number }>) => {
            const customer = state.customers.find(c => c.id === action.payload.id);
            if (customer) {
                customer.points = action.payload.points;
            }
        },
        setTaxMode: (state, action: PayloadAction<TaxMode>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session) session.taxMode = action.payload;
        },
        setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session) session.paymentMethod = action.payload;
        },
        setRedeemedPoints: (state, action: PayloadAction<number>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session) session.redeemedPoints = action.payload;
        },
        recordSale: (state, action: PayloadAction<Sale>) => {
            state.salesHistory.unshift(action.payload);
        },

        // Hold Bill Actions
        holdCurrentBill: (state, action: PayloadAction<{ note?: string }>) => {
            const session = state.sessions[state.activeSessionIndex];
            if (session && session.cart.length > 0) {
                state.heldBills.push({
                    id: Date.now().toString(),
                    note: action.payload.note,
                    timestamp: new Date().toISOString(),
                    session: { ...session }
                });
                // Reset session
                session.cart = [];
                session.customerId = null;
                session.redeemedPoints = 0;
            }
        },
        resumeBill: (state, action: PayloadAction<string>) => {
            const idx = state.heldBills.findIndex(b => b.id === action.payload);
            if (idx >= 0) {
                const held = state.heldBills[idx];
                // Replace current session with held session data
                state.sessions[state.activeSessionIndex] = {
                    ...held.session,
                    id: state.sessions[state.activeSessionIndex].id, // Keep current ID? Or restore old? Let's keep ID stable.
                    label: state.sessions[state.activeSessionIndex].label, // Keep label
                };
                // Remove from held
                state.heldBills.splice(idx, 1);
            }
        },
        discardHeldBill: (state, action: PayloadAction<string>) => {
            state.heldBills = state.heldBills.filter(b => b.id !== action.payload);
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

export const {
    resetPosState, clearInvoice, setSessions, setActiveSessionIndex, setActiveCounter,
    addToCart, removeFromCart, updateCartQty, updateCartLength, clearCart,
    addSession, removeSession, setActiveSession,
    setCustomer, addCustomer, updateCustomerPoints, recordSale, setTaxMode, setPaymentMethod, setRedeemedPoints,
    holdCurrentBill, resumeBill, discardHeldBill, setCustomersList, setSalesHistory
} = posSlice.actions;

export default posSlice.reducer;
