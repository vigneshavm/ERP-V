import mongoose, { Schema } from 'mongoose';
import { ISmsTransaction } from '@smarterp/shared/interfaces/ISmsTransaction.js';

const smsTransactionSchema = new Schema<ISmsTransaction>(
    {
        rawText: {
            type: String,
            required: true,
        },
        sender: {
            type: String,
            required: true,
        },
        parsedData: {
            amount: { type: Number },
            date: { type: Date },
            type: {
                type: String,
                enum: ['debit', 'credit', 'unknown'],
                default: 'unknown'
            },
            merchant: { type: String },
            accountNumber: { type: String },
            bankName: { type: String },
            suggestedCategory: { type: String },
        },
        status: {
            type: String,
            enum: ['pending', 'converted', 'ignored'],
            default: 'pending',
        },
        expenseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tenantId: {
            type: String,
        }
    },
    { timestamps: true }
);

// Indexes
smsTransactionSchema.index({ userId: 1, 'parsedData.date': -1 });
smsTransactionSchema.index({ status: 1 });

const SmsTransaction = mongoose.model<ISmsTransaction>('SmsTransaction', smsTransactionSchema);
export default SmsTransaction;
