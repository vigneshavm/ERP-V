import { Document, Types } from 'mongoose';

export interface ISmsTransaction extends Document {
    rawText: string;
    sender: string;
    parsedData: {
        amount: number;
        date: Date;
        type: 'debit' | 'credit' | 'unknown';
        merchant?: string;
        accountNumber?: string; // Last 4 digits usually
        bankName?: string;
        suggestedCategory?: string;
    };
    status: 'pending' | 'converted' | 'ignored';
    expenseId?: Types.ObjectId; // Reference to created Expense if converted
    userId: Types.ObjectId;
    tenantId?: string;
    createdAt: Date;
    updatedAt: Date;
}
