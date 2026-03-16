import mongoose, { Schema } from "mongoose";
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
const PurchasePayment = mongoose.model("PurchasePayment", purchasePaymentSchema);
export default PurchasePayment;
