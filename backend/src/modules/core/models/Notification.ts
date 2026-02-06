import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
    type: "stock" | "due" | "payment" | "system";
    message: string;
    readAt?: Date | null;
    relatedEntity?: mongoose.Types.ObjectId;
    onModel?: string;
    recipient: mongoose.Types.ObjectId; // User ID
    relatedItem?: mongoose.Types.ObjectId;
    relatedCustomer?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        type: {
            type: String,
            enum: ["stock", "due", "payment", "system"],
            default: "system",
        },
        message: {
            type: String,
            required: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        relatedEntity: {
            type: Schema.Types.ObjectId,
            refPath: 'onModel',
        },
        onModel: {
            type: String,
            required: false,
            enum: ['Bill', 'Supplier', 'PaymentOut', 'Item', 'Customer']
        },
        recipient: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        relatedItem: { // keeping for backward compatibility but marking deprecated in types if we were using TS strictly
            type: Schema.Types.ObjectId,
            ref: "Item",
        },
        relatedCustomer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
