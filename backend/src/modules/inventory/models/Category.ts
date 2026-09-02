import mongoose, { Schema, Document } from "mongoose";

// Standalone category "master" record. Historically this app derived its
// entire Categories list by aggregating the free-text `category` field on
// Item documents — which meant a category only existed once at least one
// item used it, so there was no way to register a category ahead of time.
// This model lets a category be created on its own; CategoryService merges
// these with the item-derived aggregation so both kinds show up together.
export interface ICategoryDoc extends Document {
    name: string;
    description?: string;
    color: string;
    gstRate: number;
    defaultUnit: string;
    isActive: boolean;
    tenantId: mongoose.Types.ObjectId;
}

const categorySchema = new Schema<ICategoryDoc>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            default: '#6366f1',
        },
        gstRate: {
            type: Number,
            enum: [0, 5, 12, 18, 28],
            default: 5,
        },
        defaultUnit: {
            type: String,
            default: 'pcs',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Category names are unique per tenant (case-sensitive at the index level —
// CategoryService does a case-insensitive check before insert so "Apparel"
// and "apparel" can't both be created).
categorySchema.index({ name: 1, tenantId: 1 }, { unique: true });

const Category = mongoose.model<ICategoryDoc>("Category", categorySchema);
export default Category;
