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

export const updateEmployee = createAsyncThunk(
    'labor/updateEmployee',
    async ({ id, data }: { id: string; data: Partial<Employee> }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;

            // Assuming the endpoint for updating any user (as admin) is /api/users/:id
            // If it's specifically for labor/employees, it might be /api/labor/:id
            // Using /api/users/:id as a safe bet based on authSlice
            const response = await api.put(`/api/users/${id}`, data, {
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
    initialState: loadState('labor_v2', initialLaborState),
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
        builder
            .addCase(updateEmployee.fulfilled, (state, action) => {
                const index = state.employees.findIndex((e: Employee) => e.id === action.meta.arg.id || e._id === action.meta.arg.id);
                if (index !== -1) {
                    state.employees[index] = { ...state.employees[index], ...action.meta.arg.data };
                }
            });
    }
});

export const { addEmployee, markAttendance, addLaborPayment, setEmployees, setLaborPayments } = laborSlice.actions;
export default laborSlice.reducer;
