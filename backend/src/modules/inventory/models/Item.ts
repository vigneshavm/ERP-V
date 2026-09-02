import mongoose, { Schema } from "mongoose";
import { IItem } from "../../../interfaces/IItem.js";

// IBatch interface removed as it was unused locally

// Extend IItem locally if needed, or assume IItem will be updated in its definition file.
// For Mongoose schema, we can define the shape directly.


const itemSchema = new Schema<IItem>(
    {
        name: {
            type: String,
            required: true,
        },
        sku: {
            type: String,
        },
        barcode: {
            type: String,
            trim: true,
            index: true
        },
        hsnCode: {
            type: String,
            trim: true,
            index: true  // For GSTR-1 aggregation queries
        },
        gstRate: {
            type: Number,
            enum: [0, 5, 12, 18, 28],
            default: 0
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
        brand: {
            type: String,
            index: true
        },
        shelfCode: {
            type: String,
            index: true
        },
        shelfType: {
            type: String,
            enum: ['FULL', 'HALF'],
            default: 'FULL'
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
        },
        // Inventory Tracking
        valuationMethod: {
            type: String,
            enum: ['FIFO', 'WAC'],
            default: 'WAC'
        },
        batches: [{
            batchNumber: String,
            expiryDate: Date,
            quantity: Number,
            costPrice: Number, // Cost for this specific batch
            supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
            receivedDate: { type: Date, default: Date.now }
        }],
        // Warehouse Location & Bin Partitioning
        warehouseId: {
            type: String,
            default: 'MAIN_WAREHOUSE'
        },
        binLocation: {
            type: String, // e.g. RACK-A-SHELF-02
            default: 'A-01'
        },
        warehouseLevels: [{
            warehouseId: { type: String, required: true },
            binLocation: { type: String },
            qty: { type: Number, default: 0 }
        }],
        storeLevels: [{
            storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
            qty: { type: Number, default: 0 },
            reservedQty: { type: Number, default: 0 }
        }]
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
