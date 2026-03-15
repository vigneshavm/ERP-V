import mongoose, { Schema, Document } from "mongoose";

export interface IConflict extends Document {
    tenantId: mongoose.Types.ObjectId;
    ledgerEntryId: string;
    entity: string;
    entityId: string;
    field: string;
    localValue: string;
    remoteValue: string;
    occurredAt: Date;
    status: 'OPEN' | 'RESOLVED';
    createdAt: Date;
    updatedAt: Date;
}

const conflictSchema = new Schema<IConflict>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true
        },
        ledgerEntryId: {
            type: String,
            required: true
        },
        entity: {
            type: String,
            required: true
        },
        entityId: {
            type: String,
            required: true
        },
        field: {
            type: String,
            required: true
        },
        localValue: {
            type: String,
            default: ''
        },
        remoteValue: {
            type: String,
            default: ''
        },
        occurredAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['OPEN', 'RESOLVED'],
            default: 'OPEN'
        }
    },
    { timestamps: true }
);

const Conflict = mongoose.model<IConflict>("Conflict", conflictSchema);
export default Conflict;
