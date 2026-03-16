import mongoose, { Schema } from "mongoose";
const debitNoteSchema = new Schema({
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
}, { timestamps: true });
debitNoteSchema.index({ noteId: 1 });
debitNoteSchema.index({ vendorId: 1 });
const DebitNote = mongoose.model("DebitNote", debitNoteSchema);
export default DebitNote;
