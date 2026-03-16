import mongoose, { Schema } from "mongoose";
const payrollRunSchema = new Schema({
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
}, { timestamps: true });
const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);
export default PayrollRun;
