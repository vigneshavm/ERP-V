import mongoose, { Schema } from 'mongoose';
import { IBankStatementTransaction } from '@smarterp/shared/interfaces/IBankStatementTransaction.js';

const bankStatementTransactionSchema = new Schema<IBankStatementTransaction>(
    {
        date: {
            type: Date,
            required: [true, 'Transaction date is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
        },
        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: [true, 'Transaction type is required'],
        },
        reference: {
            type: String,
        },
        balance: {
            type: Number,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reconciled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// Indexes for faster querying
bankStatementTransactionSchema.index({ userId: 1, date: -1 });

const BankStatementTransaction = mongoose.model<IBankStatementTransaction>('BankStatementTransaction', bankStatementTransactionSchema);
export default BankStatementTransaction;
