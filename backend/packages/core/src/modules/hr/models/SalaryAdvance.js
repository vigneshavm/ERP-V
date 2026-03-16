import mongoose, { Schema } from 'mongoose';
const salaryAdvanceSchema = new Schema({
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
const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
export default SalaryAdvance;
