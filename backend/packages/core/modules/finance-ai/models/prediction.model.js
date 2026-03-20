import mongoose, { Schema } from 'mongoose';
const PredictionSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: ['cashflow_forecast', 'anomaly_detection'], required: true },
    inputData: { type: Object, required: true },
    result: { type: Object, required: true },
    accuracy: { type: Number },
}, { timestamps: true });
PredictionSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
export default mongoose.model('Prediction', PredictionSchema);
