import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryChallanItem {
    item: mongoose.Types.ObjectId;
    quantity: number;
    deliveredQty: number;
    unit: string;
    description: string;
}

export interface IDeliveryChallan extends Document {
    challanNumber: string;
    customer: mongoose.Types.ObjectId;
    challanDate: Date;
    deliveryDate?: Date;
    items: IDeliveryChallanItem[];
    salesOrder?: mongoose.Types.ObjectId;
    vehicleNo: string;
    driverName: string;
    transportMode: "road" | "rail" | "air" | "ship" | "courier";
    notes: string;
    status: "Draft" | "Delivered" | "Converted";
    convertedToInvoice?: mongoose.Types.ObjectId;
    convertedAt?: Date;
    systemGenerated: boolean;
    isDeleted: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const deliveryChallanItemSchema = new Schema<IDeliveryChallanItem>({
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

const deliveryChallanSchema = new Schema<IDeliveryChallan>(
    {
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
    },
    { timestamps: true }
);

// Create compound unique index: challanNumber must be unique per user
deliveryChallanSchema.index({ challanNumber: 1, createdBy: 1 }, { unique: true });

// Index for faster queries
deliveryChallanSchema.index({ customer: 1 });
deliveryChallanSchema.index({ salesOrder: 1 });
deliveryChallanSchema.index({ createdAt: -1 });

const DeliveryChallan = mongoose.model<IDeliveryChallan>("DeliveryChallan", deliveryChallanSchema);
export default DeliveryChallan;
