import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LaborState, Employee, Attendance, LaborPayment } from "../../types/hr";
import { AttendanceStatus } from "../../types/common";
import api from "../../services/api";
import { RootState } from '../store';

// Simple storage mock (since we are removing dependency on root storage.ts)
const _loadState = (key: string, initialState: any) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialState;
};

const initialLaborState: LaborState = {
    employees: [],
    attendance: [],
    payments: [],
    attendanceLoading: false,
    attendanceError: null,
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

// Hydrates attendance for the month currently shown on the Staff Management
// calendar. Backed by real persistence (DailyAttendance in MongoDB) instead
// of only living in Redux, so it survives a refresh/logout.
export const fetchAttendance = createAsyncThunk(
    'labor/fetchAttendance',
    async ({ month, year, employeeId }: { month: number; year: number; employeeId?: string }, thunkAPI) => {
        try {
            const params: Record<string, any> = { month, year };
            if (employeeId) params.employeeId = employeeId;
            const response = await api.get('/api/hr/attendance', { params });
            return response.data.data as Attendance[];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
        }
    }
);

// Saves/upserts one employee's attendance for a single date via PUT /api/hr/attendance
export const saveAttendance = createAsyncThunk(
    'labor/saveAttendance',
    async (data: { employeeId: string; date: string; status: AttendanceStatus; inTime?: string; outTime?: string; advanceTaken?: number }, thunkAPI) => {
        try {
            const response = await api.put('/api/hr/attendance', data);
            return response.data.data as Attendance;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
        }
    }
);

// Marks one employee's attendance for a single date (calendar day-click -> TimeEntryModal).
export const markAttendanceAction = createAsyncThunk(
    'labor/markAttendanceAction',
    async (data: { employeeId: string; date: string; status: AttendanceStatus; inTime?: string; outTime?: string }, thunkAPI) => {
        try {
            const response = await api.post('/api/hr/attendance', data);
            return response.data.data as Attendance;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
        }
    }
);

// Marks one employee's attendance across multiple dates at once (calendar multi-select bulk actions).
export const bulkMarkAttendanceAction = createAsyncThunk(
    'labor/bulkMarkAttendanceAction',
    async (data: { employeeId: string; dates: string[]; status: AttendanceStatus }, thunkAPI) => {
        try {
            const response = await api.post('/api/hr/attendance/bulk', data);
            return response.data.data as Attendance[];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
        }
    }
);

export const updateEmployee = createAsyncThunk(
    'labor/updateEmployee',
    async ({ id, data }: { id: string; data: Partial<Employee> }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;

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

export const deactivateEmployee = createAsyncThunk(
    'labor/deactivateEmployee',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/api/hr/employees/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to deactivate employee');
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
            })
            .addCase(fetchAttendance.pending, (state) => {
                state.attendanceLoading = true;
                state.attendanceError = null;
            })
            .addCase(fetchAttendance.fulfilled, (state, action) => {
                state.attendanceLoading = false;
                state.attendanceError = null;
                state.attendance = action.payload;
            })
            .addCase(fetchAttendance.rejected, (state, action) => {
                state.attendanceLoading = false;
                state.attendanceError = (action.payload as string) || 'Failed to fetch attendance';
            })
            .addCase(saveAttendance.fulfilled, (state, action) => {
                const saved = action.payload;
                state.attendance = state.attendance.filter((a: Attendance) => !(a.employeeId === saved.employeeId && a.date === saved.date));
                state.attendance.push(saved);
            })
            .addCase(markAttendanceAction.fulfilled, (state, action) => {
                const saved = action.payload;
                state.attendance = state.attendance.filter((a: Attendance) => !(a.employeeId === saved.employeeId && a.date === saved.date));
                state.attendance.push(saved);
            })
            .addCase(bulkMarkAttendanceAction.fulfilled, (state, action) => {
                const saved = action.payload;
                const savedKeys = new Set(saved.map((s: Attendance) => `${s.employeeId}_${s.date}`));
                state.attendance = state.attendance.filter((a: Attendance) => !savedKeys.has(`${a.employeeId}_${a.date}`));
                state.attendance.push(...saved);
            })
            .addCase(deactivateEmployee.fulfilled, (state, action) => {
                const id = action.payload;
                state.employees = state.employees.filter((e: Employee) => e.id !== id && e._id !== id);
            });
    }
});

export const { addEmployee, markAttendance, addLaborPayment, setEmployees, setLaborPayments } = laborSlice.actions;
export default laborSlice.reducer;
