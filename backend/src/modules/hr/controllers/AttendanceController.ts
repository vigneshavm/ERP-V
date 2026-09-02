import { Request, Response } from 'express';
import DailyAttendance, { IDailyAttendance } from '../models/DailyAttendance.js';

const FRONTEND_TO_BACKEND_STATUS: Record<string, string> = {
    'PRESENT': 'PRESENT',
    'ABSENT': 'ABSENT',
    'HALF': 'HALF_DAY',
    'HALF_DAY': 'HALF_DAY',
    'QUARTER': 'QUARTER',
    'ON_LEAVE': 'ON_LEAVE'
};

const BACKEND_TO_FRONTEND_STATUS: Record<string, string> = {
    'PRESENT': 'PRESENT',
    'ABSENT': 'ABSENT',
    'HALF': 'HALF',
    'HALF_DAY': 'HALF',
    'QUARTER': 'QUARTER',
    'ON_LEAVE': 'ON_LEAVE'
};

export const mapStatusToBackend = (status: string): string => FRONTEND_TO_BACKEND_STATUS[status] || status;
export const mapStatusToFrontend = (status: string): string => BACKEND_TO_FRONTEND_STATUS[status] || status;

// Shape returned to the frontend, matching the `Attendance` type in
// frontend/src/types/hr.ts: { id, employeeId, date, status, advanceTaken?, inTime?, outTime? }
// plus overtimeHours, which only the Daily Attendance Board reads.
const formatAttendance = (doc: IDailyAttendance) => ({
    id: doc._id.toString(),
    employeeId: doc.employeeId.toString(),
    date: doc.date.toISOString().slice(0, 10), // YYYY-MM-DD, matches formatDateISO()
    status: mapStatusToFrontend(doc.status),
    advanceTaken: doc.advanceTaken || 0,
    overtimeHours: doc.overtimeHours || 0,
    inTime: doc.checkInTime || undefined,
    outTime: doc.checkOutTime || undefined
});

// Parses a "YYYY-MM-DD" date-only string the same way formatDateISO() produces it
// (UTC midnight), so stored dates round-trip exactly instead of drifting a day
// depending on the server's local timezone.
const parseDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00.000Z`);

// Mark/update attendance for one employee on one date (used by the calendar's
// day-click -> TimeEntryModal flow).
export const markAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || (req as any).tenantId;
        const { employeeId, date, status, inTime, outTime, advanceTaken } = req.body;

        if (!employeeId || !date || !status) {
            return res.status(400).json({ success: false, message: "employeeId, date and status are required" });
        }

        const backendStatus = mapStatusToBackend(status);
        const update: Record<string, any> = { status: backendStatus };
        if (inTime !== undefined) update.checkInTime = inTime;
        if (outTime !== undefined) update.checkOutTime = outTime;
        if (advanceTaken !== undefined) update.advanceTaken = advanceTaken;

        const attendance = await DailyAttendance.findOneAndUpdate(
            { tenantId, employeeId, date: parseDateKey(date) },
            { $set: update },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, data: formatAttendance(attendance) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Marks the same status across multiple dates for one employee at once
// (the calendar's multi-select "Full/Half/Qtr/Abs" bulk actions).
export const bulkMarkAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || (req as any).tenantId;
        const { employeeId, dates, status } = req.body;

        if (!employeeId || !Array.isArray(dates) || dates.length === 0 || !status) {
            return res.status(400).json({ success: false, message: "employeeId, dates[] and status are required" });
        }

        const backendStatus = mapStatusToBackend(status);
        const parsedDates = dates.map((d: string) => parseDateKey(d));

        await DailyAttendance.bulkWrite(
            parsedDates.map((date) => ({
                updateOne: {
                    filter: { tenantId, employeeId, date },
                    update: { $set: { status: backendStatus as any } },
                    upsert: true
                }
            })) as any
        );

        const updated = await DailyAttendance.find({
            tenantId,
            employeeId,
            date: { $in: parsedDates }
        });

        res.status(200).json({ success: true, data: updated.map(formatAttendance) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Marks attendance for many employees on a single date at once (the Daily
// Attendance Board's "pick a date, mark everyone, save" flow). Shares the
// same DailyAttendance collection as markAttendance/bulkMarkAttendance, so
// this stays in sync with the per-employee calendar in Staff Management.
export const markAttendanceForDate = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || (req as any).tenantId;
        const { date, attendance } = req.body;

        if (!date || !Array.isArray(attendance) || attendance.length === 0) {
            return res.status(400).json({ success: false, message: "date and attendance[] are required" });
        }

        const parsedDate = parseDateKey(date);
        const employeeIds = attendance.map((entry: { employeeId: string }) => entry.employeeId);

        await DailyAttendance.bulkWrite(
            attendance.map((entry: { employeeId: string; status: string; overtimeHours?: number }) => ({
                updateOne: {
                    filter: { tenantId, employeeId: entry.employeeId as any, date: parsedDate },
                    update: { $set: { status: mapStatusToBackend(entry.status) as any, overtimeHours: entry.overtimeHours || 0 } },
                    upsert: true
                }
            })) as any
        );

        const updated = await DailyAttendance.find({
            tenantId,
            date: parsedDate,
            employeeId: { $in: employeeIds }
        });

        res.status(200).json({ success: true, data: updated.map(formatAttendance) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Returns attendance records for the tenant, either for one exact date
// (Daily Attendance Board: all employees on that day) or for a whole month
// (0-indexed, matching JS Date.getMonth() — Staff Management's calendar,
// hydrated whenever the displayed month changes). Optionally scoped to one
// employee either way.
export const getAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || (req as any).tenantId;
        const { month, year, date, employeeId } = req.query;

        const filter: Record<string, any> = { tenantId };

        if (date) {
            const dayStart = parseDateKey(date as string);
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            filter.date = { $gte: dayStart, $lt: dayEnd };
        } else if (month !== undefined && year !== undefined) {
            const m = Number(month);
            const y = Number(year);
            filter.date = {
                $gte: new Date(Date.UTC(y, m, 1)),
                $lt: new Date(Date.UTC(y, m + 1, 1)) // exclusive upper bound
            };
        } else {
            return res.status(400).json({ success: false, message: "Provide either 'date', or both 'month' and 'year'" });
        }

        if (employeeId) filter.employeeId = employeeId;

        const records = await DailyAttendance.find(filter);
        res.status(200).json({ success: true, data: records.map(formatAttendance) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
