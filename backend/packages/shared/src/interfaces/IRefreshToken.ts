import { Document } from "mongoose";

export interface IRefreshToken extends Document {
    token: string;
    user: string; // ObjectId as string
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt?: Date;
    replacedByToken?: string;
    createdByIp?: string;
    userAgent?: string;

    createdAt: Date;
    updatedAt: Date;

    // Methods
    isExpired(): boolean;
    isActive(): boolean;
}
