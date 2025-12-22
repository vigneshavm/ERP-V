import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LaborState, Employee, Attendance, LaborPayment } from '../types/hr';


import { APP_CONFIG } from '../../config';
import { MOCK_EMPLOYEES, MOCK_LABOR_PAYMENTS } from '../../mockData';
import { loadState, saveState } from './storage';

const initialLaborState: LaborState = {
  employees: APP_CONFIG.IS_DEMO ? MOCK_EMPLOYEES : [],
  attendance: [],
  payments: APP_CONFIG.IS_DEMO ? MOCK_LABOR_PAYMENTS : [],
};

const laborSlice = createSlice({
  name: 'labor',
  initialState: loadState('labor_v2', initialLaborState),
  reducers: {
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload);
      saveState('labor', state);
    },
    markAttendance: (state, action: PayloadAction<Attendance>) => {
      // Remove existing for same day/person if any
      state.attendance = state.attendance.filter(a => !(a.employeeId === action.payload.employeeId && a.date === action.payload.date));
      state.attendance.push(action.payload);
      saveState('labor', state);
    },
    addLaborPayment: (state, action: PayloadAction<LaborPayment>) => {
      state.payments.push(action.payload);
      saveState('labor', state);
    }
  },
});

export const { addEmployee, markAttendance, addLaborPayment } = laborSlice.actions;
export default laborSlice.reducer;
