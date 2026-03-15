import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
    tenantId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    type: string;
    feedback: string;
    rating?: number;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
    {
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
    },
    { timestamps: true }
);

const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);
export default Feedback;
