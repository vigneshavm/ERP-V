import mongoose, { Schema } from "mongoose";
const loanSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter loan name (e.g., HDFC Business Loan)"],
    },
    principalAmount: {
        type: Number,
        required: [true, "Please enter principal amount"],
    },
    interestRate: {
        type: Number,
        required: [true, "Please enter interest rate per annum (e.g., 10.5)"],
    },
    termMonths: {
        type: Number,
        required: [true, "Please enter loan term in months"],
    },
    emiAmount: {
        type: Number,
        required: [true, "Please enter calculated monthly EMI"],
    },
    totalPendingAmount: {
        type: Number,
        required: [true, "Please enter total pending amount"], // Can be principal + total interest
    },
    startDate: {
        type: Date,
        required: [true, "Please enter start date"],
    },
    status: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
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
}, { timestamps: true });
const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
