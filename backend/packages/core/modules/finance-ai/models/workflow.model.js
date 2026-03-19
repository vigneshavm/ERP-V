import mongoose, { Schema } from 'mongoose';
const WorkflowSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    trigger: {
        type: String,
        enum: ['transaction_created', 'anomaly_detected', 'document_processed'],
        required: true
    },
    conditions: [{
            field: { type: String, required: true },
            operator: {
                type: String,
                enum: ['equals', 'greater_than', 'less_than', 'contains'],
                required: true
            },
            value: { type: Schema.Types.Mixed, required: true }
        }],
    actions: [{
            type: { type: String, enum: ['notify', 'categorize', 'alert'], required: true },
            params: { type: Object }
        }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
WorkflowSchema.index({ tenantId: 1, trigger: 1, isActive: 1 });
export default mongoose.model('Workflow', WorkflowSchema);
