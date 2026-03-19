import mongoose, { Schema } from 'mongoose';
const DocumentSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    extractedData: { type: Object },
    metadata: { type: Object },
}, { timestamps: true });
// Ensure tenant isolation
DocumentSchema.index({ tenantId: 1, createdAt: -1 });
export default mongoose.model('Document', DocumentSchema);
