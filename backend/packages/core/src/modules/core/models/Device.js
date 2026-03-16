import mongoose, { Schema } from "mongoose";
const deviceSchema = new Schema({
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
}, { timestamps: true });
const Device = mongoose.model("Device", deviceSchema);
export default Device;
