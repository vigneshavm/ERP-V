import mongoose, { Document, Schema } from "mongoose";

// A simple model to aggregate attendance for a period manually or via integration
export interface IAttendanceSummary extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    month: number; // 0-11
    year: number;
    totalDays: number; // Days in month
    workedDays: number; // Billable days
    leavesTaken: number;
    overtimeHours?: number; // For HOURLY or Overtime calc
    regularHours?: number; // For HOURLY wage type
    holidays: number;      // Public holidays
    weeklyOffs: number;    // Weekends
    paidLeaves: number;    // Approved Paid Leaves (CL/PL)
    lateDays: number;      // Days late (might have penalty)
    halfDays: number;      // Days worked half
    incentiveAmount?: number;
    commissionAmount?: number;
    bonusAmount?: number;
    advanceRecoveryAmount?: number; // For Salary Advance deduction
    notes?: string;
}

const attendanceSummarySchema = new Schema<IAttendanceSummary>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        totalDays: { type: Number, default: 30 },
        workedDays: { type: Number, required: true },
        leavesTaken: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        regularHours: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 },
        weeklyOffs: { type: Number, default: 0 },
        paidLeaves: { type: Number, default: 0 },
        lateDays: { type: Number, default: 0 },
        halfDays: { type: Number, default: 0 },
        incentiveAmount: { type: Number, default: 0 },
        commissionAmount: { type: Number, default: 0 },
        bonusAmount: { type: Number, default: 0 },
        advanceRecoveryAmount: { type: Number, default: 0 },
        notes: String
    },
    { timestamps: true }
);

// Ensure one summary per employee per month
attendanceSummarySchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

const AttendanceSummary = mongoose.model<IAttendanceSummary>("AttendanceSummary", attendanceSummarySchema);
export default AttendanceSummary;
