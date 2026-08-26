import mongoose, { Document, Schema } from "mongoose";

export interface IDebitNoteItem {
    itemId?: mongoose.Types.ObjectId;
    name: string;
    qty: number;
    amount: number;
}

export interface IDebitNote extends Document {
    noteId: string;
    debitNoteNumber?: string; // For ledger consistency
    sourceId?: string; // For ledger consistency
    date: Date;
    vendorId: mongoose.Types.ObjectId;
    vendorName: string;
    poReference?: string;
    reason: 'RETURN' | 'PRICE_DIFF' | 'QUALITY' | 'SHORTAGE' | 'OTHER';
    items: IDebitNoteItem[];
    totalAmount: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    branchId: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const debitNoteSchema = new Schema<IDebitNote>(
    {
        noteId: {
            type: String,
            required: true,
            unique: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        vendorName: {
            type: String,
            required: true,
        },
        poReference: {
            type: String,
        },
        reason: {
            type: String,
            enum: ['RETURN', 'PRICE_DIFF', 'QUALITY', 'SHORTAGE', 'OTHER'],
            required: true,
        },
        items: [
            {
                itemId: { type: Schema.Types.ObjectId, ref: "Item" },
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                amount: { type: Number, required: true },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        branchId: {
            type: String,
            default: 'Main',
        },
        notes: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);


debitNoteSchema.index({ vendorId: 1 });

const DebitNote = mongoose.model<IDebitNote>("DebitNote", debitNoteSchema);
export default DebitNote;
