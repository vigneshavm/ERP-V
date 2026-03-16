import mongoose, { Schema } from "mongoose";
const conflictSchema = new Schema({
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
}, { timestamps: true });
const Conflict = mongoose.model("Conflict", conflictSchema);
export default Conflict;
