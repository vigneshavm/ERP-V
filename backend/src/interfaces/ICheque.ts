import { Document, Schema } from "mongoose";

export interface ICheque extends Document {
    number: string;
    payee: string;
    amount: number;
    date: Date;
    bankName: string;
    type: 'RECEIVED' | 'ISSUED';
    status: 'PENDING' | 'CLEARED' | 'BOUNCED';
    accountId: Schema.Types.ObjectId;
    sector: string;
    tenantId: Schema.Types.ObjectId;
    userId: string;
    notes?: string;
}
