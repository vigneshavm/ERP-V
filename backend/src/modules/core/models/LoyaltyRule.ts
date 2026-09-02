import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyRule extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    ruleId: string;
    ruleName: string;
    spendPerPoint: number;
    rupeesPer100Points: number;
    bonusMultiplier: number;
    minSpendRequired: number;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const loyaltyRuleSchema = new Schema<ILoyaltyRule>(
    {
        tenantId: { type: Schema.Types.Mixed, required: true, index: true },
        ruleId: { type: String, required: true },
        ruleName: { type: String, required: true },
        spendPerPoint: { type: Number, required: true, default: 100 },
        rupeesPer100Points: { type: Number, required: true, default: 10 },
        bonusMultiplier: { type: Number, default: 1.0 },
        minSpendRequired: { type: Number, default: 0 },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

loyaltyRuleSchema.index({ tenantId: 1, ruleId: 1 });

const LoyaltyRule = mongoose.models.LoyaltyRule || mongoose.model<ILoyaltyRule>("LoyaltyRule", loyaltyRuleSchema);
export default LoyaltyRule;
