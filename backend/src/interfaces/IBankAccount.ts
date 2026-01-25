import { Document, Types } from "mongoose";

export interface IBankAccount extends Document {
    bankName: string;
    accountNumber: string;
    accountType: "Savings" | "Current" | "Overdraft" | "Loan";
    branch: string;
    ifsc: string;
    openingBalance: number;
    currentBalance: number;
    status: "active" | "inactive";
    userId: string; // ObjectId
    tenantId: Types.ObjectId;
    transactions: Types.ObjectId[];

    // Methods
    getDecryptedAccountNumber(): string;

    createdAt: Date;
    updatedAt: Date;
}
