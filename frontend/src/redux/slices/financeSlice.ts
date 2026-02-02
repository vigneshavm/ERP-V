import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { FinanceState, Transaction, Cheque, DayEndSummary } from "../../types/finance";
import { TransactionType } from "../../types/common";
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = '/cashbank';
const DAY_END_API_URL = '/day-end';

const getConfig = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
});

export const fetchCheques = createAsyncThunk(
    'finance/fetchCheques',
    async (sector: string | undefined, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const query = sector ? `?sector=${sector}` : '';
            const response = await api.get(`${API_URL}/cheques${query}`, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cheques');
        }
    }
);

export const registerCheque = createAsyncThunk(
    'finance/registerCheque',
    async (chequeData: Partial<Cheque>, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/cheques`, chequeData, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || { message: 'Failed to register cheque' });
        }
    }
);

export const updateChequeStatusBackend = createAsyncThunk(
    'finance/updateChequeStatus',
    async ({ id, status }: { id: string, status: 'CLEARED' | 'BOUNCED' | 'PENDING' }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/cheques/${id}/status`, { status }, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update cheque');
        }
    }
);

export const fetchEffectiveBalance = createAsyncThunk(
    'finance/fetchEffectiveBalance',
    async ({ accountId, date }: { accountId: string, date?: string }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const query = date ? `?date=${date}` : '';
            const response = await api.get(`${API_URL}/accounts/${accountId}/effective-balance${query}`, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch effective balance');
        }
    }
);

export const fetchDayEndSummary = createAsyncThunk(
    'finance/fetchDayEndSummary',
    async (date: string | undefined, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const query = date ? `?date=${date}` : '';
            const response = await api.get(`${DAY_END_API_URL}/summary${query}`, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch day end summary');
        }
    }
);

export const saveDayEndReconciliation = createAsyncThunk(
    'finance/saveDayEndReconciliation',
    async (data: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${DAY_END_API_URL}/save`, data, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save day end reconciliation');
        }
    }
);

const initialFinanceState: FinanceState = {
    transactions: [],
    cheques: [],
    dailyFinanceRecords: [],
    bankBalance: 0,
    effectiveBalance: 0,
    loading: false,
    error: null,
    pdcAlerts: null,
    dayEndSummary: null
};

const financeSlice = createSlice({
    name: 'finance',
    initialState: initialFinanceState,
    reducers: {
        addTransaction: (state, action: PayloadAction<Transaction>) => {
            state.transactions.unshift(action.payload);
        },
        addCheque: (state, action: PayloadAction<Cheque>) => {
            state.cheques.push(action.payload);
        },
        updateChequeStatus: (state, action: PayloadAction<{ id: string, status: 'CLEARED' | 'BOUNCED' }>) => {
            const cheque = state.cheques.find(c => (c._id || c.id) === action.payload.id);
            if (cheque) {
                cheque.status = action.payload.status;
            }
        },
        setTransactions: (state, action: PayloadAction<Transaction[]>) => {
            state.transactions = action.payload;
        },
        setCheques: (state, action: PayloadAction<Cheque[]>) => {
            state.cheques = action.payload;
        },
        setDailyRecords: (state, action: PayloadAction<any[]>) => {
            state.dailyFinanceRecords = action.payload;
        },
        addDailyRecord: (state, action: PayloadAction<any>) => {
            state.dailyFinanceRecords.unshift(action.payload);
        },
        updateDailyRecord: (state, action: PayloadAction<any>) => {
            const index = state.dailyFinanceRecords.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.dailyFinanceRecords[index] = action.payload;
            }
        },
        deleteDailyRecord: (state, action: PayloadAction<string>) => {
            state.dailyFinanceRecords = state.dailyFinanceRecords.filter(r => r.id !== action.payload);
        },
        setDailyRecordSynced: (state, action: PayloadAction<{ id: string, synced: boolean }>) => {
            const record = state.dailyFinanceRecords.find(r => r.id === action.payload.id);
            if (record) {
                record.synced = action.payload.synced;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Cheques
            .addCase(fetchCheques.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCheques.fulfilled, (state, action) => {
                state.loading = false;
                state.cheques = action.payload;
            })
            .addCase(fetchCheques.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Register Cheque
            .addCase(registerCheque.fulfilled, (state, action) => {
                state.cheques.push(action.payload);
            })
            // Update Cheque Status
            .addCase(updateChequeStatusBackend.fulfilled, (state, action) => {
                const index = state.cheques.findIndex(c => c._id === action.payload._id);
                if (index !== -1) {
                    state.cheques[index] = action.payload;
                }
            })
            // Effective Balance
            .addCase(fetchEffectiveBalance.fulfilled, (state, action) => {
                state.bankBalance = action.payload.currentBalance;
                state.effectiveBalance = action.payload.effectiveBalance;
                state.pdcAlerts = action.payload.sameDayAlerts;
            })
            // Day End Summary
            .addCase(fetchDayEndSummary.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDayEndSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.dayEndSummary = action.payload;
            })
            .addCase(fetchDayEndSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Save Day End
            .addCase(saveDayEndReconciliation.pending, (state) => {
                state.loading = true;
            })
            .addCase(saveDayEndReconciliation.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(saveDayEndReconciliation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const {
    addTransaction,
    addCheque,
    updateChequeStatus,
    setTransactions,
    setCheques,
    setDailyRecords,
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    setDailyRecordSynced
} = financeSlice.actions;
export default financeSlice.reducer;
