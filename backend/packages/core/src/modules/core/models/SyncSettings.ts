import mongoose, { Schema, Document } from "mongoose";

export interface ISyncSettings extends Document {
    tenantId: mongoose.Types.ObjectId;
    autoSync: boolean;
    syncInterval: number;
    syncOnWifiOnly: boolean;
    backgroundSync: boolean;
    syncDomains: {
        inventory: boolean;
        sales: boolean;
        customers: boolean;
        finance: boolean;
        reports: boolean;
        loyalty: boolean;
        payments: boolean;
        [key: string]: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const syncSettingsSchema = new Schema<ISyncSettings>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            unique: true,
            index: true
        },
        autoSync: {
            type: Boolean,
            default: true
        },
        syncInterval: {
            type: Number,
            default: 5, // minutes
            enum: [5, 10, 30, 60]
        },
        syncOnWifiOnly: {
            type: Boolean,
            default: false
        },
        backgroundSync: {
            type: Boolean,
            default: true
        },
        syncDomains: {
            inventory: { type: Boolean, default: true },
            sales: { type: Boolean, default: true },
            customers: { type: Boolean, default: true },
            finance: { type: Boolean, default: true },
            reports: { type: Boolean, default: true },
            loyalty: { type: Boolean, default: true },
            payments: { type: Boolean, default: true }
        }
    },
    { timestamps: true }
);

const SyncSettings = mongoose.model<ISyncSettings>("SyncSettings", syncSettingsSchema);
export default SyncSettings;
