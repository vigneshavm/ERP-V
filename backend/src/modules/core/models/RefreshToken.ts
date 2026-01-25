import mongoose, { Schema } from "mongoose";
import { IRefreshToken } from "../../../interfaces/IRefreshToken.js";

const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user: {
            type: String, // Storing as String (ObjectId) reference would technically allow 'string', but typically we use Schema.Types.ObjectId. 
            // However, the interface defines it as string for simplicity in TS. We can keep it compliant with Mongoose.
            ref: "User",
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isRevoked: {
            type: Boolean,
            default: false,
        },
        revokedAt: {
            type: Date,
        },
        replacedByToken: {
            type: String,
        },
        createdByIp: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if token is expired
refreshTokenSchema.methods.isExpired = function (): boolean {
    return Date.now() >= this.expiresAt.getTime();
};

// Instance method to check if token is active
refreshTokenSchema.methods.isActive = function (): boolean {
    return !this.isRevoked && !this.isExpired();
};

const RefreshToken = mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
export default RefreshToken;
