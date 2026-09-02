import mongoose, { Document, Schema } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const brandSchema = new Schema<IBrand>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Brand = mongoose.model<IBrand>('Brand', brandSchema);
export default Brand;
