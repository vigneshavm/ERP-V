import { Document } from "mongoose";

export interface ICashbankTransaction extends Document {
    type: "transfer" | "in" | "out";
    amount: number;
    fromAccount: string; // ObjectId or 'cash'
    toAccount: string; // ObjectId or 'cash'
    description: string;
    date: Date;
    reconciled: boolean;
    reconciledDate?: Date;
    reconciledBy?: string; // ObjectId
    reference?: string;
    userId: string; // ObjectId

    createdAt: Date;
    updatedAt: Date;
}
