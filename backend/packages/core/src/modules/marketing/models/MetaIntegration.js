import mongoose, { Schema } from 'mongoose';
const MetaIntegrationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facebookUserId: { type: String, required: true },
    accessToken: { type: String, required: true },
    tokenExpiry: { type: Date },
    connectedPages: [{
            pageId: { type: String, required: true },
            name: { type: String, required: true },
            accessToken: { type: String },
            isConnected: { type: Boolean, default: false },
            instagramBusinessAccountId: { type: String }
        }],
    adAccounts: [{
            accountId: { type: String, required: true },
            name: { type: String, required: true },
            isConnected: { type: Boolean, default: false }
        }],
    whatsappBusinessAccounts: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            isConnected: { type: Boolean, default: false }
        }]
}, {
    timestamps: true
});
// Compound index to ensure one integration per user (or remove if multiple allowed)
MetaIntegrationSchema.index({ user: 1 }, { unique: true });
export const MetaIntegration = mongoose.model('MetaIntegration', MetaIntegrationSchema);
