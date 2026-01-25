import { Document, Types } from "mongoose";

export interface IWhatsAppTemplate extends Document {
    userId: Types.ObjectId;
    name: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWhatsAppCampaign extends Document {
    userId: Types.ObjectId;
    name: string;
    templateId?: Types.ObjectId;
    message: string;
    targetGroups: string[];
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    status: 'completed' | 'scheduled' | 'failed';
    scheduleDate?: Date;
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
}
