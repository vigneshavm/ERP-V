import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentAllocation {
    billId: mongoose.Types.ObjectId;
    amount: number; // Amount allocated to this bill
    discount?: number; // Discount availed on this bill
}

export interface IPaymentOut extends Document {
    tenantId: string;
    paymentNo: string;
    supplierId: mongoose.Types.ObjectId;
    paymentDate: Date;
    amount: number;
    paymentMode: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';

    // Bank/Cheque Details
    referenceNo?: string; // Cheque No, UTR, Transaction ID
    bankAccountId?: mongoose.Types.ObjectId; // Source Bank
    chequeDate?: Date; // For Post-Dated Cheques
    bankName?: string; // Issuing Bank Name (for Cheque)

    status: 'pending' | 'cleared' | 'bounced' | 'cancelled';

    // Allocation
    allocations: IPaymentAllocation[];
    unallocatedAmount: number; // Advance amount

    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentOutSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    paymentNo: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
        type: String,
        required: true,
        enum: ['Cash', 'Cheque', 'UPI', 'Bank Transfer']
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

const PaymentOut = mongoose.models.PaymentOut || mongoose.model<IPaymentOut>('PaymentOut', PaymentOutSchema);
export default PaymentOut;
