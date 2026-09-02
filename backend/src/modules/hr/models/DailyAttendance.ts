import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyAttendance extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    // Matches the frontend's AttendanceStatus union (frontend/src/types/common.ts)
    // so the Staff Management attendance calendar can persist exactly what it shows.
    status: 'PRESENT' | 'HALF' | 'HALF_DAY' | 'QUARTER' | 'ABSENT' | 'ON_LEAVE';
    checkInTime?: string;
    checkOutTime?: string;
    advanceTaken?: number;
    // Used by the Daily Attendance Board (per-date, all-employees view).
    overtimeHours?: number;
    notes?: string;
}

const dailyAttendanceSchema = new Schema<IDailyAttendance>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PRESENT', 'HALF', 'HALF_DAY', 'QUARTER', 'ABSENT', 'ON_LEAVE'],
        default: 'PRESENT'
    },
    // Stored as "HH:MM" strings (matches the calendar's <input type="time"> values)
    // rather than Date, since these are times-of-day, not timestamps.
    checkInTime: String,
    checkOutTime: String,
    advanceTaken: {
        type: Number,
        default: 0
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    notes: String
}, {
    timestamps: true
});

// Avoid duplicate attendance for same employee on same date
dailyAttendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

const DailyAttendance = mongoose.model<IDailyAttendance>('DailyAttendance', dailyAttendanceSchema);

export default DailyAttendance;
