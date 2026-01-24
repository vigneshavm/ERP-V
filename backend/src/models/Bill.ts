import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
    billNo: string;
    date: Date;
    supplier: mongoose.Types.ObjectId;
    amount: number;
    dueDate?: Date;
    status: 'paid' | 'unpaid';
    paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
    paidAmount: number;
    bankAccount?: mongoose.Types.ObjectId;
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const billSchema = new Schema<IBill>(
    {
        billNo: {
            type: String,
            required: true,
        },
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
        dueDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['paid', 'unpaid'],
            default: 'unpaid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
            default: 'cash',
        },
        paidAmount: {
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
    },
    { timestamps: true }
);

// Create compound unique index: billNo must be unique per user
billSchema.index({ billNo: 1, createdBy: 1 }, { unique: true });

const Bill = mongoose.model<IBill>("Bill", billSchema);
export default Bill;
