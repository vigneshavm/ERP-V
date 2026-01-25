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
        addedBy: {
            type: String, // Or Schema.Types.ObjectId, usually string works fine for TS but for Mongoose validation Schema.Types.ObjectId is safer. Keeping consistent with User ref
            ref: "User",
            required: true,
        },
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

// Compound index to ensure item name is unique per owner
itemSchema.index({ name: 1, addedBy: 1 }, { unique: true });

const Item = mongoose.model<IItem>("Item", itemSchema);
export default Item;
