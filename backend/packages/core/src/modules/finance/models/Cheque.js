import mongoose, { Schema } from "mongoose";
const chequeSchema = new Schema({
    number: {
        type: String,
        required: [true, "Please enter cheque number"],
        index: true,
    },
    payee: {
        type: String,
        required: [true, "Please enter payee name"],
    },
    amount: {
        type: Number,
        required: [true, "Please enter amount"],
        min: [0.01, "Amount must be positive"],
    },
    date: {
        type: Date,
        required: [true, "Please enter cheque date"],
    },
    bankName: {
        type: String,
        required: [true, "Please enter bank name"],
    },
    type: {
        type: String,
        enum: ["RECEIVED", "ISSUED"],
        required: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "CLEARED", "BOUNCED"],
        default: "PENDING",
    },
    accountId: {
        type: Schema.Types.ObjectId,
        ref: "BankAccount",
        required: true,
    },
    sector: {
        type: String,
        required: true,
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
    notes: {
        type: String,
        default: "",
    },
}, { timestamps: true });
// Compound index for unique cheque number per tenant/account might be useful
// chequeSchema.index({ tenantId: 1, number: 1, accountId: 1 }, { unique: true });
const Cheque = mongoose.model("Cheque", chequeSchema);
export default Cheque;
