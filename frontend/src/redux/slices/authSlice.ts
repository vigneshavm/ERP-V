import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../store';

const API_URL = "/api/auth";

interface User {
    _id: string;
    token: string;
    businessType?: string;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
    deviceConflict: boolean;
    conflictMessage: string;
    currentSector?: string;
    currentBranch?: string;
    role?: string;
    theme?: 'light' | 'dark' | 'system';
}

// Get user from localStorage
const storedUser = localStorage.getItem('user');
const user: User | null = storedUser ? JSON.parse(storedUser) : null;

// Helper to get stored theme
const getStoredTheme = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light';
    }
    return 'light';
};

const initialState: AuthState = {
    user: user,
    currentSector: 'General',
    currentBranch: 'All',
    role: 'Staff',
    theme: getStoredTheme(),
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    deviceConflict: false,
    conflictMessage: '',
};

// Register user
export const register = createAsyncThunk<User, any, { rejectValue: string }>(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/register`, userData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
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

// Login user
export const login = createAsyncThunk<User, any, { rejectValue: string }>(
    'auth/login',
    async (userData, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/login`, userData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
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

// Request password reset (forgot password)
export const requestPasswordReset = createAsyncThunk<{ message: string }, string, { rejectValue: string }>(
    'auth/forgotPassword',
    async (email, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/forgot-password`, { email });
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

// Perform password reset
export const performPasswordReset = createAsyncThunk<{ message: string }, any, { rejectValue: string }>(
    'auth/resetPassword',
    async (payload, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/reset-password`, payload);
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

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('returnDraft');
});

// Force logout from previous device
export const forceLogout = createAsyncThunk<any, any, { rejectValue: string }>(
    'auth/forceLogout',
    async (credentials, thunkAPI) => {
        try {
            const response = await api.post(`${API_URL}/force-logout`, credentials);
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

// Get user profile
export const getProfile = createAsyncThunk<any, void, { state: RootState, rejectValue: string }>(
    'auth/profile',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            const response = await api.get(`${API_URL}/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
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

// Update user profile
export const updateProfile = createAsyncThunk<any, any, { state: RootState, rejectValue: string }>(
    'auth/updateProfile',
    async (userData, thunkAPI) => {
        try {
            const state = thunkAPI.getState();
            const token = state.auth.user?.token;
            const userId = state.auth.user?._id;
            const response = await api.put(
                `/api/users/${userId}`,
                userData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data && response.data.user) {
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
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.deviceConflict = false;
            state.conflictMessage = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
                state.user = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                const errorData = action.payload as string;
                if (typeof errorData === 'string' && errorData.includes('currently active on another device')) {
                    state.deviceConflict = true;
                    state.conflictMessage = errorData;
                } else {
                    state.isError = true;
                    state.message = errorData;
                }
                state.user = null;
            })
            // Forgot Password
            .addCase(requestPasswordReset.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
                state.message = '';
            })
            .addCase(requestPasswordReset.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload?.message || 'Reset link sent.';
            })
            .addCase(requestPasswordReset.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Reset Password
            .addCase(performPasswordReset.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
                state.message = '';
            })
            .addCase(performPasswordReset.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload?.message || 'Password reset successful.';
            })
            .addCase(performPasswordReset.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
            })
            // Force Logout
            .addCase(forceLogout.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(forceLogout.fulfilled, (state) => {
                state.isLoading = false;
                state.deviceConflict = false;
                state.conflictMessage = '';
            })
            .addCase(forceLogout.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Get Profile
            .addCase(getProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getProfile.fulfilled, (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
                state.message = '';
            })
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.isSuccess = true;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
                state.message = 'Profile updated successfully';
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
