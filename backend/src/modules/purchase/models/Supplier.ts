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
    panNo?: string;
    supplierType: 'manufacturer' | 'wholesaler' | 'distributor' | 'retailer';
    openingBalance: number;
    balanceType: 'payable' | 'receivable';
    creditPeriod: number;
    creditEnforcement: 'strict' | 'flexible';
    performanceMetrics?: {
        totalOrders: number;
        lateDeliveries: number;
        totalReturns: number;
        averageDeliveryTime: number;
        reliabilityScore: number;
        lastEvaluated: Date;
    };
    defaultPaymentMode?: 'Cash' | 'Cheque' | 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
    isOneTime: boolean;
    bankAccounts: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        branch: string;
        ifsc: string;
        isDefault: boolean;
    }[];
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
    state: { type: String, required: false }, // For GST Calculation
    gstNo: { type: String, required: false },
    panNo: { type: String, required: false },
    supplierType: {
        type: String,
        enum: ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'other'],
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
    creditEnforcement: {
        type: String,
        enum: ['strict', 'flexible'],
        default: 'flexible'
    },
    performanceMetrics: {
        totalOrders: { type: Number, default: 0 },
        lateDeliveries: { type: Number, default: 0 },
        totalReturns: { type: Number, default: 0 },
        averageDeliveryTime: { type: Number, default: 0 }, // in Days
        reliabilityScore: { type: Number, default: 100 }, // 0 to 100
        lastEvaluated: { type: Date }
    },
    defaultPaymentMode: {
        type: String,
        enum: ['Cash', 'Cheque', 'NEFT', 'RTGS', 'IMPS', 'UPI'],
        default: 'NEFT'
    },
    isOneTime: { type: Boolean, default: false },
    bankAccounts: [{
        accountName: { type: String },
        accountNumber: { type: String },
        bankName: { type: String },
        branch: { type: String },
        ifsc: { type: String },
        isDefault: { type: Boolean, default: false }
    }],
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
