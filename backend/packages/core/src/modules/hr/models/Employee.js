import mongoose, { Schema } from 'mongoose';
const employeeSchema = new Schema({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true
    },
    roleId: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    dailyRate: {
        type: Number,
        default: 0
    },
    hourlyRate: {
        type: Number,
        default: 0
    },
    baseSalary: {
        type: Number,
        default: 0
    },
    wageType: {
        type: String,
        enum: ['DAILY', 'MONTHLY', 'HOURLY', 'COMMISSION', 'HYBRID'],
        default: 'DAILY'
    },
    branchId: {
        type: String,
        default: null
    },
    sector: {
        type: String,
        default: null
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    joiningDate: {
        type: Date,
        default: null
    },
    employmentHistory: [{
            startDate: { type: Date, required: true },
            endDate: { type: Date, default: null },
            reasonForLeaving: { type: String, default: "" }
        }],
    bankDetails: {
        accountNumber: String,
        ifsc: String,
        bankName: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Index to prevent duplicate staff with same mobile under same tenant
employeeSchema.index({ tenantId: 1, mobile: 1 }, { unique: true });
const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
