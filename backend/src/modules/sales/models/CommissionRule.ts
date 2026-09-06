import mongoose, { Schema } from 'mongoose';
import { ICommissionRule } from '../../../interfaces/ICommissionRule.js';

// See ICommissionRule.ts for the full rationale/scope of this rule engine.
const CommissionRuleSchema: Schema = new Schema<ICommissionRule>({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    scope: { type: String, enum: ['ITEM', 'CATEGORY', 'ALL'], required: true, default: 'ALL' },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
    category: { type: String },
    rateType: { type: String, enum: ['PERCENT', 'FLAT'], required: true, default: 'PERCENT' },
    rateValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
    timestamps: true
});

CommissionRuleSchema.index({ tenantId: 1, employeeId: 1, scope: 1, itemId: 1, category: 1 });

const CommissionRule = mongoose.models.CommissionRule || mongoose.model<ICommissionRule>('CommissionRule', CommissionRuleSchema);
export default CommissionRule;
