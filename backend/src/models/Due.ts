import mongoose, { Document, Schema } from "mongoose";

export interface IDue extends Document {
    customer: mongoose.Types.ObjectId;
    amount: number;
    note: string;
    isCleared: boolean;
    lastPaidDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const dueSchema = new Schema<IDue>(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        note: {
            type: String,
            default: "",
        },
        isCleared: {
            type: Boolean,
            default: false,
        },
        lastPaidDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Due = mongoose.model<IDue>("Due", dueSchema);
export default Due;
