import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplierReconciliation extends Document {
    tenantId: string;
    supplierId: mongoose.Types.ObjectId;
    transactionType: 'BILL' | 'PAYMENT' | 'DEBIT_NOTE';
    transactionId: string; // The ID string or ObjectId string of the original transaction
    reconciledAt: Date;
    status: 'RECONCILED' | 'DISPUTED';
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
}

const SupplierReconciliationSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    transactionType: {
        type: String,
        enum: ['BILL', 'PAYMENT', 'DEBIT_NOTE'],
        required: true
    },
    transactionId: { type: String, required: true, index: true },
    reconciledAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['RECONCILED', 'DISPUTED'],
        default: 'RECONCILED'
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Composite index to prevent double reconciliation of same transaction
SupplierReconciliationSchema.index({ tenantId: 1, transactionId: 1 }, { unique: true });

const SupplierReconciliation = mongoose.models.SupplierReconciliation || mongoose.model<ISupplierReconciliation>('SupplierReconciliation', SupplierReconciliationSchema);
export default SupplierReconciliation;
