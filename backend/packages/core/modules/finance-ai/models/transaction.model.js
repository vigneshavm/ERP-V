import mongoose, { Schema } from 'mongoose';
const TransactionSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    date: { type: Date, default: Date.now, index: true },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    idempotencyKey: { type: String, unique: true, sparse: true },
    metadata: { type: Object },
}, { timestamps: true });
// Soft delete middleware
TransactionSchema.pre('find', function () {
    this.where({ isDeleted: false });
});
TransactionSchema.pre('findOne', function () {
    this.where({ isDeleted: false });
});
// Tenant isolation index
TransactionSchema.index({ tenantId: 1, date: -1 });
export default mongoose.model('Transaction', TransactionSchema);
