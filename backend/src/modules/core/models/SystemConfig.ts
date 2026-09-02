import mongoose, { Schema, Document } from "mongoose";

export interface ISystemConfig extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    key: string;
    value: any;
    description?: string;
    group: 'TAX' | 'LOYALTY' | 'CREDIT' | 'INVENTORY' | 'MARKETING' | 'PAYMENT' | 'GENERAL';
    updatedBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
    {
        tenantId: { type: Schema.Types.Mixed, required: true, index: true },
        key: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        description: { type: String, default: "" },
        group: {
            type: String,
            enum: ['TAX', 'LOYALTY', 'CREDIT', 'INVENTORY', 'MARKETING', 'PAYMENT', 'GENERAL'],
            default: 'GENERAL',
            required: true
        },
        updatedBy: { type: Schema.Types.Mixed }
    },
    { timestamps: true }
);

systemConfigSchema.index({ tenantId: 1, key: 1 }, { unique: true });

const SystemConfig = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>("SystemConfig", systemConfigSchema);
export default SystemConfig;
