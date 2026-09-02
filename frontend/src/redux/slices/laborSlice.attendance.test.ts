import { describe, it, expect, beforeEach } from 'vitest';
import laborReducer, {
    fetchAttendance,
    saveAttendance,
    bulkMarkAttendanceAction
} from './laborSlice';
import { LaborState, Attendance } from '../../types/hr';

describe('Labor Slice Attendance Async Thunks & Reducers (ATT-TAB-001 to ATT-TAB-015)', () => {
    let initialState: LaborState;

    beforeEach(() => {
        initialState = {
            employees: [
                {
                    id: 'emp-101',
                    name: 'Alice',
                    role: 'Staff',
                    systemRole: 'Staff' as any,
                    mobile: '9876543210',
                    dailyRate: 500,
                    wageType: 'DAILY',
                    tenantId: 'tenant-1',
                    branchId: 'main' as any,
                    isActive: true
                },
                {
                    id: 'emp-102',
                    name: 'Bob',
                    role: 'Staff',
                    systemRole: 'Staff' as any,
                    mobile: '9876543211',
                    dailyRate: 600,
                    wageType: 'DAILY',
                    tenantId: 'tenant-1',
                    branchId: 'main' as any,
                    isActive: true
                }
            ],
            attendance: [],
            payments: [],
            attendanceLoading: false,
            attendanceError: null
        };
    });

    it('ATT-TAB-001 & ATT-TAB-009: fetchAttendance.pending sets loading=true, fulfilled sets data and clears loading', () => {
        const pendingState = laborReducer(initialState, fetchAttendance.pending('', { month: 7, year: 2026, employeeId: 'emp-101' }));
        expect(pendingState.attendanceLoading).toBe(true);
        expect(pendingState.attendanceError).toBeNull();

        const fetchedData: Attendance[] = [
            { id: 'att-1', employeeId: 'emp-101', date: '2026-08-15', status: 'PRESENT' }
        ];

        const fulfilledState = laborReducer(pendingState, fetchAttendance.fulfilled(fetchedData, '', { month: 7, year: 2026, employeeId: 'emp-101' }));
        expect(fulfilledState.attendanceLoading).toBe(false);
        expect(fulfilledState.attendanceError).toBeNull();
        expect(fulfilledState.attendance).toEqual(fetchedData);
    });

    it('ATT-TAB-008: fetchAttendance.rejected sets attendanceError WITHOUT wiping existing attendance array', () => {
        const existingAttendance: Attendance[] = [
            { id: 'att-1', employeeId: 'emp-101', date: '2026-08-15', status: 'PRESENT' }
        ];
        const stateWithData: LaborState = {
            ...initialState,
            attendance: existingAttendance
        };

        const rejectedState = laborReducer(
            stateWithData,
            fetchAttendance.rejected(new Error('Network error'), '', { month: 7, year: 2026 }, 'Server unavailable')
        );

        expect(rejectedState.attendanceLoading).toBe(false);
        expect(rejectedState.attendanceError).toBe('Server unavailable');
        // Crucial check: existing data is preserved so user doesn't see false empty
        expect(rejectedState.attendance).toEqual(existingAttendance);
    });

    it('ATT-TAB-010 & ATT-TAB-011: saveAttendance.fulfilled upserts record into Redux attendance state', () => {
        const initialRecord: Attendance = { id: 'att-1', employeeId: 'emp-101', date: '2026-08-15', status: 'PRESENT' };
        const stateWithData = laborReducer(initialState, fetchAttendance.fulfilled([initialRecord], '', { month: 7, year: 2026 }));

        const updatedRecord: Attendance = { id: 'att-1', employeeId: 'emp-101', date: '2026-08-15', status: 'HALF', inTime: '09:00', outTime: '13:00' };
        const nextState = laborReducer(stateWithData, saveAttendance.fulfilled(updatedRecord, '', {
            employeeId: 'emp-101',
            date: '2026-08-15',
            status: 'HALF'
        }));

        expect(nextState.attendance.length).toBe(1);
        expect(nextState.attendance[0].status).toBe('HALF');
        expect(nextState.attendance[0].inTime).toBe('09:00');
    });

    it('ATT-TAB-012: bulkMarkAttendanceAction.fulfilled updates multiple dates at once', () => {
        const bulkRecords: Attendance[] = [
            { id: 'att-1', employeeId: 'emp-101', date: '2026-08-01', status: 'PRESENT' },
            { id: 'att-2', employeeId: 'emp-101', date: '2026-08-02', status: 'PRESENT' },
            { id: 'att-3', employeeId: 'emp-101', date: '2026-08-03', status: 'PRESENT' }
        ];

        const nextState = laborReducer(initialState, bulkMarkAttendanceAction.fulfilled(bulkRecords, '', {
            employeeId: 'emp-101',
            dates: ['2026-08-01', '2026-08-02', '2026-08-03'],
            status: 'PRESENT'
        }));

        expect(nextState.attendance.length).toBe(3);
        expect(nextState.attendance.map(a => a.date)).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
    });

    it('ATT-TAB-005 & ATT-TAB-015: Changing employee replaces attendance state with new employee data', () => {
        const empAData: Attendance[] = [{ id: 'att-1', employeeId: 'emp-101', date: '2026-08-01', status: 'PRESENT' }];
        const stateEmpA = laborReducer(initialState, fetchAttendance.fulfilled(empAData, '', { month: 7, year: 2026, employeeId: 'emp-101' }));

        const empBData: Attendance[] = [{ id: 'att-2', employeeId: 'emp-102', date: '2026-08-01', status: 'ABSENT' }];
        const stateEmpB = laborReducer(stateEmpA, fetchAttendance.fulfilled(empBData, '', { month: 7, year: 2026, employeeId: 'emp-102' }));

        expect(stateEmpB.attendance).toEqual(empBData);
        expect(stateEmpB.attendance.find(a => a.employeeId === 'emp-101')).toBeUndefined();
    });
});
