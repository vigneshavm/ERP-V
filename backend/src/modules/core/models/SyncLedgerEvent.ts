import mongoose, { Schema, Document } from "mongoose";

// One sync outcome reported by a device (frontend SyncIntelligenceService.logEvent), collected per
// tenant so the Sync Intelligence ledger shows every device's syncs, not just the viewer's own.
export interface ISyncLedgerEvent extends Document {
    tenantId: mongoose.Types.ObjectId;
    eventId: string;
    deviceId: string;
    branchId: string;
    eventType: string;
    entityId: string;
    entityType: string;
    status: 'SYNCED' | 'PENDING' | 'CONFLICT' | 'FAILED';
    payload: Record<string, unknown>;
    hash: string;
    timestamp: Date;
    reportedBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const syncLedgerEventSchema = new Schema<ISyncLedgerEvent>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        // Id the device generated for the event; re-uploads of the same event are ignored.
        eventId: { type: String, required: true },
        deviceId: { type: String, required: true },
        branchId: { type: String, default: '' },
        eventType: { type: String, required: true },
        entityId: { type: String, required: true },
        entityType: { type: String, required: true },
        status: { type: String, enum: ['SYNCED', 'PENDING', 'CONFLICT', 'FAILED'], required: true },
        payload: { type: Schema.Types.Mixed, default: {} },
        hash: { type: String, default: '' },
        timestamp: { type: Date, required: true },
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

syncLedgerEventSchema.index({ tenantId: 1, eventId: 1 }, { unique: true });
syncLedgerEventSchema.index({ tenantId: 1, timestamp: -1 });
// Same 30-day retention the device-side log uses.
syncLedgerEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const SyncLedgerEvent = mongoose.model<ISyncLedgerEvent>("SyncLedgerEvent", syncLedgerEventSchema);
export default SyncLedgerEvent;
