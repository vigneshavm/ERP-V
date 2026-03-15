import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/shared/api/api';
import { RootState } from '@/app/store/store';

// Define Types (Should be in types/finance.ts ideally, but inline for now)
export interface JournalEntry {
    _id: string;
    branchId?: string;
    date: string;
    description: string;
    reference: string;
    entries: {
        accountId: string;
        accountName?: string; // Populated or passed
        debit: number;
        credit: number;
    }[];
    status: 'DRAFT' | 'POSTED';
    createdBy?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface JournalEntryState {
    entries: JournalEntry[];
    currentEntry: JournalEntry | null;
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: JournalEntryState = {
    entries: [],
    currentEntry: null,
    loading: false,
    error: null,
    success: false
};

const API_URL = '/api/journal';

// Helpers
const getConfig = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
});

export const fetchJournalEntries = createAsyncThunk(
    'journalEntry/fetchAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");

            const response = await api.get(API_URL, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch journal entries');
        }
    }
);

export const createJournalEntry = createAsyncThunk(
    'journalEntry/create',
    async (entryData: Partial<JournalEntry>, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");

            const response = await api.post(API_URL, entryData, getConfig(token));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create journal entry');
        }
    }
);

const journalEntrySlice = createSlice({
    name: 'journalEntry',
    initialState,
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
        clearCurrentEntry: (state) => {
            state.currentEntry = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchJournalEntries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchJournalEntries.fulfilled, (state, action) => {
                state.loading = false;
                state.entries = action.payload;
            })
            .addCase(fetchJournalEntries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create
            .addCase(createJournalEntry.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createJournalEntry.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.entries.unshift(action.payload);
            })
            .addCase(createJournalEntry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.success = false;
            });
    }
});

export const { resetStatus, clearCurrentEntry } = journalEntrySlice.actions;
export default journalEntrySlice.reducer;
