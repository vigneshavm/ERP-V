import mongoose, { Schema, Document } from "mongoose";

export interface IBackup extends Document {
    tenantId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    size: number; // bytes
    destination: 'LOCAL' | 'GOOGLE_DRIVE';
    status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'SCHEDULED';
    modules: string[];
    log?: string;
    createdAt: Date;
    updatedAt: Date;
}

const backupSchema = new Schema<IBackup>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true
        },
        date: {
            type: String,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            default: 0
        },
        destination: {
            type: String,
            enum: ['LOCAL', 'GOOGLE_DRIVE'],
            default: 'LOCAL'
        },
        status: {
            type: String,
            enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS', 'SCHEDULED'],
            default: 'SCHEDULED'
        },
        modules: [{
            type: String
        }],
        log: {
            type: String
        }
    },
    { timestamps: true }
);

const Backup = mongoose.model<IBackup>("Backup", backupSchema);
export default Backup;
