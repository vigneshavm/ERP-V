import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../store';

// Types
export interface SalaryComponent {
    _id: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    calculationType: 'FLAT' | 'PERCENTAGE';
    defaultValue: number;
    isTaxable: boolean;
    isActive: boolean;
}

export interface SalaryStructure {
    _id: string;
    employeeId: string;
    components: {
        componentId: string | SalaryComponent; // Populated or ID
        amount: number;
    }[];
    effectiveFrom: string;
    isActive: boolean;
}

export interface PayrollRun {
    _id: string;
    periodStart: string;
    periodEnd: string;
    totalAmount: number;
    status: 'DRAFT' | 'APPROVED' | 'PAID';
    processedDate: string;
    createdAt: string;
    month?: number; // Optional for backward compat
    year?: number;  // Optional for backward compat
    totalPayout?: number; // Optional alias
    runDate?: string; // Optional alias
}

export interface AttendanceSummary {
    _id: string;
    employeeId: string | any; // Populated
    month: number;
    year: number;
    workedDays: number;
    leavesTaken: number;
    overtimeHours: number;
    notes?: string;
    totalDays: number;
    holidays: number;
    weeklyOffs: number;
    paidLeaves: number;
}

interface PayrollState {
    components: SalaryComponent[];
    structures: Record<string, SalaryStructure>; // employeeId -> Structure
    attendance: AttendanceSummary[]; // Current loaded summary
    runs: PayrollRun[];
    currentRun: any | null; // Detailed run
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: PayrollState = {
    components: [],
    structures: {},
    attendance: [],
    runs: [],
    currentRun: null,
    loading: false,
    error: null,
    success: false
};

const API_URL = '/api/hr/payroll'; // Based on hr.routes.ts mounting

// Helpers
const getConfig = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
});

// Thunks

export const fetchSalaryComponents = createAsyncThunk(
    'payroll/fetchComponents',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/components`, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch components');
        }
    }
);

export const createSalaryComponent = createAsyncThunk(
    'payroll/createComponent',
    async (data: Partial<SalaryComponent>, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/components`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create component');
        }
    }
);

export const updateSalaryComponent = createAsyncThunk(
    'payroll/updateComponent',
    async ({ id, data }: { id: string, data: Partial<SalaryComponent> }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/components/${id}`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update component');
        }
    }
);

export const deleteSalaryComponent = createAsyncThunk(
    'payroll/deleteComponent',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            await api.delete(`${API_URL}/components/${id}`, getConfig(token));
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete component');
        }
    }
);

export const fetchSalaryStructure = createAsyncThunk(
    'payroll/fetchStructure',
    async (employeeId: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/structures/${employeeId}`, getConfig(token));
            return { employeeId, structure: response.data.data };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch structure');
        }
    }
);

export const fetchAllSalaryStructures = createAsyncThunk(
    'payroll/fetchAllStructures',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/structures`, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch all structures');
        }
    }
);

export const saveSalaryStructure = createAsyncThunk(
    'payroll/saveStructure',
    async (data: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/structures`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save structure');
        }
    }
);

export const bulkUpdateSalaryStructure = createAsyncThunk(
    'payroll/bulkUpdateStructure',
    async (data: { componentId: string, amount: number }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/structures/bulk`, data, getConfig(token)); // Corrected route
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to bulk update structure');
        }
    }
);

export const fetchPayrollRuns = createAsyncThunk(
    'payroll/fetchRuns',
    async (_, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/runs`, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch runs');
        }
    }
);




export const generatePayrollRun = createAsyncThunk(
    'payroll/generate',
    async (data: { month: number, year: number }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/runs`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to generate payroll');
        }
    }
);

export const approvePayroll = createAsyncThunk(
    'payroll/approve',
    async (id: string, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.put(`${API_URL}/runs/${id}/approve`, {}, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to approve payroll');
        }
    }
);

export const payPayroll = createAsyncThunk(
    'payroll/pay',
    async ({ id, accountId, paymentMode }: { id: string; accountId: string; paymentMode: string }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/runs/${id}/pay`, { accountId, paymentMode }, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to pay payroll');
        }
    }
);


export const processIndividualPayout = createAsyncThunk(
    'payroll/processIndividualPayout',
    async (data: { employeeId: string, month: number, year: number, paymentMode: string, accountId: string, overrideWorkedDays?: number, force?: boolean }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/payout`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to process payout');
        }
    }
);

export const fetchAttendanceSummary = createAsyncThunk(
    'payroll/fetchAttendance',
    async ({ month, year }: { month: number; year: number }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.get(`${API_URL}/attendance?month=${month}&year=${year}`, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
        }
    }
);

export const saveAttendanceSummary = createAsyncThunk(
    'payroll/saveAttendance',
    async (data: any, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as RootState;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");
            const response = await api.post(`${API_URL}/attendance`, data, getConfig(token));
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
        }
    }
);

const payrollSlice = createSlice({
    name: 'payroll',
    initialState,
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Components
            .addCase(fetchSalaryComponents.fulfilled, (state, action) => {
                state.components = action.payload;
            })
            .addCase(createSalaryComponent.fulfilled, (state, action) => {
                state.components.push(action.payload);
            })
            .addCase(updateSalaryComponent.fulfilled, (state, action) => {
                const index = state.components.findIndex(c => c._id === action.payload._id);
                if (index >= 0) state.components[index] = action.payload;
            })
            .addCase(deleteSalaryComponent.fulfilled, (state, action) => {
                state.components = state.components.filter(c => c._id !== action.payload);
            })
            // Structure
            .addCase(fetchSalaryStructure.fulfilled, (state, action) => {
                if (action.payload.structure) {
                    state.structures[action.payload.employeeId] = action.payload.structure;
                }
            })
            .addCase(fetchAllSalaryStructures.fulfilled, (state, action: PayloadAction<SalaryStructure[]>) => {
                const newStructures: Record<string, SalaryStructure> = {};
                action.payload.forEach(s => {
                    newStructures[s.employeeId] = s;
                });
                state.structures = newStructures;
            })
            .addCase(saveSalaryStructure.fulfilled, (state, action) => {
                state.structures[action.payload.employeeId] = action.payload;
                state.success = true;
            })
            // Runs
            .addCase(fetchPayrollRuns.pending, (state) => { state.loading = true; })
            .addCase(fetchPayrollRuns.fulfilled, (state, action) => {
                state.loading = false;
                state.runs = action.payload;
            })
            .addCase(fetchPayrollRuns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Generate
            .addCase(generatePayrollRun.pending, (state) => {
                state.loading = true;
                state.success = false;
            })
            .addCase(generatePayrollRun.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.runs.unshift(action.payload);
            })
            .addCase(generatePayrollRun.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Approve
            .addCase(approvePayroll.pending, (state) => { state.loading = true; })
            .addCase(approvePayroll.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.runs.findIndex(r => r._id === action.payload._id);
                if (index >= 0) state.runs[index] = action.payload;
                if (state.currentRun && state.currentRun._id === action.payload._id) {
                    state.currentRun = action.payload;
                }
            })
            // Pay
            .addCase(payPayroll.pending, (state) => { state.loading = true; })
            .addCase(payPayroll.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.runs.findIndex(r => r._id === action.payload._id);
                if (index >= 0) state.runs[index] = action.payload;
                if (state.currentRun && state.currentRun._id === action.payload._id) {
                    state.currentRun = action.payload;
                }
            })
            // Attendance
            .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
                state.attendance = action.payload;
            })
            .addCase(saveAttendanceSummary.fulfilled, (state, action) => {
                const index = state.attendance.findIndex(a => a._id === action.payload._id);
                if (index >= 0) {
                    state.attendance[index] = action.payload;
                } else {
                    state.attendance.push(action.payload);
                }
                state.success = true;
            });
    }
});

export const { resetStatus } = payrollSlice.actions;
export default payrollSlice.reducer;
