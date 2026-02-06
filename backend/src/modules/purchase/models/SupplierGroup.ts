import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierGroup extends Document {
    tenantId: string;
    name: string;
    description?: string;
    color: string;
    nature: 'Raw Material' | 'Finished Goods' | 'Services' | 'Others';
    region: 'Local' | 'Outstation';
    financialCategory: 'Credit' | 'Cash';
    priority: 'High' | 'Medium' | 'Low';
    taxType: 'GST' | 'Non-GST';
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
    nature: {
        type: String,
        enum: ['Raw Material', 'Finished Goods', 'Services', 'Others'],
        default: 'Raw Material'
    },
    region: {
        type: String,
        enum: ['Local', 'Outstation'],
        default: 'Local'
    },
    financialCategory: {
        type: String,
        enum: ['Credit', 'Cash'],
        default: 'Credit'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    taxType: {
        type: String,
        enum: ['GST', 'Non-GST'],
        default: 'GST'
    },
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
