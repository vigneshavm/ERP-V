import mongoose, { Document, Schema } from 'mongoose';

export interface ISize extends Document {
    name: string;
    code?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const sizeSchema = new Schema<ISize>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Size = mongoose.model<ISize>('Size', sizeSchema);
export default Size;
