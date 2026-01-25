import { Document, Types } from "mongoose";

export interface IShopSettings extends Document {
    userId: Types.ObjectId;
    shopEnabled: boolean;
    customDomain?: string;
    theme: string;
    supportEmail?: string;
    plan: 'Starter' | 'Professional' | 'Enterprise';
    productsLimit: number;
    apiAccess: boolean;
    whiteLabeling: boolean;
    createdAt: Date;
    updatedAt: Date;
}
