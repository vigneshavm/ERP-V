import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    role: string;
    roleId?: string;
    mobile: string;
    dailyRate: number;
    wageType: 'DAILY' | 'MONTHLY';
    branchId?: string; // Storing as string or ObjectId depending on system design, keeping simple string for now if not referencing a specific model strictly yet, or stringified ID.
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
        type: String, // Optional reference to a role definition
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
    wageType: {
        type: String,
        enum: ['DAILY', 'MONTHLY'],
        default: 'DAILY'
    },
    branchId: {
        type: String, // Can be ObjectId if needed, but keeping flexible based on valid branch naming in frontend
        default: null
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
