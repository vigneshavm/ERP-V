import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
    type: "stock" | "due" | "payment" | "system";
    message: string;
    read: boolean;
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
        read: {
            type: Boolean,
            default: false,
        },
        relatedItem: {
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
