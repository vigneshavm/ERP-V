import { ObjectId } from "mongodb";

export interface ICheque {
    _id?: ObjectId | string;
    number: string;
    payee: string;
    amount: number;
    date: Date;
    bankName?: string;
    type: 'RECEIVED' | 'ISSUED';
    status: 'PENDING' | 'CLEARED' | 'BOUNCED' | 'CANCELLED';
    accountId: ObjectId | string;
    sector?: string;
    tenantId: ObjectId | string;
    userId: ObjectId | string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
