import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflow extends Document {
  tenantId: string;
  name: string;
  trigger: 'transaction_created' | 'anomaly_detected' | 'document_processed';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }>;
  actions: Array<{
    type: 'notify' | 'categorize' | 'alert';
    params: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema({
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

export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
