import { Document, Types } from "mongoose";

export interface IPersonalTransaction extends Document {
    type: "income" | "expense";
    amount: number;
    category: string | Types.ObjectId; // Refers to ExpenseCategory/PersonalCategory
    account: string | Types.ObjectId; // Refers to BankAccount
    date: Date;
    description?: string;
    isRecurring: boolean;
    recurringId?: string | Types.ObjectId; // Refers to RecurringTransaction
    receipt?: string;
    createdBy: string | Types.ObjectId;
    tenantId: string | Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
