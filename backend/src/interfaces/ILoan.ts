import { Document, Types } from "mongoose";

export interface ILoan extends Document {
    name: string;
    principalAmount: number;
    interestRate: number; // percentage per annum
    termMonths: number;
    emiAmount: number; // calculated monthly EMI
    totalPendingAmount: number; // starts as principal + total interest
    startDate: Date;
    status: "active" | "closed";
    tenantId: Types.ObjectId; // Reference to Tenant
    userId: string; // Reference to User
    createdAt: Date;
    updatedAt: Date;
}
