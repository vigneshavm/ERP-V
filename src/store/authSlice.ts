import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, UserVisualIdentity } from '../types/settings';
import { Sector, SystemRole } from '../types/common';
import { TenantUser } from '../types/tenant';
import { getStoredTheme } from '../utils/theme';

const initialAuthState: AuthState = {
    user: null,
    currentSector: Sector.GENERAL,
    currentBranch: 'All',
    role: 'Staff',
    theme: getStoredTheme() || 'light',
    isLoading: false,
    isSuccess: false,
    isError: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState: initialAuthState,
    reducers: {
        setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
            state.theme = action.payload;
        },
        setSector: (state, action: PayloadAction<Sector>) => {
            state.currentSector = action.payload;
        },
        setBranch: (state, action: PayloadAction<string>) => {
            state.currentBranch = action.payload;
        },
        setUser: (state, action: PayloadAction<TenantUser | null>) => {
            if (!action.payload) {
                state.user = null;
                state.role = 'Staff';
                state.userPreferences = undefined;
                return;
            }
            state.user = action.payload;
            state.role = action.payload.systemRole;
            state.currentSector = action.payload.sector;
            state.currentBranch = 'All';
        },
        setUserPreferences: (state, action: PayloadAction<UserVisualIdentity | undefined>) => {
            state.userPreferences = action.payload;
            if (action.payload?.theme) {
                state.theme = action.payload.theme as 'light' | 'dark' | 'system';
            }
        },
        logout: (state) => {
            state.user = null;
            state.role = 'Staff';
            state.currentBranch = 'All';
            state.userPreferences = undefined;
            state.isSuccess = false;
            state.isError = null;
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setAuthSuccess: (state, action: PayloadAction<boolean>) => {
            state.isSuccess = action.payload;
        },
        setAuthError: (state, action: PayloadAction<string | null>) => {
            state.isError = action.payload;
        }
    }
});

export const { setTheme, setSector, setBranch, setUser, setUserPreferences, logout, setAuthLoading, setAuthSuccess, setAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
