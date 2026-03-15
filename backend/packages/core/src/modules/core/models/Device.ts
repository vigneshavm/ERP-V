import mongoose, { Schema, Document } from "mongoose";

export interface IDevice extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    branchId: string;
    userId: string;
    platform: 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Web';
    osVersion: string;
    appVersion: string;
    lastSyncAt: Date;
    lastOnlineAt: Date;
    ipAddress: string;
    status: 'ACTIVE' | 'OFFLINE' | 'SUSPENDED' | 'INACTIVE';
    isOnline: boolean;
    syncHealth: number;
    errorRate: number;
    pendingOps: number;
    createdAt: Date;
    updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true
        },
        branchId: {
            type: String,
            default: ''
        },
        userId: {
            type: String, // Can be ObjectId if needed, currently string based on frontend types
            required: true
        },
        platform: {
            type: String,
            required: true,
            enum: ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'Web']
        },
        osVersion: {
            type: String,
            default: ''
        },
        appVersion: {
            type: String,
            default: ''
        },
        lastSyncAt: {
            type: Date,
            default: Date.now
        },
        lastOnlineAt: {
            type: Date,
            default: Date.now
        },
        ipAddress: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'OFFLINE', 'SUSPENDED', 'INACTIVE'],
            default: 'ACTIVE'
        },
        isOnline: {
            type: Boolean,
            default: true
        },
        syncHealth: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        },
        errorRate: {
            type: Number,
            default: 0
        },
        pendingOps: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const Device = mongoose.model<IDevice>("Device", deviceSchema);
export default Device;
