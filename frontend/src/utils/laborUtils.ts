import { Attendance, LaborPayment } from '../types/hr';

export interface LaborStats {
    days: number;
    full: number;
    half: number;
    quarter: number;
    absent: number;
    earned: number;
    paid: number;
    balance: number;
    totalPaid: number;
}

/**
 * Calculates labor statistics for a specific month and all-time balance.
 */
export const calculateLaborStats = (
    employeeId: string,
    dailyRate: number,
    attendance: Attendance[],
    payments: LaborPayment[],
    currentYear: number,
    currentMonth: number
): LaborStats => {
    const empAttendance = attendance.filter(a => a.employeeId === employeeId);
    const empPayments = payments.filter(p => p.employeeId === employeeId);

    // Monthly stats
    let monthDaysCount = 0;
    let full = 0;
    let half = 0;
    let quarter = 0;
    let absent = 0;
    let monthlyAdvance = 0;

    // All time stats
    let allTimeDays = 0;
    let allTimeAdvances = 0;

    empAttendance.forEach(log => {
        const logDate = new Date(log.date);
        const isCurrentMonth = logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;

        let d = 0;
        if (log.status === 'PRESENT') d = 1;
        else if (log.status === 'HALF') d = 0.5;
        else if (log.status === 'QUARTER') d = 0.25;

        allTimeDays += d;
        allTimeAdvances += (log.advanceTaken || 0);

        if (isCurrentMonth) {
            monthDaysCount += d;
            monthlyAdvance += (log.advanceTaken || 0);
            if (log.status === 'PRESENT') full++;
            else if (log.status === 'HALF') half++;
            else if (log.status === 'QUARTER') quarter++;
            else if (log.status === 'ABSENT') absent++;
        }
    });

    const totalEarnedInMonth = monthDaysCount * dailyRate;

    const monthlyPayments = empPayments.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    const totalPaidInMonth = monthlyPayments.reduce((sum, p) => sum + p.amount, 0) + monthlyAdvance;

    const allTimeEarned = allTimeDays * dailyRate;
    const allTimePayments = empPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAllTime = allTimePayments + allTimeAdvances;
    const balance = allTimeEarned - totalPaidAllTime;

    return {
        days: monthDaysCount,
        full,
        half,
        quarter,
        absent,
        earned: totalEarnedInMonth,
        paid: totalPaidInMonth,
        balance,
        totalPaid: totalPaidAllTime
    };
};

/**
 * Converts monthly salary to daily wage based on 30 days.
 */
export const convertMonthlyToDailyWage = (monthlySalary: number | string): number => {
    const monthly = typeof monthlySalary === 'string' ? parseFloat(monthlySalary) : monthlySalary;
    if (isNaN(monthly)) return 0;
    return Math.round(monthly / 30);
};

/**
 * Generates the payload for inserting a new laborer into Supabase.
 */
export const generateLaborerPayload = (params: {
    tenantId: string | null;
    name: string;
    roleId: string | null;
    dailyRate: number;
    mobile: string;
    hashedPin: string;
    branchId: string | null;
}) => {
    return {
        tenant_id: params.tenantId,
        full_name: params.name,
        role_id: params.roleId,
        daily_rate: params.dailyRate,
        mobile: params.mobile,
        system_role: 'Staff',
        is_active: true,
        password_hash: null,
        pin_hash: params.hashedPin,
        assigned_branch_id: params.branchId
    };
};

/**
 * Maps Supabase response back to the application's Employee type.
 */
export const mapDbUserToEmployee = (dbUser: any, fallbackRole: string, currentSector: string): any => {
    return {
        id: dbUser.id,
        name: dbUser.full_name,
        role: dbUser.role?.description || dbUser.role?.code || fallbackRole,
        roleId: dbUser.role_id,
        dailyRate: dbUser.daily_rate || 0,
        sector: currentSector,
        branchId: dbUser.assigned_branch_id,
        systemRole: 'Staff',
        pin: dbUser.pin_hash || '',
        mobile: dbUser.mobile,
        tenantId: dbUser.tenant_id
    };
};
