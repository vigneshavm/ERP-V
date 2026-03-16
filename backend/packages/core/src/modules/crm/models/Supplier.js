import mongoose, { Schema } from "mongoose";
const supplierSchema = new Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
    },
    supplierId: {
        type: String,
        unique: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    contactPersonName: {
        type: String,
        required: false,
    },
    contactNo: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
    },
    physicalAddress: {
        type: String,
        required: false,
    },
    gstNo: {
        type: String,
        required: false,
    },
    supplierType: {
        type: String,
        enum: ["manufacturer", "wholesaler", "distributor"],
        required: false,
    },
    openingBalance: {
        type: Number,
        default: 0,
    },
    balanceType: {
        type: String,
        enum: ["payable", "receivable"],
        default: "payable",
    },
    creditPeriod: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    itemsSupplied: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
        },
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
}, { timestamps: true });
// Compound index to ensure contactNo is unique per tenant
supplierSchema.index({ contactNo: 1, tenantId: 1 }, { unique: true });
const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
export default Supplier;
