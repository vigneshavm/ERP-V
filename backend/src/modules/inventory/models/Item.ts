import mongoose, { Schema } from "mongoose";
import { IItem } from "../../../interfaces/IItem.js";

const itemSchema = new Schema<IItem>(
    {
        name: {
            type: String,
            required: true,
        },
        sku: {
            type: String,
        },
        category: {
            type: String,
        },
        costPrice: {
            type: Number,
            required: true,
        },
        sellingPrice: {
            type: Number,
            required: true,
        },
        stockQty: {
            type: Number,
            default: 0,
            min: 0,
        },
        reservedStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        inTransitStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        lowStockLimit: {
            type: Number,
            default: 5,
        },
        unit: {
            type: String,
            default: "pcs",
        },
        color: {
            type: String,
        },
        size: {
            type: String,
        },
        washingInstructions: {
            type: String,
        },
        categoryCode: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        addedBy: {
            type: String,
            ref: "User",
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Virtual field for available stock (never negative)
itemSchema.virtual("availableStock").get(function (this: IItem) {
    return Math.max(this.stockQty - this.reservedStock, 0);
});

// Virtual field for over-committed stock
itemSchema.virtual("overCommittedStock").get(function (this: IItem) {
    return Math.max(this.reservedStock - this.stockQty, 0);
});

// Ensure virtuals are included in JSON
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

// Compound index to ensure item name is unique PER TENANT
itemSchema.index({ name: 1, tenantId: 1 }, { unique: true });
// We can keep addedBy index if needed for user-specific queries, but tenantId is primary scope.

const Item = mongoose.model<IItem>("Item", itemSchema);
export default Item;
