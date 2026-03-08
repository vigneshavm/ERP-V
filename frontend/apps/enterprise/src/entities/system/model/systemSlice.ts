import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SystemState, SystemConfig, RegistryAudit, SyncStatus } from './types';

const initialState: SystemState = {
    configs: [],
    audits: [],
    syncStatus: [],
    isLoading: false,
    error: null,
};

export const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        setConfigs: (state, action: PayloadAction<SystemConfig[]>) => {
            state.configs = action.payload;
        },
        addAudit: (state, action: PayloadAction<RegistryAudit>) => {
            state.audits.unshift(action.payload);
        },
        updateSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
            const index = state.syncStatus.findIndex(s => s.mfeId === action.payload.mfeId);
            if (index !== -1) {
                state.syncStatus[index] = action.payload;
            } else {
                state.syncStatus.push(action.payload);
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setConfigs, addAudit, updateSyncStatus, setLoading, setError } = systemSlice.actions;
export default systemSlice.reducer;
