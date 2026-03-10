import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { RootState } from '../store';

const API_URL = "/api/expenses";

export interface Expense {
    _id: string;
    expenseNo: string;
    date: string;
    category: string;
    amount: number;
    paymentMethod: string;
    bankAccount?: string;
    description?: string;
    receipt?: string;
}

interface ExpenseState {
    expenses: Expense[];
    expense: Expense | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: ExpenseState = {
    expenses: [],
    expense: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get all expenses
export const getAllExpenses = createAsyncThunk<Expense[], void, { state: RootState }>(
    'expense/getAll',
    async (_, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).auth.user.token;
            const response = await api.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
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

// Create expense
export const createExpense = createAsyncThunk<Expense, Partial<Expense>, { state: RootState }>(
    'expense/create',
    async (expenseData, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).auth.user.token;
            const response = await api.post(API_URL, expenseData, {
                headers: { Authorization: `Bearer ${token}` },
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

// Get expense by ID
export const getExpenseById = createAsyncThunk<Expense, string, { state: RootState }>(
    'expense/getById',
    async (id, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).auth.user.token;
            const response = await api.get(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
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

// Update expense
export const updateExpense = createAsyncThunk<Expense, { id: string; expenseData: Partial<Expense> }, { state: RootState }>(
    'expense/update',
    async ({ id, expenseData }, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).auth.user.token;
            const response = await api.put(`${API_URL}/${id}`, expenseData, {
                headers: { Authorization: `Bearer ${token}` },
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

// Delete expense
export const deleteExpense = createAsyncThunk<string, string, { state: RootState }>(
    'expense/delete',
    async (id, thunkAPI) => {
        try {
            const token = (thunkAPI.getState() as any).auth.user.token;
            await api.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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

export const expenseSlice = createSlice({
    name: 'expense',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearExpense: (state) => {
            state.expense = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllExpenses.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllExpenses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenses = action.payload;
            })
            .addCase(getAllExpenses.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(createExpense.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createExpense.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenses.unshift(action.payload);
            })
            .addCase(createExpense.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getExpenseById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getExpenseById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expense = action.payload;
            })
            .addCase(getExpenseById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateExpense.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateExpense.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.expenses.findIndex(exp => exp._id === action.payload._id);
                if (index !== -1) {
                    state.expenses[index] = action.payload;
                }
            })
            .addCase(updateExpense.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteExpense.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteExpense.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.expenses = state.expenses.filter((exp) => exp._id !== action.payload);
            })
            .addCase(deleteExpense.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearExpense } = expenseSlice.actions;
export default expenseSlice.reducer;
