import { Sector, Branch, SystemRole, AttendanceStatus } from './common';

export interface Employee {
    id: string;
    name: string;
    role: string; // Job Title (e.g. Cashier)
    systemRole: SystemRole; // App Permission Level
    pin: string;
    dailyRate: number;
    sector: Sector;
    branchId: Branch;
    tenantId?: string;
}

export interface LaborPayment {
    id: string;
    employeeId: string;
    amount: number;
    date: string;
    type: 'SALARY' | 'ADVANCE';
    note?: string;
}

export interface DailyLog {
    status: AttendanceStatus;
    inTime: string;
    outTime: string;
    duration: number;
}

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    advanceTaken?: number;
    inTime?: string;
    outTime?: string;
}

// Redux State Interface
export interface LaborState {
    employees: Employee[];
    attendance: Attendance[];
    payments: LaborPayment[];
}
