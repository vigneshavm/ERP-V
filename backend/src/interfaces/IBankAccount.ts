import { ObjectId } from 'mongodb';

export interface IBankAccount {
    _id?: ObjectId | string;
    bankName: string;
    accountNumber: string; // The encrypted string
    accountType: 'Current' | 'Savings' | 'OD' | 'CC' | 'Loan' | 'Other';
    branch?: string;
    ifsc?: string;
    openingBalance: number;
    currentBalance: number;
    isActive: boolean;
    tenantId: ObjectId | string;
    userId: ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}
