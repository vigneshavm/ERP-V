/**
 * Plan Recommendation Engine
 * 
 * Analyzes business profile and recommends the optimal plan
 * based on employee count, branches, features needed, and transaction volume.
 */

import { PLANS, Plan, MODULES } from '../data/plans';

export interface BusinessProfile {
    businessName: string;
    businessType: string;
    sector: string;
    location: {
        city: string;
        state: string;
    };
    gstNumber?: string;
    employeeCount: number;
    branchCount: number;
    expectedTransactions: 'low' | 'medium' | 'high' | 'very_high';
    selectedModules: string[];
}

export interface PlanRecommendation {
    recommendedPlan: Plan;
    score: number;
    reasons: string[];
    alternatives: {
        plan: Plan;
        reason: string;
    }[];
    monthlyEstimate: number;
    savings?: {
        amount: number;
        description: string;
    };
}

// Transaction volume thresholds
const TRANSACTION_THRESHOLDS = {
    low: 100,        // < 100 transactions/month
    medium: 500,     // 100-500 transactions/month
    high: 2000,      // 500-2000 transactions/month
    very_high: 5000  // > 2000 transactions/month
};

/**
 * Calculate which plan best fits the business profile
 */
export function recommendPlan(profile: BusinessProfile): PlanRecommendation {
    const scores: { plan: Plan; score: number; reasons: string[] }[] = [];

    for (const plan of PLANS) {
        let score = 0;
        const reasons: string[] = [];

        // Check user limit
        if (plan.limits.users === 'unlimited' || profile.employeeCount <= plan.limits.users) {
            score += 20;
            if (plan.limits.users !== 'unlimited' && profile.employeeCount <= plan.limits.users * 0.7) {
                reasons.push(`Fits your team size of ${profile.employeeCount} employees`);
            }
        } else {
            score -= 50; // Major penalty for exceeding limits
        }

        // Check branch limit
        if (plan.limits.branches === 'unlimited' || profile.branchCount <= plan.limits.branches) {
            score += 20;
            if (profile.branchCount > 1) {
                reasons.push(`Supports your ${profile.branchCount} branches`);
            }
        } else {
            score -= 50;
        }

        // Check module coverage
        const requiredModules = profile.selectedModules;
        const includedModules = plan.modules;
        const modulesCovered = requiredModules.filter(m => includedModules.includes(m));
        const moduleCoverage = requiredModules.length > 0
            ? (modulesCovered.length / requiredModules.length) * 100
            : 100;

        if (moduleCoverage === 100) {
            score += 30;
            reasons.push('Includes all your required features');
        } else if (moduleCoverage >= 80) {
            score += 20;
            reasons.push(`Covers ${Math.round(moduleCoverage)}% of your feature needs`);
        } else {
            score -= 20;
        }

        // Check transaction volume and fee impact
        const transactionVolume = TRANSACTION_THRESHOLDS[profile.expectedTransactions];
        const avgTransactionValue = 500; // Assumed average
        const monthlyVolume = transactionVolume * avgTransactionValue;
        const _feeImpact = monthlyVolume * (plan.limits.transactionFee / 100);

        if (profile.expectedTransactions === 'high' || profile.expectedTransactions === 'very_high') {
            if (plan.limits.transactionFee <= 2) {
                score += 15;
                reasons.push('Low transaction fees save you money at scale');
            }
        }

        // Cost efficiency scoring
        if (plan.monthlyPrice === 0 && profile.employeeCount <= 3) {
            score += 25;
            reasons.push('Perfect for starting out at no cost');
        } else if (plan.monthlyPrice > 0) {
            const costPerEmployee = plan.monthlyPrice / Math.max(profile.employeeCount, 1);
            if (costPerEmployee < 200) {
                score += 10;
                reasons.push('Great value per employee');
            }
        }

        // Popularity bonus for Growth plan (most balanced choice)
        if (plan.popular) {
            score += 5;
        }

        scores.push({ plan, score, reasons });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const recommended = scores[0];
    const alternatives = scores.slice(1, 3).map(s => ({
        plan: s.plan,
        reason: s.reasons[0] || `Alternative with ${s.plan.features.length} features`
    }));

    // Calculate estimated monthly cost
    const transactionVolume = TRANSACTION_THRESHOLDS[profile.expectedTransactions];
    const avgTransactionValue = 500;
    const monthlyTransactionFee = transactionVolume * avgTransactionValue * (recommended.plan.limits.transactionFee / 100);
    const monthlyEstimate = recommended.plan.monthlyPrice + monthlyTransactionFee;

    // Calculate potential savings compared to next tier
    let savings = undefined;
    if (recommended.plan.id === 'GROWTH' && profile.expectedTransactions === 'high') {
        const scalePlan = PLANS.find(p => p.id === 'SCALE');
        if (scalePlan) {
            const currentFees = monthlyTransactionFee;
            const savingsAmount = currentFees - scalePlan.monthlyPrice;
            if (savingsAmount > 0) {
                savings = {
                    amount: savingsAmount,
                    description: 'Upgrade to Scale to eliminate transaction fees'
                };
            }
        }
    }

    return {
        recommendedPlan: recommended.plan,
        score: recommended.score,
        reasons: recommended.reasons.slice(0, 3),
        alternatives,
        monthlyEstimate: Math.round(monthlyEstimate),
        savings
    };
}

/**
 * Calculate custom pricing based on selections
 */
export function calculateCustomPricing(
    basePlan: Plan,
    additionalModules: string[],
    additionalUsers: number,
    additionalBranches: number
): { total: number; breakdown: { item: string; cost: number }[] } {
    const breakdown: { item: string; cost: number }[] = [];

    // Base plan cost
    breakdown.push({ item: `${basePlan.name} Plan`, cost: basePlan.monthlyPrice });

    // Additional modules not in plan
    const moduleNotIncluded = additionalModules.filter(m => !basePlan.modules.includes(m));
    for (const moduleId of moduleNotIncluded) {
        const module = MODULES.find(m => m.id === moduleId);
        if (module) {
            const moduleCost = 299; // Base addon cost
            breakdown.push({ item: `Add-on: ${module.name}`, cost: moduleCost });
        }
    }

    // Additional users beyond plan limit
    if (typeof basePlan.limits.users === 'number' && additionalUsers > 0) {
        const userCost = additionalUsers * 99;
        breakdown.push({ item: `Additional Users (${additionalUsers})`, cost: userCost });
    }

    // Additional branches beyond plan limit
    if (typeof basePlan.limits.branches === 'number' && additionalBranches > 0) {
        const branchCost = additionalBranches * 199;
        breakdown.push({ item: `Additional Branches (${additionalBranches})`, cost: branchCost });
    }

    const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

    return { total, breakdown };
}

/**
 * Get modules recommended based on business type and sector
 */
export function getRecommendedModules(businessType: string, sector: string): string[] {
    const recommended: string[] = ['pos', 'inventory']; // Always essential

    // Business type specific recommendations
    if (businessType === 'retail') {
        recommended.push('crm');
    }
    if (businessType === 'wholesale') {
        recommended.push('crm', 'accounting');
    }
    if (businessType === 'manufacturing') {
        recommended.push('hrms', 'accounting');
    }

    // Sector specific recommendations
    if (sector === 'textiles' || sector === 'jewelry') {
        recommended.push('crm'); // High-value customers
    }
    if (sector === 'fmcg' || sector === 'food') {
        recommended.push('analytics'); // Fast-moving items need analytics
    }
    if (sector === 'electronics') {
        recommended.push('ecommerce'); // Online presence important
    }

    return [...new Set(recommended)]; // Remove duplicates
}
