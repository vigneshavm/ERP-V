import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/purchases/agents";

export interface Agent {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    commissionPercent: number;
    linkedSupplierId?: string;
    bankAccountNumber?: string;
    bankName?: string;
    ifsc?: string;
    notes?: string;
    status: 'active' | 'inactive';
}

interface AgentState {
    agents: Agent[];
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const initialState: AgentState = {
    agents: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

export const getAgents = createAsyncThunk<Agent[], void, { state: RootState, rejectValue: string }>(
    'agents/getAll',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.get(API_URL, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const createAgent = createAsyncThunk<Agent, Partial<Agent>, { state: RootState, rejectValue: string }>(
    'agents/create',
    async (agentData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.post(API_URL, agentData, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const updateAgent = createAsyncThunk<Agent, { id: string, data: Partial<Agent> }, { state: RootState, rejectValue: string }>(
    'agents/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
            const response = await api.put(`${API_URL}/${id}`, data, getConfig(token));
            return response.data.data || response.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const deleteAgent = createAsyncThunk<string, string, { state: RootState, rejectValue: string }>(
    'agents/delete',
    async (id, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('Token not found');
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

export const agentSlice = createSlice({
    name: 'agents',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAgents.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAgents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.agents = action.payload;
            })
            .addCase(getAgents.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createAgent.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createAgent.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.agents.push(action.payload);
            })
            .addCase(createAgent.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateAgent.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.agents.findIndex(a => a._id === action.payload._id);
                if (index !== -1) {
                    state.agents[index] = action.payload;
                }
            })
            .addCase(deleteAgent.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.agents = state.agents.filter(a => a._id !== action.payload);
            });
    },
});

export const { reset } = agentSlice.actions;
export default agentSlice.reducer;
