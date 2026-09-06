import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseReturnItem {
    itemId: mongoose.Types.ObjectId; // Link to Inventory Item
    productName: string;
    quantity: number;
    rate: number;
    tax: number;
    amount: number;
    reason: string;
    // GRN-wise/lot-wise return: which specific batch this quantity is coming back from
    // (see GRN.items[].lotNumber). Optional -- a return with no grnId set never has these.
    batchNumber?: string;
    // Barcode-wise return: for serialized (IMEI/serial-tracked) items, the specific unit
    // being returned rather than a batch quantity.
    serializedUnitId?: mongoose.Types.ObjectId;
}

export interface IPurchaseReturn extends Document {
    returnId: string;
    bill?: mongoose.Types.ObjectId;
    debitNoteId?: mongoose.Types.ObjectId; // Link to Debit Note
    // Which goods receipt this return is against -- optional so a supplier-level return with
    // no specific GRN (e.g. a very old purchase, or a non-stock adjustment) still works, but
    // when set, item quantities are validated against that GRN's acceptedQty and the actual
    // batch/serialized stock is decremented instead of a blind bulk subtract.
    grnId?: mongoose.Types.ObjectId;
    supplier: mongoose.Types.ObjectId;
    returnDate: Date;
    refundMethod: "credit" | "cash" | "bank_transfer" | "adjust_next_bill";
    bankAccount?: mongoose.Types.ObjectId;
    items: IPurchaseReturnItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const purchaseReturnItemSchema = new Schema<IPurchaseReturnItem>({
    itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    batchNumber: {
        type: String,
    },
    serializedUnitId: {
        type: Schema.Types.ObjectId,
        ref: "SerializedUnit",
    }
});

const purchaseReturnSchema = new Schema<IPurchaseReturn>(
    {
        returnId: {
            type: String,
            required: true,
        },
        bill: {
            type: Schema.Types.ObjectId,
            ref: "Bill",
        },
        debitNoteId: {
            type: Schema.Types.ObjectId,
            ref: "DebitNote",
        },
        grnId: {
            type: Schema.Types.ObjectId,
            ref: "GRN",
        },
        supplier: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        returnDate: {
            type: Date,
            default: Date.now,
        },
        refundMethod: {
            type: String,
            enum: ["credit", "cash", "bank_transfer", "adjust_next_bill"],
            default: "credit",
        },
        bankAccount: {
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        items: [purchaseReturnItemSchema],
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
        totalAmount: {
            type: Number,
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

purchaseReturnSchema.index({ returnId: 1, createdBy: 1 }, { unique: true });
purchaseReturnSchema.index({ grnId: 1 });

const PurchaseReturn = mongoose.model<IPurchaseReturn>("PurchaseReturn", purchaseReturnSchema);
export default PurchaseReturn;
