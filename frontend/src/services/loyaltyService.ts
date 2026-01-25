import { LoyaltyConfig, LoyaltyRule, LoyaltyTier, LoyaltyTransaction, LoyaltyWallet } from "../../../src/types/tenant";

export const LoyaltyService = {
    /**
     * Calculates points to be earned for a transaction
     */
    calculateEarnedPoints: (config: LoyaltyConfig, billAmount: number, category?: string, branchId?: string, customerTierId?: string): number => {
        if (!config.isEnabled) return 0;

        let totalPoints = 0;
        const activeRules = config.rules.filter(r => r.isActive && r.type === 'EARNING');

        for (const rule of activeRules) {
            // Check conditions
            if (rule.conditions.minBillAmount && billAmount < rule.conditions.minBillAmount) continue;
            if (rule.conditions.categories && category && !rule.conditions.categories.includes(category)) continue;
            if (rule.conditions.branches && branchId && !rule.conditions.branches.includes(branchId)) continue;
            if (rule.conditions.customerTiers && customerTierId && !rule.conditions.customerTiers.includes(customerTierId)) continue;

            if (rule.reward.pointsPerValue) {
                totalPoints += Math.floor(billAmount / 100) * rule.reward.pointsPerValue;
            }
            if (rule.reward.fixedPoints) {
                totalPoints += rule.reward.fixedPoints;
            }
        }

        // Apply Tier Multiplier
        const tier = config.tiers.find(t => t.id === customerTierId);
        if (tier) {
            totalPoints = Math.round(totalPoints * tier.earnMultiplier);
        }

        return totalPoints;
    },

    /**
     * Checks if a redemption is valid
     */
    validateRedemption: (config: LoyaltyConfig, wallet: LoyaltyWallet, pointsToRedeem: number, billAmount: number): { isValid: boolean; error?: string } => {
        if (!config.isEnabled) return { isValid: false, error: "Loyalty program is disabled" };
        if (wallet.currentBalance < pointsToRedeem) return { isValid: false, error: "Insufficient points" };
        if (pointsToRedeem < config.minRedeemPoints) return { isValid: false, error: `Minimum ${config.minRedeemPoints} points required to redeem` };

        const monetaryValue = pointsToRedeem * config.pointValue;
        const maxAllowedValue = (billAmount * config.maxRedeemPercentage) / 100;

        if (monetaryValue > maxAllowedValue) {
            return { isValid: false, error: `Cannot redeem more than ${config.maxRedeemPercentage}% of bill value` };
        }

        return { isValid: true };
    },

    /**
     * Determines the next tier for a customer based on lifetime spend
     */
    calculateNextTier: (config: LoyaltyConfig, lifetimeSpend: number): LoyaltyTier => {
        const sortedTiers = [...config.tiers].sort((a, b) => b.minSpend - a.minSpend);
        return sortedTiers.find(t => lifetimeSpend >= t.minSpend) || config.tiers[0];
    },

    /**
     * AI Insights: Predicts churn risk based on last activity
     */
    getAIInsights: async (customerId: string, history: LoyaltyTransaction[]) => {
        // Mocking AI Churn Prediction
        const lastActivity = new Date(history[0]?.createdAt || Date.now());
        const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

        return {
            churnRisk: daysSinceActivity > 60 ? 'HIGH' : daysSinceActivity > 30 ? 'MEDIUM' : 'LOW',
            recommendedAction: daysSinceActivity > 30 ? "Send 'We Miss You' bonus points" : "Recommend Tier Up offer",
            predictedValue: "₹4,500 over next 90 days"
        };
    }
};
