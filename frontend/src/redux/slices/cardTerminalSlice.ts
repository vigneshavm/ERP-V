import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/card-terminals";

export interface CardTerminal {
    _id: string;
    terminalId: string;
    provider?: string;
    storeId?: string | { _id: string; name?: string };
    isActive: boolean;
    notes?: string;
}

interface CardTerminalState {
    terminals: CardTerminal[];
    isLoading: boolean;
    isError: boolean;
    message: string;
}

const initialState: CardTerminalState = {
    terminals: [],
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

export const getCardTerminals = createAsyncThunk<CardTerminal[], void, { state: RootState }>(
    'cardTerminals/getAll',
    async (_, thunkAPI) => {
        try {
            const response = await api.get(API_URL, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const createCardTerminal = createAsyncThunk<CardTerminal, Partial<CardTerminal>, { state: RootState }>(
    'cardTerminals/create',
    async (data, thunkAPI) => {
        try {
            const response = await api.post(API_URL, data, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const updateCardTerminal = createAsyncThunk<CardTerminal, { id: string; data: Partial<CardTerminal> }, { state: RootState }>(
    'cardTerminals/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const response = await api.put(`${API_URL}/${id}`, data, authHeader(thunkAPI));
            return response.data.data || response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const deleteCardTerminal = createAsyncThunk<string, string, { state: RootState }>(
    'cardTerminals/delete',
    async (id, thunkAPI) => {
        try {
            await api.delete(`${API_URL}/${id}`, authHeader(thunkAPI));
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const cardTerminalSlice = createSlice({
    name: 'cardTerminals',
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
            .addCase(getCardTerminals.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCardTerminals.fulfilled, (state, action) => {
                state.isLoading = false;
                state.terminals = action.payload;
            })
            .addCase(getCardTerminals.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createCardTerminal.fulfilled, (state, action) => {
                state.terminals.push(action.payload);
            })
            .addCase(updateCardTerminal.fulfilled, (state, action) => {
                const index = state.terminals.findIndex(t => t._id === action.payload._id);
                if (index !== -1) state.terminals[index] = action.payload;
            })
            .addCase(deleteCardTerminal.fulfilled, (state, action) => {
                state.terminals = state.terminals.filter(t => t._id !== action.payload);
            });
    },
});

export const { reset } = cardTerminalSlice.actions;
export default cardTerminalSlice.reducer;
