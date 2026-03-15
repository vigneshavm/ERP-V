import mongoose, { Schema, Document } from "mongoose";

export interface IPurchasePayment extends Document {
    paymentNo: string;
    paymentDate: Date;
    supplierId: mongoose.Types.ObjectId;
    paymentMethod: 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer';
    amount: number;
    notes?: string;
    tenantId: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const purchasePaymentSchema = new Schema({
    paymentNo: { type: String, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'card', 'cheque', 'bank_transfer'],
        default: 'cash'
    },
    amount: { type: Number, required: true },
    notes: { type: String },
    tenantId: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for performance
purchasePaymentSchema.index({ tenantId: 1, supplierId: 1, paymentDate: -1 });
purchasePaymentSchema.index({ paymentNo: 1, tenantId: 1 }, { unique: true });

const PurchasePayment = mongoose.model<IPurchasePayment>("PurchasePayment", purchasePaymentSchema);
export default PurchasePayment;
