import mongoose, { Document, Schema } from "mongoose";

export interface IReturnItem {
    product: mongoose.Types.ObjectId;
    productName: string;
    originalQty: number;
    returnedQty: number;
    rate: number;
    taxPercent: number;
    taxAmount: number;
    lineTotal: number;
    condition: "damaged" | "not_damaged";
    reason: string;
    inventoryAdjusted: boolean;
}

export interface IOriginalPaymentInfo {
    paymentMethod?: string;
    paidViaMethod?: string;
    creditApplied?: number;
    paidAmount?: number;
    splitPaymentDetails?: any[];
    bankAccount?: mongoose.Types.ObjectId;
}

export interface IReturn extends Document {
    returnId: string;
    invoice: mongoose.Types.ObjectId;
    customer?: mongoose.Types.ObjectId;
    customerName: string;
    returnDate: Date;
    returnType: "partial" | "full";
    refundMethod: "credit" | "cash" | "bank" | "upi" | "original_payment" | "bank_transfer" | "card" | "cheque";
    actualRefundMethod?: "credit" | "cash" | "bank_transfer" | "upi" | "card" | "cheque";
    originalPaymentInfo?: IOriginalPaymentInfo;
    bankAccount?: mongoose.Types.ObjectId;
    refundProcessed: boolean;
    items: IReturnItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalReturnAmount: number;
    status: "processed" | "pending" | "refunded";
    notes: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    originalQty: {
        type: Number,
        required: true,
    },
    returnedQty: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    taxPercent: {
        type: Number,
        default: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    lineTotal: {
        type: Number,
        required: true,
    },
    condition: {
        type: String,
        enum: ["damaged", "not_damaged"],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    inventoryAdjusted: {
        type: Boolean,
        default: false,
    },
});

const returnSchema = new Schema<IReturn>(
    {
        returnId: {
            type: String,
            required: true,
        },
        invoice: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
        customerName: {
            type: String,
            default: "Walk-in Customer",
        },
        returnDate: {
            type: Date,
            default: Date.now,
        },
        returnType: {
            type: String,
            enum: ["partial", "full"],
            required: true,
        },
        refundMethod: {
            type: String,
            enum: ["credit", "cash", "bank", "upi", "original_payment", "bank_transfer", "card", "cheque"],
            default: "credit",
        },
        actualRefundMethod: {
            type: String,
            enum: ["credit", "cash", "bank_transfer", "upi", "card", "cheque"],
            // Stores what refund method was actually used (resolved from original_payment)
        },
        originalPaymentInfo: {
            paymentMethod: String,
            paidViaMethod: String,
            creditApplied: Number,
            paidAmount: Number,
            splitPaymentDetails: Array,
            bankAccount: {
                type: Schema.Types.ObjectId,
                ref: 'BankAccount',
            },
        },
        bankAccount: {
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        refundProcessed: {
            type: Boolean,
            default: false,
        },
        items: [returnItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        totalReturnAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["processed", "pending", "refunded"],
            default: "processed",
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

// Create compound unique index: returnId must be unique per user
returnSchema.index({ returnId: 1, createdBy: 1 }, { unique: true });

// Index on invoice for fast lookups
returnSchema.index({ invoice: 1 });

// Index on customer for customer history
returnSchema.index({ customer: 1 });

const Return = mongoose.model<IReturn>("Return", returnSchema);
export default Return;
