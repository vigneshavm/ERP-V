import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
    tenantId: string;
    supplierId: string;
    businessName: string;
    shortCode?: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    gstNo: string;
    supplierType: 'manufacturer' | 'wholesaler' | 'distributor';
    openingBalance: number;
    balanceType: 'payable' | 'receivable';
    creditPeriod: number;
    status: 'active' | 'inactive';
    supplierGroup?: string; // Brand/Parent Group
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    supplierId: { type: String, required: true, unique: true },
    businessName: { type: String, required: true },
    shortCode: { type: String },
    contactPersonName: { type: String, required: false },
    contactNo: { type: String, required: false },
    email: { type: String, required: false, lowercase: true, trim: true },
    physicalAddress: { type: String, required: false },
    gstNo: { type: String, required: false },
    supplierType: {
        type: String,
        enum: ['manufacturer', 'wholesaler', 'distributor', 'retailer'],
        default: 'manufacturer'
    },
    openingBalance: { type: Number, default: 0 },
    balanceType: {
        type: String,
        enum: ['payable', 'receivable'],
        default: 'payable'
    },
    creditLimit: { type: Number, default: 0 },
    creditPeriod: { type: Number, default: 30 },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    supplierGroup: { type: String, trim: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'SupplierGroup' },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    itemsSupplied: [{ type: Schema.Types.ObjectId, ref: 'Item' }]
}, {
    timestamps: true
});

// Compound indexes
SupplierSchema.index({ tenantId: 1, businessName: 1 }, { unique: true });
SupplierSchema.index({ tenantId: 1, contactNo: 1 }, { unique: true, sparse: true });
SupplierSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });

const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
export default Supplier;
