import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessType extends Document {
    name: string;
    slug: string; // retail, wholesale, etc.
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const businessTypeSchema = new Schema<IBusinessType>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const BusinessType = mongoose.model<IBusinessType>('BusinessType', businessTypeSchema);

export default BusinessType;
