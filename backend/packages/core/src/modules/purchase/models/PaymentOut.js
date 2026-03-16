import mongoose, { Schema } from 'mongoose';
const PaymentOutSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    paymentNo: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
        type: String,
        required: true,
        enum: ['Cash', 'Cheque', 'UPI', 'Bank Transfer', 'Discount Received']
    },
    // Details
    referenceNo: { type: String },
    bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    chequeDate: { type: Date },
    bankName: { type: String },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'cleared', 'bounced', 'cancelled'],
        default: 'cleared' // Default cleared for Cash/UPI, Pending for Cheque
    },
    allocations: [{
            billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
            amount: { type: Number, required: true },
            discount: { type: Number, default: 0 }
        }],
    unallocatedAmount: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});
// Indexes
PaymentOutSchema.index({ tenantId: 1, supplierId: 1 });
PaymentOutSchema.index({ tenantId: 1, paymentDate: 1 });
PaymentOutSchema.index({ tenantId: 1, status: 1 });
PaymentOutSchema.index({ tenantId: 1, referenceNo: 1 });
const PaymentOut = mongoose.models.PaymentOut || mongoose.model('PaymentOut', PaymentOutSchema);
export default PaymentOut;
