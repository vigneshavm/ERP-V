import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TenantUser as User } from './core';
import apiClient from '@/shared/api/api';
// Note: Assuming httpClient and endpoints are available as per previous code context
import httpClient from '@/shared/api/api'; 
const endpoints = {
    auth: {
        register: '/auth/register',
        login: '/auth/login',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        forceLogout: '/auth/force-logout',
        profile: '/auth/profile'
    },
    users: {
        byId: (id: string) => `/users/${id}`
    }
};
import { logger } from '@/shared/lib/logger';
import { clearSession } from '@/shared/lib/utils/session';
import { RootState } from '@/app/store/store';

interface AuthState {
  user: User | null;
  role: string | null;
  currentSector: string | null;
  currentBranch: string | null;
  theme: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  // Legacy fields from head if needed
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  deviceConflict?: boolean;
  conflictMessage?: string;
}

const initialState: AuthState = {
  user: null,
  role: null,
  currentSector: 'Retail',
  currentBranch: 'All',
  theme: 'light',
  loading: false,
  error: null,
  message: null,
};

// Register user
export const register = createAsyncThunk<User, any, { rejectValue: string }>(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.register, userData);
            if (response && response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data as User;
        } catch (error: any) {
            const message =
                (error as any)?.message || error?.toString?.() || 'Registration failed';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Login user
export const login = createAsyncThunk<User, any, { rejectValue: any }>(
    'auth/login',
    async (userData, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.login, userData);
            if (response && response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data as User;
        } catch (error: any) {
            const message = (error as any)?.message || 'Login failed';
            return thunkAPI.rejectWithValue({ message });
        }
    }
);

// Request password reset (forgot password)
export const requestPasswordReset = createAsyncThunk<{ message: string }, string, { rejectValue: string }>(
    'auth/forgotPassword',
    async (email, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.forgotPassword, { email });
            return response.data as { message: string };
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Perform password reset
export const performPasswordReset = createAsyncThunk<{ message: string }, any, { rejectValue: string }>(
    'auth/resetPassword',
    async (payload, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.resetPassword, payload);
            return response.data as { message: string };
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Logout user
export const logoutAction = createAsyncThunk('auth/logout', async () => {
    clearSession();
});

// Force logout from previous device
export const forceLogout = createAsyncThunk<any, any, { rejectValue: string }>(
    'auth/forceLogout',
    async (credentials, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.forceLogout, credentials);
            return response.data as any;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get user profile
export const getProfile = createAsyncThunk<any, void, { state: RootState, rejectValue: string }>(
    'auth/profile',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            const response = await httpClient.get(endpoints.auth.profile, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data as any;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update user profile
export const updateProfile = createAsyncThunk<any, any, { state: RootState, rejectValue: string }>(
    'auth/updateProfile',
    async (userData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            const userId = state.auth.user?._id;
            const response = await httpClient.put(
                endpoints.users.byId(userId as string),
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data?.user) {
                const currentUser = state.auth.user;
                const updatedUser = { ...currentUser, ...response.data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return response.data.user;
            }
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

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetAuthState: (state) => {
            state.loading = false;
            state.error = null;
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.role = action.payload?.role || null;
        },
        logout: (state) => {
            state.user = null;
            state.role = null;
            clearSession();
        },
        setUserPreferences: (state, action: PayloadAction<any>) => {
            if (state.user) {
                state.user.userPreferences = action.payload;
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
        setBranch: (state, action: PayloadAction<string>) => {
            state.currentBranch = action.payload;
        },
        setTheme: (state, action: PayloadAction<string>) => {
            state.theme = action.payload;
        },
        setAuthError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isError = !!action.payload;
            state.loading = false;
        },
        setAuthSuccess: (state, action: PayloadAction<boolean>) => {
            state.isSuccess = action.payload;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getProfile.pending, (state) => {
                state.loading = true;
            })
            .addCase(getProfile.fulfilled, (state, action: any) => {
                state.loading = false;
                if (action.payload) {
                    state.user = action.payload;
                    state.role = (action.payload as any).role || null;
                }
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(login.pending, (state) => {
                state.loading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.role = action.payload.role || null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as any)?.message || 'Login failed';
            });
    },
});

export const { setUser, logout, resetAuthState, setAuthLoading, setUserPreferences, setBranch, setTheme, setAuthError, setAuthSuccess } = authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
