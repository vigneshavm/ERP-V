import SystemConfig from "../models/SystemConfig.js";
import TaxMaster from "../models/TaxMaster.js";
import LoyaltyRule from "../models/LoyaltyRule.js";
import SegmentRule from "../models/SegmentRule.js";

export class ConfigService {
    private static cache = new Map<string, { value: any; timestamp: number }>();
    private static CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache TTL

    /**
     * Clear in-memory config cache (useful during test executions or DB update events)
     */
    static clearCache() {
        this.cache.clear();
    }

    /**
     * Get a dynamic system configuration value by key from DB
     */
    static async get<T = any>(tenantId: string, key: string, fallbackValue: T): Promise<T> {
        const cacheKey = `${tenantId}:${key}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
            return cached.value as T;
        }

        try {
            const config = (await SystemConfig.findOne({ tenantId, key }).lean()) as any;
            if (config && config.value !== undefined && config.value !== null) {
                this.cache.set(cacheKey, { value: config.value, timestamp: Date.now() });
                return config.value as T;
            }
        } catch (err) {
            // Log & fallback to default if DB lookup fails
        }

        return fallbackValue;
    }

    /**
     * Update or create a dynamic configuration key in DB
     */
    static async set(tenantId: string, key: string, value: any, group: 'TAX' | 'LOYALTY' | 'CREDIT' | 'INVENTORY' | 'MARKETING' | 'PAYMENT' | 'GENERAL' = 'GENERAL'): Promise<any> {
        const config = await SystemConfig.findOneAndUpdate(
            { tenantId, key },
            { $set: { value, group } },
            { upsert: true, new: true }
        );

        const cacheKey = `${tenantId}:${key}`;
        this.cache.set(cacheKey, { value, timestamp: Date.now() });
        return config;
    }

    /**
     * Get dynamic Loyalty Rule configuration from DB (LoyaltyRule table or SystemConfig fallback)
     */
    static async getLoyaltyRuleConfig(tenantId: string): Promise<{ spendPerPoint: number; rupeesPer100Points: number }> {
        try {
            const activeRule = (await LoyaltyRule.findOne({ tenantId, isActive: true }).sort({ createdAt: -1 }).lean()) as any;
            if (activeRule) {
                return {
                    spendPerPoint: activeRule.spendPerPoint,
                    rupeesPer100Points: activeRule.rupeesPer100Points
                };
            }
        } catch (err) {
            // Fallback to SystemConfig or default
        }

        const spendPerPoint = await this.get<number>(tenantId, 'LOYALTY_SPEND_PER_POINT', 100);
        const rupeesPer100Points = await this.get<number>(tenantId, 'LOYALTY_RUPEES_PER_100_POINTS', 10);
        return { spendPerPoint, rupeesPer100Points };
    }

    /**
     * Get dynamic Tax percentage from DB TaxMaster by tax code (e.g. 'GST_18')
     */
    static async getTaxPercentage(tenantId: string, taxCode: string, fallbackRate: number = 18): Promise<number> {
        try {
            const taxRecord = (await TaxMaster.findOne({ tenantId, taxCode, isActive: true }).lean()) as any;
            if (taxRecord && taxRecord.percentage !== undefined) {
                return taxRecord.percentage;
            }
        } catch (err) {
            // Fallback
        }

        return await this.get<number>(tenantId, `TAX_${taxCode.toUpperCase()}`, fallbackRate);
    }

    /**
     * Get dynamic Customer Segmentation Thresholds from DB SegmentRule
     */
    static async getSegmentRules(tenantId: string) {
        try {
            const rules = (await SegmentRule.find({ tenantId, isActive: true }).lean()) as any[];
            if (rules && rules.length > 0) {
                return rules;
            }
        } catch (err) {
            // Fallback to default thresholds
        }

        // Return default configuration rules
        return [
            { segmentName: 'INACTIVE', minOrders: 1, minSpend: 0, inactiveDaysThreshold: await this.get(tenantId, 'SEGMENT_INACTIVE_DAYS', 90) },
            { segmentName: 'HIGH_VALUE', minOrders: await this.get(tenantId, 'SEGMENT_HIGH_VALUE_ORDERS', 15), minSpend: await this.get(tenantId, 'SEGMENT_HIGH_VALUE_SPEND', 25000) },
            { segmentName: 'LOYAL', minOrders: await this.get(tenantId, 'SEGMENT_LOYAL_ORDERS', 8), minSpend: 0 },
            { segmentName: 'REGULAR', minOrders: await this.get(tenantId, 'SEGMENT_REGULAR_ORDERS', 3), minSpend: 0 },
            { segmentName: 'OCCASIONAL', minOrders: await this.get(tenantId, 'SEGMENT_OCCASIONAL_ORDERS', 1), minSpend: 0 },
            { segmentName: 'NEW', minOrders: 0, minSpend: 0 }
        ];
    }
}

export default ConfigService;
