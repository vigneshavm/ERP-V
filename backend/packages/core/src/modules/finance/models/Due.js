import mongoose, { Schema } from "mongoose";
const dueSchema = new Schema({
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
}, { timestamps: true });
const Due = mongoose.model("Due", dueSchema);
export default Due;
