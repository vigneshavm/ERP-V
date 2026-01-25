import mongoose, { Document, Schema } from "mongoose";
// PaymentIn Model Definition

export interface IPaymentMethod {
    method: "cash" | "upi" | "card" | "bank_transfer" | "cheque";
    amount: number;
    reference?: string;
    bankAccount?: mongoose.Types.ObjectId;
    cardType?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    chequeBank?: string;
}

export interface IInvoiceAllocation {
    invoice: mongoose.Types.ObjectId;
    allocatedAmount: number;
    invoiceBalanceBefore: number;
}

export interface IPaymentIn extends Document {
    receiptNumber: string;
    customer: mongoose.Types.ObjectId;
    paymentDate: Date;
    totalAmount: number;
    paymentMethods: IPaymentMethod[];
    allocatedInvoices: IInvoiceAllocation[];
    creditApplied: number;
    excessAmount: number;
    depositAccount: any; // 'cash' or ObjectId
    notes: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>({
    method: {
        type: String,
        enum: ["cash", "upi", "card", "bank_transfer", "cheque"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    reference: {
        type: String,
        default: "",
    },
    bankAccount: {
        type: Schema.Types.ObjectId,
        ref: "BankAccount",
    },
    cardType: {
        type: String,
        default: "",
    },
    chequeNumber: {
        type: String,
        default: "",
    },
    chequeDate: {
        type: Date,
    },
    chequeBank: {
        type: String,
        default: "",
    },
});

const invoiceAllocationSchema = new Schema<IInvoiceAllocation>({
    invoice: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
    },
    allocatedAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    invoiceBalanceBefore: {
        type: Number,
        required: true,
    },
});

const paymentInSchema = new Schema<IPaymentIn>(
    {
        receiptNumber: {
            type: String,
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        paymentMethods: [paymentMethodSchema],
        allocatedInvoices: [invoiceAllocationSchema],
        creditApplied: {
            type: Number,
            default: 0,
            min: 0,
        },
        excessAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        depositAccount: {
            type: Schema.Types.Mixed, // 'cash' or ObjectId
            required: true,
        },
        notes: {
            type: String,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound unique index: receiptNumber must be unique per user
paymentInSchema.index({ receiptNumber: 1, createdBy: 1 }, { unique: true });

// Index on customer for fast customer queries
paymentInSchema.index({ customer: 1 });

// Index on createdBy for user-specific queries
paymentInSchema.index({ createdBy: 1 });

// Index on paymentDate for date-based queries
paymentInSchema.index({ paymentDate: -1 });

const PaymentIn = mongoose.model<IPaymentIn>("PaymentIn", paymentInSchema);
export default PaymentIn;
