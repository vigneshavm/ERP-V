import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantEcommerce extends Document {
    tenantId: mongoose.Types.ObjectId;
    isEnabled: boolean;
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    trialEndsAt?: Date;
    domain?: string;
    theme: string;
    features: {
        paymentGatewayEnabled: boolean;
        customerPortalEnabled: boolean;
        orderManagementEnabled: boolean;
    };
}

const TenantEcommerceSchema: Schema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true, index: true },
    isEnabled: { type: Boolean, default: false },
    plan: {
        type: String,
        enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
        default: 'STARTER'
    },
    trialEndsAt: { type: Date },
    domain: { type: String },
    theme: { type: String, default: 'MODERN' },

    // Grouped Feature Flags
    features: {
        paymentGatewayEnabled: { type: Boolean, default: false },
        customerPortalEnabled: { type: Boolean, default: false },
        orderManagementEnabled: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

export default mongoose.model<ITenantEcommerce>('TenantEcommerce', TenantEcommerceSchema);
