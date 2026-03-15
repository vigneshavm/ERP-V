import { Document, Types } from "mongoose";

export interface ILoyaltyTransaction extends Document {
    customer: string | Types.ObjectId;
    type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
    points: number;
    invoice?: string | Types.ObjectId;
    description: string;
    owner: string | Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
