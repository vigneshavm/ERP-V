import mongoose, { Schema, Document } from "mongoose";

export interface ITenant extends Document {
    name: string;
    slug: string; // Unique identifier for URLs/Subdomains
    ownerId: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    config: {
        theme: {
            primaryColor: string;
            logoUrl: string;
        };
        currency: string;
        timezone: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>({
    name: {
        type: String,
        required: [true, "Please enter business name"]
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
        default: 'ACTIVE'
    },
    config: {
        theme: {
            primaryColor: { type: String, default: '#007bff' },
            logoUrl: { type: String, default: '' }
        },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' }
    }
}, { timestamps: true });

const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export default Tenant;
