import mongoose, { Schema } from "mongoose";
const notificationSchema = new Schema({
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
    relatedItem: {
        type: Schema.Types.ObjectId,
        ref: "Item",
    },
    relatedCustomer: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
    },
}, { timestamps: true });
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
