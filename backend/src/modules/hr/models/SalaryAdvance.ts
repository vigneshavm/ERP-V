import mongoose, { Document, Schema } from 'mongoose';

export interface ISalaryAdvance extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    type: 'ADVANCE' | 'PART_PAYMENT';
    status: 'PENDING' | 'RECOVERED' | 'CANCELLED';
    payrollRunId?: mongoose.Types.ObjectId; // Link to the payroll run where this was recovered
    notes?: string;
}

const salaryAdvanceSchema = new Schema<ISalaryAdvance>({
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
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['ADVANCE', 'PART_PAYMENT'],
        default: 'ADVANCE'
    },
    status: {
        type: String,
        enum: ['PENDING', 'RECOVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    payrollRunId: {
        type: Schema.Types.ObjectId,
        ref: 'PayrollRun',
        default: null
    },
    notes: String
}, {
    timestamps: true
});

const SalaryAdvance = mongoose.model<ISalaryAdvance>('SalaryAdvance', salaryAdvanceSchema);

export default SalaryAdvance;
