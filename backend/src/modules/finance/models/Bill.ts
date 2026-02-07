import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
    billNo: string;
    vendorInvoiceNo: string; // Vendor's invoice number
    date: Date;
    supplier: mongoose.Types.ObjectId;
    amount: number; // Total Payble Amount
    tenantId: string;
    branchId?: string;

    // Line Items
    items: {
        productId: mongoose.Types.ObjectId;
        name: string;
        quantity: number;
        rate: number;
        taxRate: number;
        taxAmount: number;
        total: number;
    }[];

    // Financials
    subTotal: number;
    discount: number;
    freight: number;
    roundOff: number;
    taxBreakdown: {
        cgst: number;
        sgst: number;
        igst: number;
        other: number;
    };

    // Linkage
    grnId?: mongoose.Types.ObjectId; // Linked Goods Receipt
    purchaseOrderId?: mongoose.Types.ObjectId; // Linked PO

    dueDate?: Date;
    paymentTerms?: number; // In days
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'disputed' | 'paid' | 'unpaid' | 'overdue';
    paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'credit' | 'other';
    paidAmount: number;
    discountReceived?: number;
    bankAccount?: mongoose.Types.ObjectId;
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // GST Compliance
    gstReconciliationStatus?: 'PENDING' | 'MATCHED' | 'MISMATCH' | 'MISSING_IN_GSTR2B';
    itcStatus?: 'CLAIMED' | 'UNCLAIMED' | 'INELIGIBLE';
}

const billSchema = new Schema<IBill>(
    {
        billNo: {
            type: String,
            required: true,
        },
        vendorInvoiceNo: {
            type: String,
            required: true,
        },
        tenantId: { type: String, required: true },
        branchId: { type: String },
        date: {
            type: Date,
            required: true,
        },
        supplier: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        // Line Items
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Item' },
            name: String,
            quantity: Number,
            rate: Number,
            taxRate: Number,
            taxAmount: Number,
            total: Number,
        }],
        // Financials
        subTotal: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        freight: { type: Number, default: 0 },
        roundOff: { type: Number, default: 0 },
        taxBreakdown: {
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 },
            other: { type: Number, default: 0 }
        },
        // Linkage
        grnId: { type: Schema.Types.ObjectId, ref: 'GRN' },
        purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },

        dueDate: {
            type: Date,
        },
        paymentTerms: { type: Number },
        status: {
            type: String,
            enum: ['draft', 'pending_approval', 'approved', 'rejected', 'disputed', 'paid', 'unpaid', 'overdue'],
            default: 'unpaid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'credit', 'other'],
            default: 'cash',
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        discountReceived: {
            type: Number,
            default: 0,
        },
        bankAccount: {
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'unpaid', 'partial'],
            default: 'unpaid',
        },
        description: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        gstReconciliationStatus: {
            type: String,
            enum: ['PENDING', 'MATCHED', 'MISMATCH', 'MISSING_IN_GSTR2B'],
            default: 'PENDING'
        },
        itcStatus: {
            type: String,
            enum: ['CLAIMED', 'UNCLAIMED', 'INELIGIBLE'],
            default: 'UNCLAIMED'
        }
    },
    { timestamps: true }
);

// Create compound unique index: billNo must be unique per user
billSchema.index({ billNo: 1, createdBy: 1 }, { unique: true });
billSchema.index({ tenantId: 1, branchId: 1 });
billSchema.index({ gstReconciliationStatus: 1 });

const Bill = mongoose.model<IBill>("Bill", billSchema);
export default Bill;
