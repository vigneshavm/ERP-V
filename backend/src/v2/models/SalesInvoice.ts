import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesInvoice extends Document {
    tenantId: mongoose.Types.ObjectId;
    branchId?: mongoose.Types.ObjectId;
    invoiceNo: string;
    date: Date;
    dueDate?: Date;
    customer: {
        id?: mongoose.Types.ObjectId;
        name?: string;
        phone?: string;
    };
    financials: {
        grossAmount: number;
        discountAmount: number;
        taxAmount: number;
        roundOff: number;
        netAmount: number;
    };
    payment: {
        paidAmount: number;
        balanceAmount: number;
        mode: string; // 'CASH', 'UPI', etc.
        status: 'PAID' | 'PARTIAL' | 'DUE';
    };
    meta: {
        status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
        type: 'INVOICE' | 'POS' | 'CREDIT_NOTE';
        isReturned: boolean;
        returnStatus: 'NONE' | 'PARTIAL' | 'FULL';
        createdBy?: mongoose.Types.ObjectId;
    };
    items?: any[]; // Defined broadly as it was JSONB in SQL, but can be refined
}

const SalesInvoiceSchema: Schema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },

    invoiceNo: { type: String, required: true },
    date: { type: Date, default: Date.now, index: true },
    dueDate: { type: Date },

    // Embedded Customer Snapshot (Pattern: Embed for History/Snapshot)
    customer: {
        id: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
        name: { type: String },
        phone: { type: String }
    },

    // Grouped Financials
    financials: {
        grossAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        roundOff: { type: Number, default: 0 },
        netAmount: { type: Number, required: true, default: 0 }
    },

    // Grouped Payment Details
    payment: {
        paidAmount: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },
        mode: { type: String },
        status: { type: String, enum: ['PAID', 'PARTIAL', 'DUE'], default: 'PAID', index: true }
    },

    // Meta & Status
    meta: {
        status: { type: String, enum: ['DRAFT', 'ISSUED', 'CANCELLED'], default: 'ISSUED', index: true },
        type: { type: String, enum: ['INVOICE', 'POS', 'CREDIT_NOTE'], default: 'INVOICE' },
        isReturned: { type: Boolean, default: false },
        returnStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },

    // Items (Flexible structure for now to match JSONB usage)
    items: [Schema.Types.Mixed]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound Index for Search
SalesInvoiceSchema.index({ invoiceNo: 'text', 'customer.name': 'text', 'customer.phone': 'text' });

export default mongoose.model<ISalesInvoice>('SalesInvoice', SalesInvoiceSchema);
