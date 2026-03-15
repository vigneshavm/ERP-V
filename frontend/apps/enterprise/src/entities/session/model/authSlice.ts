import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TenantUser as User } from './core';
import apiClient from '@/shared/api/api';

import { logger } from '@/shared/lib/logger';

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  role: null,
  loading: false,
  error: null,
};

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // const response = await apiClient.get('/auth/profile');
      // return response.data;
      
      // Mock for now if API is not ready, or return null
      return null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.role = action.payload?.role || null;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
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
      });
  },
});

export const { setUser, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
