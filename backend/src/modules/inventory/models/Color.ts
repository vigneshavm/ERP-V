import mongoose, { Document, Schema } from 'mongoose';

export interface IColor extends Document {
    name: string;
    hexCode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const colorSchema = new Schema<IColor>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    hexCode: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Color = mongoose.model<IColor>('Color', colorSchema);
export default Color;
