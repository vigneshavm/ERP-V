import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { RootState } from "@/app/store/store";
import { Account, Transaction, CashBankPosition, BankSummary, LedgerData } from "@/views/Financial/Cashbank/types";

const API_URL = "/cashbank";

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

interface CashBankState {
    accounts: Account[];
    transactions: Transaction[];
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
    isTransferSuccess: boolean;
    position: CashBankPosition | null;
    ledgerData: LedgerData | null;
    bankSummary: BankSummary | null;
}

const initialState: CashBankState = {
    accounts: [],
    transactions: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    isTransferSuccess: false,
    position: null,
    ledgerData: null,
    bankSummary: null,
};

// Get all accounts
export const getAccounts = createAsyncThunk(
    'cashbank/getAccounts',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/accounts`, getConfig(token));
            return response.data as Account[];
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create account
export const createAccount = createAsyncThunk(
    'cashbank/createAccount',
    async (accountData: Partial<Account>, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/accounts`, accountData, getConfig(token));
            return response.data as Account;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update account
export const updateAccount = createAsyncThunk(
    'cashbank/updateAccount',
    async ({ id, accountData }: { id: string; accountData: Partial<Account> }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/accounts/${id}`, accountData, getConfig(token));
            return response.data as Account;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete account
export const deleteAccount = createAsyncThunk(
    'cashbank/deleteAccount',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            await api.delete(`${API_URL}/accounts/${id}`, getConfig(token));
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

// Get transactions for account
export const getTransactions = createAsyncThunk(
    'cashbank/getTransactions',
    async (accountId: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/accounts/${accountId}/transactions`, getConfig(token));
            return response.data as Transaction[];
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create transfer
export const createTransfer = createAsyncThunk(
    'cashbank/createTransfer',
    async (transferData: { fromAccount: string; toAccount: string; amount: number; description: string }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/transfers`, transferData, getConfig(token));
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

// Get cash vs bank position
export const getCashBankPosition = createAsyncThunk(
    'cashbank/getPosition',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/position`, getConfig(token));
            return response.data as CashBankPosition;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create direct cash transaction
export const createCashTransaction = createAsyncThunk(
    'cashbank/createCashTransaction',
    async (txnData: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/cash-transactions`, txnData, getConfig(token));
            return response.data as Transaction;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get account ledger
export const getAccountLedger = createAsyncThunk(
    'cashbank/getAccountLedger',
    async ({ id, filters }: { id: string | undefined; filters: any }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);
            if (filters?.reconciled !== undefined && filters?.reconciled !== 'all') {
                params.append('reconciled', filters.reconciled);
            }

            const response = await api.get(`${API_URL}/accounts/${id}/ledger?${params}`, getConfig(token));
            return response.data as LedgerData;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Toggle reconciliation status
export const toggleReconciliation = createAsyncThunk(
    'cashbank/toggleReconciliation',
    async (txnId: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/transactions/${txnId}/reconcile`, {}, getConfig(token));
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

// Bulk reconcile
export const bulkReconcile = createAsyncThunk(
    'cashbank/bulkReconcile',
    async ({ transactionIds, reconciled }: { transactionIds: string[]; reconciled: boolean }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/transactions/bulk-reconcile`, { transactionIds, reconciled }, getConfig(token));
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

// Get bank summary
export const getBankSummary = createAsyncThunk(
    'cashbank/getBankSummary',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/summary`, getConfig(token));
            return response.data as BankSummary;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Validate a list of payments (Dynamic Balance Checking)
export const validatePayments = createAsyncThunk(
    'cashbank/validatePayments',
    async ({ accountId, payments }: { accountId: string; payments: any[] }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const { token } = useAuthStore.getState();
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/validate-payments`, { accountId, payments }, getConfig(token));
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

export const cashbankSlice = createSlice({
    name: 'cashbank',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.isTransferSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAccounts.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAccounts.fulfilled, (state, action: PayloadAction<Account[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.accounts = action.payload;
            })
            .addCase(getAccounts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createAccount.fulfilled, (state, action: PayloadAction<Account>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.accounts.push(action.payload);
            })
            .addCase(createAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateAccount.fulfilled, (state, action: PayloadAction<Account>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.accounts = state.accounts.map(account =>
                    account._id === action.payload._id ? action.payload : account
                );
            })
            .addCase(updateAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteAccount.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.accounts = state.accounts.filter(account => account._id !== action.payload);
            })
            .addCase(deleteAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getTransactions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.transactions = action.payload;
            })
            .addCase(getTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createTransfer.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createTransfer.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isTransferSuccess = true;
            })
            .addCase(createTransfer.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getCashBankPosition.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCashBankPosition.fulfilled, (state, action: PayloadAction<CashBankPosition>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.position = action.payload;
            })
            .addCase(getCashBankPosition.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createCashTransaction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createCashTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.transactions.unshift(action.payload);
            })
            .addCase(createCashTransaction.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getAccountLedger.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAccountLedger.fulfilled, (state, action: PayloadAction<LedgerData>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.ledgerData = action.payload;
            })
            .addCase(getAccountLedger.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getBankSummary.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBankSummary.fulfilled, (state, action: PayloadAction<BankSummary>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bankSummary = action.payload;
            })
            .addCase(getBankSummary.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(toggleReconciliation.fulfilled, (state, action: PayloadAction<any>) => {
                state.isSuccess = true;
                // Optimization: update ledgerData if it exists
                if (state.ledgerData) {
                    state.ledgerData.ledger = state.ledgerData.ledger.map(txn =>
                        txn._id === action.payload.transaction._id ? action.payload.transaction : txn
                    );
                }
            })
            .addCase(bulkReconcile.fulfilled, (state) => {
                state.isSuccess = true;
                // We might need to refetch ledger after bulk reconcile to be sure
            });
    },
});

export const { reset } = cashbankSlice.actions;
export default cashbankSlice.reducer;
