import mongoose, { Document, Schema } from "mongoose";

export interface IRecurringExpense extends Document {
    category: string;
    amount: number;
    frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
    vendor?: string;
    next_due: Date;
    branch_id?: string;
    branch_name?: string;
    description?: string;
    is_active: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const recurringExpenseSchema = new Schema<IRecurringExpense>(
    {
        category: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        frequency: {
            type: String,
            enum: ["MONTHLY", "QUARTERLY", "YEARLY"],
            default: "MONTHLY",
        },
        vendor: {
            type: String,
            trim: true,
        },
        next_due: {
            type: Date,
            required: true,
        },
        branch_id: {
            type: String,
            trim: true,
        },
        branch_name: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const RecurringExpense = mongoose.model<IRecurringExpense>("RecurringExpense", recurringExpenseSchema);
export default RecurringExpense;
