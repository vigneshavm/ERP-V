import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyAttendance extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
    checkInTime?: Date;
    checkOutTime?: Date;
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
        enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'],
        default: 'PRESENT'
    },
    checkInTime: Date,
    checkOutTime: Date,
    notes: String
}, {
    timestamps: true
});

// Avoid duplicate attendance for same employee on same date
dailyAttendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

const DailyAttendance = mongoose.model<IDailyAttendance>('DailyAttendance', dailyAttendanceSchema);

export default DailyAttendance;
