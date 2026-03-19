import mongoose, { Schema } from 'mongoose';
const ReportSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: ['p&l', 'cashflow', 'balance_sheet'], required: true },
    period: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    result: { type: Object },
    error: { type: String },
}, { timestamps: true });
ReportSchema.index({ tenantId: 1, type: 1, 'period.start': -1 });
export default mongoose.model('Report', ReportSchema);
