import mongoose, { Schema } from "mongoose";
const expenseCategorySchema = new Schema({
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
}, { timestamps: true });
// Create compound unique index: category name must be unique per user
expenseCategorySchema.index({ name: 1, createdBy: 1 }, { unique: true });
const ExpenseCategory = mongoose.model("ExpenseCategory", expenseCategorySchema);
export default ExpenseCategory;
