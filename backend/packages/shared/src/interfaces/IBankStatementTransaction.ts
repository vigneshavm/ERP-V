import { Document, Types } from 'mongoose';

export interface IBankStatementTransaction extends Document {
    date: Date;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    reference?: string;
    balance?: number;
    userId: string | Types.ObjectId; // User or Tenant reference
    status: 'pending' | 'reconciled';
    createdAt?: Date;
    updatedAt?: Date;
}
