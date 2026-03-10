/**
 * Plan Recommendation Engine
 * Migrated from utils/planRecommendationEngine to FSD: features/tenant-onboarding/lib/planRecommendationEngine
 */

import { PLANS, MODULES, Plan } from '@/entities/session/api/plans';

export interface BusinessProfile {
    businessName: string;
    businessType: string;
    sector: string;
    location: { city: string; state: string };
    gstNumber?: string;
    employeeCount: number;
    branchCount: number;
    expectedTransactions: 'low' | 'medium' | 'high' | 'very_high';
    selectedModules: string[];
}

interface PlanRecommendation {
    recommendedPlan: Plan;
    reasons: string[];
    score: number;
    monthlyEstimate?: number;
    savings?: number;
}

/**
 * Recommends the best plan based on business profile
 */
export const recommendPlan = (profile: BusinessProfile): PlanRecommendation => {
    // Score each plan
    let bestPlan = PLANS[0];
    let bestScore = 0;
    const reasons: string[] = [];

    for (const plan of PLANS) {
        let score = 0;

        // Module coverage
        const coveredModules = profile.selectedModules.filter(m => plan.modules.includes(m));
        score += (coveredModules.length / Math.max(profile.selectedModules.length, 1)) * 40;

        // User capacity
        if (plan.limits.users === 'unlimited' || profile.employeeCount <= (plan.limits.users as number)) score += 20;
        else score -= 10;

        // Branch capacity
        if (plan.limits.branches === 'unlimited' || profile.branchCount <= (plan.limits.branches as number)) score += 20;
        else score -= 10;

        // Transaction volume match
        const volumeMap: Record<string, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
        const planTier = PLANS.indexOf(plan);
        if (Math.abs(volumeMap[profile.expectedTransactions] - planTier) <= 1) score += 20;

        if (score > bestScore) {
            bestScore = score;
            bestPlan = plan;
        }
    }

    if (profile.employeeCount > 5) reasons.push(`Supports ${bestPlan.limits.users}+ users for your team of ${profile.employeeCount}`);
    if (profile.branchCount > 1) reasons.push(`Multi-branch support for your ${profile.branchCount} locations`);
    if (profile.selectedModules.length > 3) reasons.push(`Covers ${profile.selectedModules.length} modules you selected`);
    if (profile.expectedTransactions === 'high' || profile.expectedTransactions === 'very_high') {
        reasons.push('High-volume transaction processing included');
    }

    return { recommendedPlan: bestPlan, reasons, score: bestScore };
};

/**
 * Recommends modules based on business type and sector
 */
export const getRecommendedModules = (businessType: string, sector: string): string[] => {
    const recommended: string[] = ['pos', 'inventory'];

    if (businessType === 'retail' || businessType === 'wholesale') {
        recommended.push('purchase', 'billing');
    }
    if (businessType === 'service') {
        recommended.push('crm', 'billing');
    }
    if (businessType === 'manufacturing') {
        recommended.push('purchase', 'production');
    }
    if (sector === 'food' || sector === 'restaurant') {
        recommended.push('online_store');
    }

    return [...new Set(recommended)];
};

/**
 * Calculates custom pricing based on plan + add-ons
 */
export const calculateCustomPricing = (
    plan: Plan,
    addonModules: string[],
    additionalUsers: number,
    additionalBranches: number
) => {
    const basePrice = parseInt(plan.price.replace(/[^0-9]/g, '')) || 0;
    const userCost = additionalUsers * 99;
    const branchCost = additionalBranches * 199;
    const moduleCost = addonModules.length * 299;

    const breakdown = [
        { item: `${plan.name} Plan`, cost: basePrice },
        ...(additionalUsers > 0 ? [{ item: `+${additionalUsers} Users`, cost: userCost }] : []),
        ...(additionalBranches > 0 ? [{ item: `+${additionalBranches} Branches`, cost: branchCost }] : []),
        ...(addonModules.length > 0 ? [{ item: `+${addonModules.length} Add-on Modules`, cost: moduleCost }] : []),
    ];

    return {
        breakdown,
        total: basePrice + userCost + branchCost + moduleCost
    };
};
