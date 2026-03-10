import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";

const API_URL = "/reports";

// Get token from state
const getConfig = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

interface ReportsState {
  salesReport: any | null; // Define specific Report types if/when available
  stockReport: any | null;
  customerReport: any | null;
  dashboardStats: any | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string | any;
}

const initialState: ReportsState = {
  salesReport: null,
  stockReport: null,
  customerReport: null,
  dashboardStats: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get sales report
export const getSalesReport = createAsyncThunk(
  'reports/getSales',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const token = state.auth.user?.token;
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/sales`, getConfig(token));
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

// Get stock report
export const getStockReport = createAsyncThunk(
  'reports/getStock',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const token = state.auth.user?.token;
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/stock`, getConfig(token));
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

// Get customer report
export const getCustomerReport = createAsyncThunk(
  'reports/getCustomers',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const token = state.auth.user?.token;
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/customers`, getConfig(token));
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

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
  'reports/getDashboardStats',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const token = state.auth.user?.token;
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/dashboard-stats`, getConfig(token));
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

export const reportsSlice = createSlice({
  name: 'reports',
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
      // Get sales report
      .addCase(getSalesReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesReport = action.payload;
      })
      .addCase(getSalesReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get stock report
      .addCase(getStockReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStockReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stockReport = action.payload;
      })
      .addCase(getStockReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer report
      .addCase(getCustomerReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customerReport = action.payload;
      })
      .addCase(getCustomerReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get dashboard stats
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardStats = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = reportsSlice.actions;
export default reportsSlice.reducer;