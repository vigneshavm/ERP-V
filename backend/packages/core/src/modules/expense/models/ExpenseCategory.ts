import mongoose, { Document, Schema } from "mongoose";

export interface IExpenseCategory extends Document {
    name: string;
    monthly_budget: number;
    approval_required: boolean;
    is_cash_allowed: boolean;
    is_active: boolean;
    gst_eligible: boolean;
    color?: string;
    emoji?: string;
    type: "income" | "expense" | "both";
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const expenseCategorySchema = new Schema<IExpenseCategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        monthly_budget: {
            type: Number,
            default: 0,
        },
        approval_required: {
            type: Boolean,
            default: false,
        },
        is_cash_allowed: {
            type: Boolean,
            default: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        gst_eligible: {
            type: Boolean,
            default: false,
        },
        color: {
            type: String,
            default: "#3498db",
        },
        emoji: {
            type: String,
            default: "💰",
        },
        type: {
            type: String,
            enum: ["income", "expense", "both"],
            default: "expense",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Create compound unique index: category name must be unique per user
expenseCategorySchema.index({ name: 1, createdBy: 1 }, { unique: true });

const ExpenseCategory = mongoose.model<IExpenseCategory>("ExpenseCategory", expenseCategorySchema);
export default ExpenseCategory;
