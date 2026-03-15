import { Document } from "mongoose";

export interface ITransaction extends Document {
    type: "sale" | "due" | "payment" | "purchase" | "refund" | "return" | "due_adjustment";
    customer?: string; // ObjectId
    invoice?: string; // ObjectId
    return?: string; // ObjectId
    dueAdjustment?: string; // ObjectId
    amount: number;
    paymentMethod: "cash" | "upi" | "card" | "due" | "split" | "bank_transfer" | "cheque" | "credit";
    description?: string;

    createdAt: Date;
    updatedAt: Date;
}
