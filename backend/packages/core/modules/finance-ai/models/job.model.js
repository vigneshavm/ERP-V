import mongoose, { Schema } from 'mongoose';
const JobSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['document_extraction', 'report_generation', 'prediction_calc'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: { type: Number, default: 0 },
    result: { type: Schema.Types.Mixed },
    error: {
        code: { type: String },
        message: { type: String },
        details: { type: Schema.Types.Mixed }
    },
}, { timestamps: true });
JobSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
export default mongoose.model('Job', JobSchema);
