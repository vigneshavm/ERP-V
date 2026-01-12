import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LaborState, Employee, Attendance, LaborPayment } from '../types/hr';


import { APP_CONFIG } from '../config';

import { loadState, saveState } from './storage';

const initialLaborState: LaborState = {
  employees: [],
  attendance: [],
  payments: [],
};

const laborSlice = createSlice({
  name: 'labor',
  initialState: loadState('labor_v2', initialLaborState),
  reducers: {
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload);
    },
    markAttendance: (state, action: PayloadAction<Attendance>) => {
      // Remove existing for same day/person if any
      state.attendance = state.attendance.filter(a => !(a.employeeId === action.payload.employeeId && a.date === action.payload.date));
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
});

export const { addEmployee, markAttendance, addLaborPayment, setEmployees, setLaborPayments } = laborSlice.actions;
export default laborSlice.reducer;
