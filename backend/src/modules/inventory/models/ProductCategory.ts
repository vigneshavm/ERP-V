import mongoose, { Document, Schema } from 'mongoose';

export interface IProductCategoryModel extends Document {
    name: string;
    description?: string;
    businessSectorId: Schema.Types.ObjectId;
    status: 'ACTIVE' | 'INACTIVE';
    // Optional defaults carried over from source data (e.g. the POS Quick
    // Entry Product Type master) so a sector's mapped categories can retain
    // real-world GST/unit info instead of being name-only labels.
    gstRate?: number;
    defaultUnit?: string;
    createdAt: Date;
    updatedAt: Date;
}

const productCategorySchema = new Schema<IProductCategoryModel>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    businessSectorId: {
        type: Schema.Types.ObjectId,
        ref: 'BusinessSector',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    gstRate: {
        type: Number,
        enum: [0, 5, 12, 18, 28]
    },
    defaultUnit: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index to prevent duplicate category names within the same business sector
productCategorySchema.index({ name: 1, businessSectorId: 1 }, { unique: true });

const ProductCategoryModel = mongoose.model<IProductCategoryModel>('ProductCategoryModel', productCategorySchema);

export default ProductCategoryModel;
