import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    role: string;
    roleId?: string;
    mobile: string;
    dailyRate: number;
    hourlyRate: number;
    wageType: 'DAILY' | 'MONTHLY' | 'HOURLY' | 'COMMISSION' | 'HYBRID';
    branchId?: string;
    sector?: string; // Scope by industry sector if needed
    email?: string;
    bankDetails?: {
        accountNumber: string;
        ifsc: string;
        bankName: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
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

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

export default Employee;
