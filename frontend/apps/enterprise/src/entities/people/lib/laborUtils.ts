/**
 * Labor utility functions
 * Migrated from utils/laborUtils to FSD: entities/people/lib/laborUtils
 */

import type { Sector, SystemRole } from '@repo/shared';

// ── Types ───────────────────────────────────────────────────
export interface Employee {
    id: string;
    tenantId: string;
    name: string;
    role: string;
    roleId?: string;
    mobile?: string;
    dailyRate: number;
    wageType?: 'DAILY' | 'MONTHLY' | 'HOURLY';
    branchId?: string;
    sector: Sector;
    joinedDate?: string;
    isActive?: boolean;
    systemRole: SystemRole;
    pin: string;
}

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

// ── Functions ───────────────────────────────────────────────

/**
 * Converts monthly salary to daily wage (÷ 30)
 */
export const convertMonthlyToDailyWage = (monthlyInput: string | number): number => {
    const monthly = typeof monthlyInput === 'string' ? parseFloat(monthlyInput) : monthlyInput;
    if (isNaN(monthly) || monthly <= 0) return 0;
    return Math.round((monthly / 30) * 100) / 100;
};

/**
 * Calculates labor statistics for a given employee in a given month
 */
export const calculateLaborStats = (
    employeeId: string,
    dailyRate: number,
    attendance: any[],
    payments: any[],
    year: number,
    month: number
): LaborStats => {
    const monthAttendance = attendance.filter(
        (a: any) => {
            const d = new Date(a.date);
            return a.employeeId === employeeId &&
                d.getFullYear() === year &&
                d.getMonth() === month;
        }
    );

    let full = 0, half = 0, quarter = 0, absent = 0;
    monthAttendance.forEach((a: any) => {
        switch (a.status) {
            case 'PRESENT': full++; break;
            case 'HALF_DAY': half++; break;
            case 'QUARTER_DAY': quarter++; break;
            case 'ABSENT': absent++; break;
        }
    });

    const days = full + half + quarter;
    const earned = (full * dailyRate) + (half * dailyRate * 0.5) + (quarter * dailyRate * 0.25);

    const monthPayments = payments.filter(
        (p: any) => {
            const d = new Date(p.date || p.createdAt);
            return p.employeeId === employeeId &&
                d.getFullYear() === year &&
                d.getMonth() === month;
        }
    );
    const totalPaid = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return { days, full, half, quarter, absent, earned, paid: totalPaid, balance: earned - totalPaid, totalPaid };
};

/**
 * Generates a laborer payload for API submission
 */
export const generateLaborerPayload = (formData: any, sector: string, branch: string) => ({
    name: formData.name,
    role: formData.role || 'Staff',
    roleId: formData.roleId,
    mobile: formData.mobile,
    dailyRate: parseFloat(formData.dailyRate) || 0,
    wageType: formData.wageType || 'DAILY',
    branchId: branch,
    sector
});

/**
 * Maps a DB user record to the frontend Employee interface
 */
export const mapDbUserToEmployee = (dbUser: any, sector: string): Employee => ({
    id: dbUser._id || dbUser.id,
    tenantId: dbUser.tenantId,
    name: dbUser.name,
    role: dbUser.role,
    roleId: dbUser.roleId,
    mobile: dbUser.mobile,
    dailyRate: dbUser.dailyRate || 0,
    wageType: dbUser.wageType,
    branchId: dbUser.branchId,
    sector: sector as any,
    joinedDate: dbUser.createdAt,
    isActive: dbUser.isActive ?? true,
    systemRole: 'Staff' as any,
    pin: '****'
});

