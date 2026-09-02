import mongoose, { Document, Schema } from 'mongoose';

export interface IShelf extends Document {
    shelfCode: string;
    shelfType: 'FULL' | 'HALF';
    warehouseId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const shelfSchema = new Schema<IShelf>({
    shelfCode: {
        type: String,
        required: true,
        trim: true
    },
    shelfType: {
        type: String,
        enum: ['FULL', 'HALF'],
        default: 'FULL',
        required: true
    },
    warehouseId: {
        type: String,
        default: 'MAIN_WAREHOUSE',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

shelfSchema.index({ shelfCode: 1, warehouseId: 1 }, { unique: true });

const Shelf = mongoose.model<IShelf>('Shelf', shelfSchema);
export default Shelf;
