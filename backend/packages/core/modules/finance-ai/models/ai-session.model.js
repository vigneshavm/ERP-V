import mongoose, { Schema } from 'mongoose';
const AISessionSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [{
            role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }],
    context: { type: Object },
}, { timestamps: true });
AISessionSchema.index({ tenantId: 1, userId: 1, updatedAt: -1 });
export default mongoose.model('AISession', AISessionSchema);
