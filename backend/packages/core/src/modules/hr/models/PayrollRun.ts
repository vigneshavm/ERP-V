import mongoose, { Document, Schema } from "mongoose";

export interface IPayrollRun extends Document {
    tenantId: mongoose.Types.ObjectId;
    periodStart: Date;
    periodEnd: Date;
    status: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
    totalAmount: number; // Sum of all Net Pay
    totalEmployees: number;
    processedDate: Date;
    approvedBy?: mongoose.Types.ObjectId;
    paidDate?: Date;
    transactionId?: string; // Link to Finance Transaction
    notes?: string;
    branchId?: string; // Optional: Run payroll for specific branch
    paymentMode?: 'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CHEQUE';
}

const payrollRunSchema = new Schema<IPayrollRun>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        branchId: { type: String }, // Store branch context
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        status: {
            type: String,
            enum: ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'],
            default: 'DRAFT'
        },
        totalAmount: { type: Number, default: 0 },
        totalEmployees: { type: Number, default: 0 },
        processedDate: { type: Date, default: Date.now },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        paidDate: { type: Date },
        transactionId: { type: String }, // Can store the CashbankTransaction ID
        notes: { type: String },
        paymentMode: {
            type: String,
            enum: ['BANK_TRANSFER', 'CASH', 'UPI', 'CHEQUE']
        }
    },
    { timestamps: true }
);

const PayrollRun = mongoose.model<IPayrollRun>("PayrollRun", payrollRunSchema);
export default PayrollRun;
