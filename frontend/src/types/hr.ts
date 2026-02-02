import { Sector, BranchId, SystemRole, AttendanceStatus } from './common';

export interface Employee {
    id: string;
    _id?: string;
    name: string;
    role: string;
    systemRole: SystemRole;
    mobile: string; // Backend uses mobile
    dailyRate: number;
    wageType: 'DAILY' | 'MONTHLY';
    tenantId: string;
    branchId: BranchId;
    isActive: boolean;
    createdAt?: string;

    // Frontend/Legacy fields - checking if we need them
    pin?: string;
    pin_hash?: string;
    password_hash?: string;
    sector?: Sector;
    assignedCounterId?: string;
    roleId?: string;
    joinedDate?: string;
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
