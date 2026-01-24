import { Document, Types } from "mongoose";

export interface IExpense extends Document {
    expenseNo: string;
    date: Date;
    category: "Rent" | "Utilities" | "Salaries" | "Transportation" | "Marketing" | "Office Supplies" | "Maintenance" | "Insurance" | "Professional Fees" | "Miscellaneous" | "Travel" | "Electricity" | "Salary" | "Food & Refreshments" | "Other";
    amount: number;
    paymentMethod: "cash" | "upi" | "card" | "cheque" | "bank_transfer";
    bankAccount?: string | Types.ObjectId; // ObjectId ref to BankAccount
    description?: string;
    receipt?: string;
    createdBy: string | Types.ObjectId; // ObjectId ref to User

    createdAt: Date;
    updatedAt: Date;
}
