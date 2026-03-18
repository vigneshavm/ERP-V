import mongoose, { Schema, Document } from 'mongoose';

export interface IPrediction extends Document {
  tenantId: string;
  type: 'cashflow_forecast' | 'anomaly_detection';
  inputData: Record<string, any>;
  result: Record<string, any>;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['cashflow_forecast', 'anomaly_detection'], required: true },
  inputData: { type: Object, required: true },
  result: { type: Object, required: true },
  accuracy: { type: Number },
}, { timestamps: true });

PredictionSchema.index({ tenantId: 1, type: 1, createdAt: -1 });

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
