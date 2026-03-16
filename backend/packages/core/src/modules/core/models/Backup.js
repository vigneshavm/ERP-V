import mongoose, { Schema } from "mongoose";
const backupSchema = new Schema({
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
}, { timestamps: true });
const Backup = mongoose.model("Backup", backupSchema);
export default Backup;
