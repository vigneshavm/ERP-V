import mongoose, { Schema } from "mongoose";
import { ILoanPayment } from '@smarterp/shared/interfaces/ILoanPayment.js';

const loanPaymentSchema = new Schema<ILoanPayment>(
    {
        loanId: {
            type: Schema.Types.ObjectId,
            ref: "Loan",
            required: [true, "Please provide the loan ID"],
            index: true,
        },
        paymentDate: {
            type: Date,
            required: [true, "Please enter payment date"],
            default: Date.now,
        },
        amountPaid: {
            type: Number,
            required: [true, "Please enter amount paid"],
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "BankTransfer", "Cheque"],
            required: [true, "Please specify payment method"],
        },
        bankAccountId: {
            type: Schema.Types.ObjectId,
            ref: "BankAccount",
            required: function () {
                return this.paymentMethod === "BankTransfer" || this.paymentMethod === "Cheque";
            }
        },
        referenceNumber: {
            type: String, // Transaction ID or Cheque No
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        userId: {
            type: String,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const LoanPayment = mongoose.model<ILoanPayment>("LoanPayment", loanPaymentSchema);
export default LoanPayment;
