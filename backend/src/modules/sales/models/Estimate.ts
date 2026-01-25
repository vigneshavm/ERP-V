import mongoose, { Document, Schema } from "mongoose";

export interface IEstimateItem {
    itemId?: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface IEstimate extends Document {
    estimateNo: string;
    customer?: mongoose.Types.ObjectId;
    items: IEstimateItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    notes: string;
    status: "draft" | "sent" | "accepted" | "rejected" | "expired";
    validUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const estimateSchema = new Schema<IEstimate>({
    estimateNo: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        default: null // null means Walk-in Customer
    },
    items: [{
        itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item"
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["draft", "sent", "accepted", "rejected", "expired"],
        default: "draft"
    },
    validUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
// Note: estimateNo already has unique: true, which creates an index automatically
estimateSchema.index({ customer: 1 });
estimateSchema.index({ createdAt: -1 });

const Estimate = mongoose.model<IEstimate>("Estimate", estimateSchema);
export default Estimate;
