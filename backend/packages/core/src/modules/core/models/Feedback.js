import mongoose, { Schema } from "mongoose";
const feedbackSchema = new Schema({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['bug', 'feature', 'general', 'billing'],
        default: 'general'
    },
    feedback: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    email: {
        type: String
    }
}, { timestamps: true });
const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
