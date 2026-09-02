import mongoose, { Schema, Document } from "mongoose";

export interface ISegmentRule extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    segmentName: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'LOYAL' | 'HIGH_VALUE' | 'INACTIVE';
    minSpend: number;
    minOrders: number;
    inactiveDaysThreshold: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const segmentRuleSchema = new Schema<ISegmentRule>(
    {
        tenantId: { type: Schema.Types.Mixed, required: true, index: true },
        segmentName: {
            type: String,
            enum: ['NEW', 'OCCASIONAL', 'REGULAR', 'LOYAL', 'HIGH_VALUE', 'INACTIVE'],
            required: true
        },
        minSpend: { type: Number, required: true, default: 0 },
        minOrders: { type: Number, required: true, default: 0 },
        inactiveDaysThreshold: { type: Number, required: true, default: 90 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

segmentRuleSchema.index({ tenantId: 1, segmentName: 1 });

const SegmentRule = mongoose.models.SegmentRule || mongoose.model<ISegmentRule>("SegmentRule", segmentRuleSchema);
export default SegmentRule;
