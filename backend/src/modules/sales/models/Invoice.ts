import mongoose, { Schema } from "mongoose";
import { IInvoice } from "../../../interfaces/IInvoice.js";

const invoiceItemSchema = new Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    name: { type: String },        // Denormalized for fast reads/receipts
    hsnCode: { type: String },     // HSN/SAC code at time of sale
    gstRate: { type: Number, default: 0 },  // GST % at time of sale
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    taxableAmount: { type: Number, default: 0 }, // price*qty before tax
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    tax: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
});

const invoiceSchema = new Schema<IInvoice>(
    {
        invoiceNo: {
            type: String,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
        },
        items: [invoiceItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        creditApplied: {
            type: Number,
            default: 0,
        },
        previousDueAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "unpaid", "partial"],
            default: "unpaid",
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "upi", "card", "due", "split", "bank_transfer", "cheque", "credit"],
            default: "cash",
        },
        paidViaMethod: {
            type: String,
            enum: ["cash", "upi", "card", "due", "split", "bank_transfer", "cheque", "credit"],
            default: null,
        },
        splitPaymentDetails: [
            {
                method: {
                    type: String,
                    enum: ["cash", "upi", "card", "due", "split", "bank_transfer", "cheque"],
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                },
            },
        ],
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        returnedAmount: {
            type: Number,
            default: 0,
        },
        hasReturns: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // GST Compliance
        taxMode: {
            type: String,
            enum: ['INCLUSIVE', 'EXCLUSIVE'],
            default: 'INCLUSIVE'
        },
        isInterState: {
            type: Boolean,
            default: false   // false = CGST+SGST, true = IGST
        },
        taxBreakdown: {
            cgst:  { type: Number, default: 0 },
            sgst:  { type: Number, default: 0 },
            igst:  { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
    },
    { timestamps: true }
);

invoiceSchema.index({ invoiceNo: 1, tenantId: 1 }, { unique: true });

const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
export default Invoice;
