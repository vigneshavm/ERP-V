import mongoose, { Schema } from "mongoose";
const attendanceSummarySchema = new Schema({
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
}, { timestamps: true });
// Ensure one summary per employee per month
attendanceSummarySchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });
const AttendanceSummary = mongoose.model("AttendanceSummary", attendanceSummarySchema);
export default AttendanceSummary;
