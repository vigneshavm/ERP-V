import mongoose, { Document, Schema, Model, ClientSession } from "mongoose";

export interface ICounter extends Document {
    name: string;
    seq: number;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for static methods
interface ICounterModel extends Model<ICounter> {
    getNextSequence(counterName: string, userId: string | mongoose.Types.ObjectId, session?: ClientSession | null): Promise<number>;
}

/**
 * Counter model for atomic sequence generation
 * Used for invoice numbers, order numbers, etc.
 */
const counterSchema = new Schema<ICounter>(
    {
        name: {
            type: String,
            required: true,
        },
        seq: {
            type: Number,
            default: 0,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound unique index to ensure one counter per user per type
counterSchema.index({ name: 1, userId: 1 }, { unique: true });

/**
 * Get next sequence number atomically
 * @param {String} counterName - Name of the counter (e.g., 'invoice', 'order')
 * @param {ObjectId} userId - User ID for multi-tenant isolation
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Number} Next sequence number
 */
counterSchema.statics.getNextSequence = async function (counterName: string, userId: string | mongoose.Types.ObjectId, session: ClientSession | null = null): Promise<number> {
    const options = session ? { session, new: true, upsert: true } : { new: true, upsert: true };

    const counter = await this.findOneAndUpdate(
        { name: counterName, userId },
        { $inc: { seq: 1 } },
        options
    );

    return counter.seq;
};

const Counter = mongoose.model<ICounter, ICounterModel>("Counter", counterSchema);
export default Counter;
