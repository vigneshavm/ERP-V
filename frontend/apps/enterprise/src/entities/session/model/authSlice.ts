import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { httpClient, endpoints } from '@repo/b2b-services';
import api from '@/shared/api/api';
import { Sector } from "@repo/shared";
import { clearSession } from "@/shared/lib/utils/session";
import { RootState } from "@/app/store/store";


export interface User {
    _id: string;
    token: string;
    businessType?: string;
    shopName?: string;
    phone?: string;
    [key: string]: any;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
    deviceConflict: boolean;
    conflictMessage: string;
    currentSector?: Sector;
    currentBranch?: string;
    role?: string;
    theme?: 'light' | 'dark' | 'system';
    userPreferences?: any;
}

// Helper to get stored user
const getStoredUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
};

const user = getStoredUser();

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
    role: user?.role,
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
            const response = await httpClient.post(endpoints.auth.register, userData);
            if (response) {
                localStorage.setItem('user', JSON.stringify(response));
            }
            return response as User;
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
            if (response) {
                localStorage.setItem('user', JSON.stringify(response));
            }
            return response as User;
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
            return response as { message: string };
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
            return response as { message: string };
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
// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    clearSession();
});

// Force logout from previous device
export const forceLogout = createAsyncThunk<any, any, { rejectValue: string }>(
    'auth/forceLogout',
    async (credentials, thunkAPI) => {
        try {
            const response = await httpClient.post(endpoints.auth.forceLogout, credentials);
            return response as any;
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
            return response as any;
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
            if ((response as any)?.user) {
                const currentUser = state.auth.user;
                const updatedUser = { ...currentUser, ...(response as any).user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return (response as any).user;
            }
            return response;
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
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.deviceConflict = false;
            state.conflictMessage = '';
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.role = action.payload?.role;
        },
        setAuthError: (state, action: PayloadAction<string | null>) => {
            state.isError = !!action.payload;
            state.message = action.payload || '';
        },
        setAuthSuccess: (state, action: PayloadAction<boolean>) => {
            state.isSuccess = action.payload;
        },
        setBranch: (state, action: PayloadAction<string>) => {
            state.currentBranch = action.payload;
        },
        setSector: (state, action: PayloadAction<Sector>) => {
            state.currentSector = action.payload;
        },
        setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
            state.theme = action.payload;
        },
        setUserPreferences: (state, action: PayloadAction<any>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        }
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
                if (action.payload.role) {
                    state.role = action.payload.role;
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                const errorPayload = action.payload as any;

                // Check if payload is an object with deviceConflict flag
                if (errorPayload && (errorPayload.deviceConflict === true || errorPayload.deviceConflict === 'true')) {
                    state.deviceConflict = true;
                    state.conflictMessage = errorPayload.message || 'Device conflict detected';
                }
                // Fallback for string matching (legacy or plain string error)
                else if (typeof errorPayload === 'string' && errorPayload.toLowerCase().includes('active on another device')) {
                    state.deviceConflict = true;
                    state.conflictMessage = errorPayload;
                }
                // Fallback for object message matching (structured error without flag)
                else if (errorPayload && errorPayload.message && typeof errorPayload.message === 'string' && errorPayload.message.toLowerCase().includes('active on another device')) {
                    state.deviceConflict = true;
                    state.conflictMessage = errorPayload.message;
                }
                else {
                    state.isError = true;
                    state.message = errorPayload?.message || (typeof errorPayload === 'string' ? errorPayload : 'Login failed');
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
                if (action.payload.role) {
                    state.role = action.payload.role;
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

export const { resetAuthState, setAuthLoading, setUser, setAuthError, setAuthSuccess, setBranch, setSector, setTheme, setUserPreferences } = authSlice.actions;
export default authSlice.reducer;

