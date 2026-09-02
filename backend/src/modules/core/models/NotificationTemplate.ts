import mongoose, { Schema, Document } from "mongoose";

export interface INotificationTemplate extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    templateKey: string;
    channel: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_APP';
    subject?: string;
    content: string;
    variables: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplate>(
    {
        tenantId: { type: Schema.Types.Mixed, required: true, index: true },
        templateKey: { type: String, required: true },
        channel: {
            type: String,
            enum: ['SMS', 'EMAIL', 'WHATSAPP', 'IN_APP'],
            required: true
        },
        subject: { type: String, default: "" },
        content: { type: String, required: true },
        variables: [{ type: String }],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

notificationTemplateSchema.index({ tenantId: 1, templateKey: 1, channel: 1 });

const NotificationTemplate = mongoose.models.NotificationTemplate || mongoose.model<INotificationTemplate>("NotificationTemplate", notificationTemplateSchema);
export default NotificationTemplate;
