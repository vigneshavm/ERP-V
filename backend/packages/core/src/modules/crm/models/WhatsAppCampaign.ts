import mongoose, { Schema } from "mongoose";
import { IWhatsAppCampaign } from '@smarterp/shared/interfaces/IWhatsApp.js';

const whatsappCampaignSchema = new Schema<IWhatsAppCampaign>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'WhatsAppTemplate' },
    message: { type: String, required: true },
    targetGroups: [{ type: String }],
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'scheduled', 'failed'], default: 'scheduled' },
    scheduleDate: { type: Date },
    attachments: [{ type: String }]
}, { timestamps: true });

const WhatsAppCampaign = mongoose.model<IWhatsAppCampaign>("WhatsAppCampaign", whatsappCampaignSchema);
export default WhatsAppCampaign;
