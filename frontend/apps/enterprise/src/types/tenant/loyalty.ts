// Loyalty Types

export interface LoyaltyTier {
    id: string;
    name: string;
    minSpend: number;
    earnMultiplier: number;
    description: string;
    color: string;
    benefits: string[];
}

export interface LoyaltyRule {
    id: string;
    type: 'EARNING' | 'REDEMPTION' | 'BONUS';
    ruleName: string;
    conditions: {
        minBillAmount?: number;
        categories?: string[];
        branches?: string[];
        customerTiers?: string[];
    };
    reward: {
        pointsPerValue?: number; // e.g. 5 points per 100
        fixedPoints?: number;
        multiplier?: number;
    };
    expiryDays?: number;
    isActive: boolean;
}

export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    branchId: string;
    type: 'EARN' | 'REDEEM' | 'EXPIRY' | 'ADJUST' | 'BONUS';
    points: number;
    value?: number; // Monetary value
    refId?: string; // Invoice ID
    description: string;
    createdAt: string;
}

export interface LoyaltyWallet {
    customerId: string;
    currentBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    expiredPoints: number;
    tierId: string;
    branchWiseBalances: Record<string, number>;
    history: LoyaltyTransaction[];
}

export interface LoyaltyConfig {
    isEnabled: boolean;
    pointValue: number; // e.g. 1 point = ₹0.10
    minRedeemPoints: number;
    maxRedeemPercentage: number; // e.g. 50% of bill
    tiers: LoyaltyTier[];
    rules: LoyaltyRule[];
    isPremium: boolean; // Standalone module subscription status
}
