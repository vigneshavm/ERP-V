import mongoose, { Document, Schema } from "mongoose";

export interface ISalesOrderItem {
    item: mongoose.Types.ObjectId;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
    reservedQty: number;
    deliveredQty: number;
    invoicedQty: number;
    total: number;
}

export interface ISalesOrder extends Document {
    orderNumber: string;
    customer: mongoose.Types.ObjectId;
    orderDate: Date;
    expectedDeliveryDate: Date;
    items: ISalesOrderItem[];
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    totalAmount: number;
    status: "Draft" | "Confirmed" | "Partially Delivered" | "Delivered" | "Partially Invoiced" | "Invoiced" | "Cancelled";
    notes: string;
    isConfirmed: boolean;
    isCancelled: boolean;
    isOverdue: boolean;
    pricesLocked: boolean;
    deliveryChallans: mongoose.Types.ObjectId[];
    invoices: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    confirmedAt?: Date;
    confirmedBy?: mongoose.Types.ObjectId;
    cancelledAt?: Date;
    cancelledBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const salesOrderItemSchema = new Schema<ISalesOrderItem>({
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
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Tracking fields for conversion
    reservedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    deliveredQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    invoicedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
});

const salesOrderSchema = new Schema<ISalesOrder>(
    {
        orderNumber: {
            type: String,
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        orderDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expectedDeliveryDate: {
            type: Date,
            required: true,
        },
        items: [salesOrderItemSchema],
        subtotal: {
            type: Number,
            required: true,
            default: 0,
        },
        taxTotal: {
            type: Number,
            default: 0,
        },
        discountTotal: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: [
                "Draft",
                "Confirmed",
                "Partially Delivered",
                "Delivered",
                "Partially Invoiced",
                "Invoiced",
                "Cancelled",
            ],
            default: "Draft",
        },
        notes: {
            type: String,
            default: "",
        },
        // Flags
        isConfirmed: {
            type: Boolean,
            default: false,
        },
        isCancelled: {
            type: Boolean,
            default: false,
        },
        isOverdue: {
            type: Boolean,
            default: false,
        },
        pricesLocked: {
            type: Boolean,
            default: false,
        },
        // Conversion tracking
        deliveryChallans: [
            {
                type: Schema.Types.ObjectId,
                ref: "DeliveryChallan",
            },
        ],
        invoices: [
            {
                type: Schema.Types.ObjectId,
                ref: "Invoice",
            },
        ],
        // Audit fields
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        confirmedAt: {
            type: Date,
        },
        confirmedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        cancelledAt: {
            type: Date,
        },
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Create compound unique index: orderNumber must be unique per user
salesOrderSchema.index({ orderNumber: 1, createdBy: 1 }, { unique: true });

// Index for faster queries
salesOrderSchema.index({ customer: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ expectedDeliveryDate: 1 });
salesOrderSchema.index({ createdAt: -1 });

const SalesOrder = mongoose.model<ISalesOrder>("SalesOrder", salesOrderSchema);
export default SalesOrder;
