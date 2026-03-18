import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  tenantId: string;
  filename: string;
  fileUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
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

export default mongoose.model<IDocument>('Document', DocumentSchema);
