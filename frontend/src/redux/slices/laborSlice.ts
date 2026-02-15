import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LaborState, Employee, Attendance, LaborPayment } from "../../types/hr";
import api from "../../services/api";
import { RootState } from '../store';

// Simple storage mock (since we are removing dependency on root storage.ts)
const loadState = (key: string, initialState: any) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialState;
};

const initialLaborState: LaborState = {
    employees: [],
    attendance: [],
    payments: [],
};

export const fetchAdvances = createAsyncThunk(
    'labor/fetchAdvances',
    async (employeeId: string | undefined, thunkAPI) => {
        try {
            const url = employeeId ? `/api/hr/advances/employee/${employeeId}` : '/api/hr/advances';
            const response = await api.get(url);
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch advances');
        }
    }
);

export const createAdvanceAction = createAsyncThunk(
    'labor/createAdvance',
    async (data: { employeeId: string; amount: number; type: string; notes?: string }, thunkAPI) => {
        try {
            const response = await api.post('/api/hr/advances', data);
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to record advance');
        }
    }
);

export const updateEmployee = createAsyncThunk(
    'labor/updateEmployee',
    async ({ id, data }: { id: string; data: Partial<Employee> }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;

            // Assuming the endpoint for updating any user (as admin) is /api/users/:id
            // If it's specifically for labor/employees, it might be /api/labor/:id
            // Using /api/users/:id as a safe bet based on authSlice
            const response = await api.put(`/api/hr/employees/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
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

const laborSlice = createSlice({
    name: 'labor',
    initialState: initialLaborState,
    reducers: {
        addEmployee: (state, action: PayloadAction<Employee>) => {
            state.employees.push(action.payload);
        },
        markAttendance: (state, action: PayloadAction<Attendance>) => {
            // Remove existing for same day/person if any
            state.attendance = state.attendance.filter((a: Attendance) => !(a.employeeId === action.payload.employeeId && a.date === action.payload.date));
            state.attendance.push(action.payload);
        },
        addLaborPayment: (state, action: PayloadAction<LaborPayment>) => {
            state.payments.push(action.payload);
        },
        setEmployees: (state, action: PayloadAction<Employee[]>) => {
            state.employees = action.payload;
        },
        setLaborPayments: (state, action: PayloadAction<LaborPayment[]>) => {
            state.payments = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(updateEmployee.fulfilled, (state, action) => {
            const index = state.employees.findIndex((e: Employee) => e.id === action.meta.arg.id || e._id === action.meta.arg.id);
            if (index !== -1) {
                state.employees[index] = { ...state.employees[index], ...action.meta.arg.data };
            }
        })
            .addCase(fetchAdvances.fulfilled, (state, action) => {
                state.payments = action.payload.map((p: any) => ({
                    id: p._id,
                    employeeId: p.employeeId?._id || p.employeeId,
                    amount: p.amount,
                    date: p.date,
                    type: p.type,
                    note: p.notes
                }));
            })
            .addCase(createAdvanceAction.fulfilled, (state, action) => {
                const p = action.payload;
                state.payments.unshift({
                    id: p._id,
                    employeeId: p.employeeId,
                    amount: p.amount,
                    date: p.date,
                    type: p.type,
                    note: p.notes
                });
            }
            );
    }
});

export const { addEmployee, markAttendance, addLaborPayment, setEmployees, setLaborPayments } = laborSlice.actions;
export default laborSlice.reducer;
