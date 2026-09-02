import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessSector extends Document {
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    // Short code matching frontend/src/types/common.ts's Sector enum (e.g.
    // 'Textile'), as opposed to `name` which is the long display name (e.g.
    // 'Textile & Garments Retail'). Tenant.sector, POS template selection,
    // and the Inventory Categories page's sector filter all use the short
    // code, so this is what lets those features look up this sector's
    // mapped product categories.
    shortCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

const businessSectorSchema = new Schema<IBusinessSector>({
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
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    shortCode: {
        type: String,
        trim: true,
        index: true
    }
}, {
    timestamps: true
});

const BusinessSector = mongoose.model<IBusinessSector>('BusinessSector', businessSectorSchema);

export default BusinessSector;
