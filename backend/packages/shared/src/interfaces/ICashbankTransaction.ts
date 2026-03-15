import { ObjectId } from "mongodb";

export interface ICashbankTransaction {
    _id?: ObjectId | string;
    type: "transfer" | "in" | "out";
    amount: number;
    fromAccount: string; // ObjectId string or 'cash'
    toAccount: string; // ObjectId string or 'cash'
    description?: string;
    date: Date;
    reconciled: boolean;
    reconciledDate?: Date;
    reconciledBy?: string; // ObjectId string
    reference?: string;
    userId: ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}
