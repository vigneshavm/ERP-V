import mongoose, { Document, Schema } from "mongoose";

export interface IPayslip extends Document {
    tenantId: mongoose.Types.ObjectId;
    payrollRunId: mongoose.Types.ObjectId; // Link to the batch
    employeeId: mongoose.Types.ObjectId;

    // Snapshot of structure at runtime
    basicSalary: number;
    earnings: { name: string; amount: number; componentId?: string }[];
    deductions: { name: string; amount: number; componentId?: string }[];

    grossPay: number;
    totalDeductions: number;
    netPay: number;

    daysPresent: number;
    daysTotal: number;

    paymentStatus: 'PENDING' | 'PAID';
    paymentDate?: Date;
    transactionRef?: string;
    bankDetailsSnapshot?: {
        accountNumber: string;
        ifsc: string;
        bankName: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const payslipSchema = new Schema<IPayslip>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        payrollRunId: {
            type: Schema.Types.ObjectId,
            ref: "PayrollRun",
            required: true
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        basicSalary: { type: Number, default: 0 },
        earnings: [{
            name: String,
            amount: Number,
            componentId: String
        }],
        deductions: [{
            name: String,
            amount: Number,
            componentId: String
        }],
        grossPay: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
        netPay: { type: Number, default: 0 },

        daysPresent: { type: Number, default: 30 },
        daysTotal: { type: Number, default: 30 },

        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID'],
            default: 'PENDING'
        },
        paymentDate: Date,
        transactionRef: String,
        bankDetailsSnapshot: {
            accountNumber: String,
            ifsc: String,
            bankName: String
        }
    },
    { timestamps: true }
);

// Index for fast lookup of an employee's slips
payslipSchema.index({ tenantId: 1, employeeId: 1 });
payslipSchema.index({ payrollRunId: 1 });

const Payslip = mongoose.model<IPayslip>("Payslip", payslipSchema);
export default Payslip;
