import mongoose, { Schema } from "mongoose";
const deliveryChallanItemSchema = new Schema({
    item: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    deliveredQty: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        default: "pcs",
    },
    description: {
        type: String,
        default: "",
    },
});
const deliveryChallanSchema = new Schema({
    challanNumber: {
        type: String,
        required: true,
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    challanDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deliveryDate: {
        type: Date,
    },
    items: [deliveryChallanItemSchema],
    // Sales Order reference (optional - only if created from SO)
    salesOrder: {
        type: Schema.Types.ObjectId,
        ref: "SalesOrder",
    },
    // Transport details
    vehicleNo: {
        type: String,
        default: "",
    },
    driverName: {
        type: String,
        default: "",
    },
    transportMode: {
        type: String,
        enum: ["road", "rail", "air", "ship", "courier"],
        default: "road",
    },
    notes: {
        type: String,
        default: "",
    },
    // Status tracking
    status: {
        type: String,
        enum: ["Draft", "Delivered", "Converted"],
        default: "Draft",
    },
    // Invoice conversion tracking
    convertedToInvoice: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
    },
    convertedAt: {
        type: Date,
    },
    // System-generated flag (for SO → Invoice without explicit DC)
    systemGenerated: {
        type: Boolean,
        default: false,
    },
    // Soft delete support
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // Audit fields
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true
    },
}, { timestamps: true });
// Create compound unique index: challanNumber must be unique per tenant
deliveryChallanSchema.index({ challanNumber: 1, tenantId: 1 }, { unique: true });
// Index for faster queries
deliveryChallanSchema.index({ customer: 1 });
deliveryChallanSchema.index({ salesOrder: 1 });
deliveryChallanSchema.index({ createdAt: -1 });
const DeliveryChallan = mongoose.model("DeliveryChallan", deliveryChallanSchema);
export default DeliveryChallan;
