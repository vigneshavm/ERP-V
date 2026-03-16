import mongoose, { Schema } from "mongoose";
const payslipSchema = new Schema({
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
}, { timestamps: true });
// Index for fast lookup of an employee's slips
payslipSchema.index({ tenantId: 1, employeeId: 1 });
payslipSchema.index({ payrollRunId: 1 });
const Payslip = mongoose.model("Payslip", payslipSchema);
export default Payslip;
