import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    tenantId: mongoose.Types.ObjectId;
    branchId?: mongoose.Types.ObjectId;
    expenseNumber: string;
    date: Date;
    category: string;
    description?: string;
    payment: {
        method: string; // 'Cash', 'Bank', 'UPI', 'Card'
        reference?: string;
    };
    amount: number;
    taxPercent: number;
    vendorId?: mongoose.Types.ObjectId;
    createdBy?: mongoose.Types.ObjectId;
    synced: boolean;
}

const ExpenseSchema: Schema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },

    expenseNumber: { type: String, required: true }, // Logic to ensure uniqueness per tenant usually handled in app or compound index
    date: { type: Date, required: true },
    category: { type: String, required: true },
    description: { type: String },

    payment: {
        method: { type: String, required: true },
        reference: { type: String }
    },

    amount: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0 },

    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    synced: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Ensure expense number is unique per tenant
ExpenseSchema.index({ tenantId: 1, expenseNumber: 1 }, { unique: true });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
