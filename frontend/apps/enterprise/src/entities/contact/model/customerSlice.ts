import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { Customer } from "@repo/shared";

const API_URL = "/customers";

// Get token from state
const getConfig = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

interface CustomerState {
  customers: Customer[];
  customer: Customer | null;
  transactions: any[]; // Define a stricter type if available, e.g., Transaction[]
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string | any;
}

const initialState: CustomerState = {
  customers: [],
  customer: null,
  transactions: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all customers
export const getAllCustomers = createAsyncThunk(
  'customers/getAll',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(API_URL, getConfig(token));
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

// Get customer by ID
export const getCustomerById = createAsyncThunk(
  'customers/getById',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/${id}`, getConfig(token));
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

// Add customer
export const addCustomer = createAsyncThunk(
  'customers/add',
  async (customerData: Partial<Customer>, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.post(API_URL, customerData, getConfig(token));
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

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, customerData }: { id: string; customerData: Partial<Customer> }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.put(
        `${API_URL}/${id}`,
        customerData,
        getConfig(token)
      );
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

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
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

// Get customer transactions
export const getCustomerTransactions = createAsyncThunk(
  'customers/getTransactions',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(
        `${API_URL}/${id}/transactions`,
        getConfig(token)
      );
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

export const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCustomer: (state) => {
      state.customer = null;
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all customers
      .addCase(getAllCustomers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCustomers.fulfilled, (state, action: PayloadAction<Customer[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = action.payload;
      })
      .addCase(getAllCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer by ID
      .addCase(getCustomerById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerById.fulfilled, (state, action: PayloadAction<Customer>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customer = action.payload;
      })
      .addCase(getCustomerById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCustomer.fulfilled, (state, action: PayloadAction<Customer>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers.push(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action: PayloadAction<Customer>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = state.customers.map((customer) =>
          customer._id === action.payload._id ? action.payload : customer
        );
        state.customer = action.payload;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = state.customers.filter(
          (customer) => customer._id !== action.payload
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer transactions
      .addCase(getCustomerTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerTransactions.fulfilled, (state, action: PayloadAction<{ transactions: any[] }>) => { // Adjust payload type as needed
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = action.payload.transactions || [];
      })
      .addCase(getCustomerTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearCustomer } = customerSlice.actions;
export default customerSlice.reducer;
