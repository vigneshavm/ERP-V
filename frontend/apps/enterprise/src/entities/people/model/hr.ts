import { Sector, BranchId, SystemRole, AttendanceStatus } from '@repo/shared';

export interface Employee {
    id: string;
    _id?: string;
    name: string;
    role: string;
    roleId?: string;
    systemRole: SystemRole;
    mobile: string;
    dailyRate: number;
    hourlyRate?: number;
    baseSalary?: number;
    wageType: 'DAILY' | 'MONTHLY' | 'HOURLY' | 'COMMISSION' | 'HYBRID';
    tenantId: string;
    branchId: BranchId;
    isActive: boolean;
    joinedDate?: string;
    email?: string;
    bankDetails?: {
        accountNumber: string;
        ifsc: string;
        bankName: string;
    };
    createdAt?: string;
    updatedAt?: string;

    // UI specific
    pin?: string;
    sector?: Sector;
}

export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'OTHER' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
    id: string;
    _id?: string;
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: LeaveStatus;
    approvedBy?: string;
    approvalDate?: string;
    rejectionReason?: string;
}

export interface Holiday {
    id: string;
    _id?: string;
    name: string;
    date: string;
    description?: string;
    type: 'PUBLIC' | 'OPTIONAL' | 'INTERNAL';
    isActive: boolean;
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
    leaves: LeaveRequest[];
    holidays: Holiday[];
}
