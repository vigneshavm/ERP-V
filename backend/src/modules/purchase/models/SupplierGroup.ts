import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierGroup extends Document {
    tenantId: string;
    name: string;
    description?: string;
    color: string;
    paymentTerms: number;
    creditLimit: number;
    discountPercent: number;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierGroupSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: '#3b82f6' },
    paymentTerms: { type: Number, default: 30 },
    creditLimit: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    icon: { type: String, default: 'truck' }
}, {
    timestamps: true
});

// Compound index for unique group name per tenant
SupplierGroupSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model<ISupplierGroup>('SupplierGroup', SupplierGroupSchema);
