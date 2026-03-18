import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IAISession extends Document {
  tenantId: string;
  userId: string;
  messages: IMessage[];
  context?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AISessionSchema: Schema = new Schema({
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

export default mongoose.model<IAISession>('AISession', AISessionSchema);
