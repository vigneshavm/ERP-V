import Customer from "../models/Customer.js";
import Invoice from "../../sales/models/Invoice.js";
import LoyaltyService from "./LoyaltyService.js";
import ConfigService from "../../core/services/ConfigService.js";

export class CustomerAnalyticsService {

    /**
     * Compute and classify Customer Segment based on RFM (Recency, Frequency, Monetary)
     * Supports optional dynamic rules override or default parameters
     */
    static classifySegment(
        totalOrders: number,
        totalSpend: number,
        daysSinceLastPurchase: number,
        rulesOverride?: Array<{ segmentName: string; minSpend: number; minOrders: number; inactiveDaysThreshold: number }>
    ): 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'LOYAL' | 'HIGH_VALUE' | 'INACTIVE' {
        if (rulesOverride && rulesOverride.length > 0) {
            const inactiveRule = rulesOverride.find(r => r.segmentName === 'INACTIVE');
            if (inactiveRule && daysSinceLastPurchase > inactiveRule.inactiveDaysThreshold && totalOrders > 0) {
                return 'INACTIVE';
            }

            const highValueRule = rulesOverride.find(r => r.segmentName === 'HIGH_VALUE');
            if (highValueRule && (totalSpend >= highValueRule.minSpend || (highValueRule.minOrders > 0 && totalOrders >= highValueRule.minOrders))) {
                return 'HIGH_VALUE';
            }

            const loyalRule = rulesOverride.find(r => r.segmentName === 'LOYAL');
            if (loyalRule && totalOrders >= loyalRule.minOrders && loyalRule.minOrders > 0) {
                return 'LOYAL';
            }

            const regularRule = rulesOverride.find(r => r.segmentName === 'REGULAR');
            if (regularRule && totalOrders >= regularRule.minOrders && regularRule.minOrders > 0) {
                return 'REGULAR';
            }

            const occasionalRule = rulesOverride.find(r => r.segmentName === 'OCCASIONAL');
            if (occasionalRule && totalOrders >= occasionalRule.minOrders && occasionalRule.minOrders > 0) {
                return 'OCCASIONAL';
            }

            return 'NEW';
        }

        // Default fallbacks if no dynamic override passed
        if (daysSinceLastPurchase > 90 && totalOrders > 0) return 'INACTIVE';
        if (totalSpend >= 25000 || totalOrders >= 15) return 'HIGH_VALUE';
        if (totalOrders >= 8) return 'LOYAL';
        if (totalOrders >= 3) return 'REGULAR';
        if (totalOrders >= 1) return 'OCCASIONAL';
        return 'NEW';
    }

    /**
     * Build Customer 360-Degree Profile & Purchase Pattern Analysis (BRD §12, §14, §19 & §21)
     */
    static async getCustomer360Profile(tenantId: string, customerId: string) {
        const customer = await Customer.findOne({ _id: customerId, tenantId }).lean();
        if (!customer) throw new Error("Customer not found");

        const invoices = await Invoice.find({ customer: customerId, tenantId }).sort({ createdAt: -1 }).lean();
        const loyaltyLedger = await LoyaltyService.getLoyaltyLedger(tenantId, customerId);

        const totalOrders = invoices.length;
        const totalSpend = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? Number((totalSpend / totalOrders).toFixed(2)) : 0;

        const lastPurchaseDate = invoices.length > 0 ? invoices[0].createdAt : customer.createdAt;
        const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));

        const dynamicRules = await ConfigService.getSegmentRules(tenantId);
        const segment = this.classifySegment(totalOrders, totalSpend, daysSinceLastPurchase, dynamicRules as any);

        // Product & Category Preferences
        const categoryMap = new Map<string, { count: number, spend: number }>();
        invoices.forEach(inv => {
            (inv.items || []).forEach(i => {
                const cat = (i as any).category || 'General';
                const existing = categoryMap.get(cat) || { count: 0, spend: 0 };
                categoryMap.set(cat, {
                    count: existing.count + i.quantity,
                    spend: existing.spend + i.total
                });
            });
        });

        const categoryPreferences = Array.from(categoryMap.entries()).map(([category, val]) => ({
            category,
            count: val.count,
            spend: val.spend
        })).sort((a, b) => b.spend - a.spend);

        return {
            profile: {
                customerId: customer._id,
                name: customer.name,
                phone: customer.phone || 'N/A (Guest/No Phone)',
                email: customer.email || 'N/A',
                marketingConsent: customer.marketingConsent || { optIn: false, channels: { sms: false, email: false, whatsapp: false } },
                tier: customer.tier || 'General',
                pointsBalance: customer.points || 0,
                dues: customer.dues || 0
            },
            analytics: {
                totalOrders,
                totalSpend,
                averageOrderValue,
                firstPurchaseDate: invoices.length > 0 ? invoices[invoices.length - 1].createdAt : null,
                lastPurchaseDate,
                daysSinceLastPurchase,
                segment,
                estimatedCLV: Number((averageOrderValue * (totalOrders || 1) * 1.5).toFixed(2))
            },
            categoryPreferences,
            recentInvoices: invoices.slice(0, 10),
            loyaltyLedger: loyaltyLedger.slice(0, 20)
        };
    }

    /**
     * Filter Target Marketing Audience strictly enforcing Consent Rules (BRD §4, §16, §17 & §18)
     * "Phone Provided != Marketing Consent. Customers who explicitly opted out are excluded."
     */
    static async getMarketingEligibleAudience(tenantId: string, segmentFilter?: string) {
        const query: any = {
            tenantId,
            'marketingConsent.optIn': true // STRICT CONSENT ENFORCEMENT
        };

        if (segmentFilter) {
            query.segment = segmentFilter;
        }

        const eligibleCustomers = await Customer.find(query).select('name phone email marketingConsent segment totalSpend points tier').lean();
        return {
            totalEligible: eligibleCustomers.length,
            audience: eligibleCustomers
        };
    }
}

export default CustomerAnalyticsService;
