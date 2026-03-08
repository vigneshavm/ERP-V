import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveRequest extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    leaveType: 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'OTHER' | 'UNPAID';
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>({
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
    leaveType: {
        type: String,
        enum: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'OTHER', 'UNPAID'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: {
        type: Date
    },
    rejectionReason: {
        type: String
    }
}, {
    timestamps: true
});

// Index for performance and tenant scoping
leaveRequestSchema.index({ tenantId: 1, employeeId: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;
