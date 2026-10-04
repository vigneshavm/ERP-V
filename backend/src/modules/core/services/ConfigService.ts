import { getConfig, setConfig } from "../../../integrations/textilesoft/erpSystemConfig.js";
import { getTaxPercentage } from "../../../integrations/textilesoft/erpTaxMaster.js";
import type { TenantRef } from '../../../interfaces/TenantRef.js';

type LoyaltyRuleConfig = {
    ruleId: string;
    ruleName: string;
    spendPerPoint: number;
    rupeesPer100Points: number;
    bonusMultiplier: number;
    minSpendRequired: number;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
};

type SegmentRuleConfig = {
    segmentName: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'LOYAL' | 'HIGH_VALUE' | 'INACTIVE';
    minSpend: number;
    minOrders: number;
    inactiveDaysThreshold: number;
    isActive: boolean;
};

const loyaltyKey = (tenantId: TenantRef) => `LOYALTY_RULE_${String(tenantId)}`;
const segmentKey = (tenantId: TenantRef) => `SEGMENT_RULES_${String(tenantId)}`;
const defaultLoyaltyRule = (): LoyaltyRuleConfig => ({ ruleId: 'DEFAULT_LOYALTY', ruleName: 'Default Loyalty Rule', spendPerPoint: 100, rupeesPer100Points: 10, bonusMultiplier: 1, minSpendRequired: 0, isActive: true });
const defaultSegmentRules = (): SegmentRuleConfig[] => [
    { segmentName: 'INACTIVE', minOrders: 1, minSpend: 0, inactiveDaysThreshold: 90, isActive: true },
    { segmentName: 'HIGH_VALUE', minOrders: 15, minSpend: 25000, inactiveDaysThreshold: 90, isActive: true },
    { segmentName: 'LOYAL', minOrders: 8, minSpend: 0, inactiveDaysThreshold: 90, isActive: true },
    { segmentName: 'REGULAR', minOrders: 3, minSpend: 0, inactiveDaysThreshold: 90, isActive: true },
    { segmentName: 'OCCASIONAL', minOrders: 1, minSpend: 0, inactiveDaysThreshold: 90, isActive: true },
    { segmentName: 'NEW', minOrders: 0, minSpend: 0, inactiveDaysThreshold: 90, isActive: true },
];

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
     * Get a dynamic configuration value by key from the existing erp.system_config table.
     */
    static async get<T = any>(key: string, fallbackValue: T): Promise<T> {
        const cached = this.cache.get(key);

        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
            return cached.value as T;
        }

        const value = await getConfig<T>(key, fallbackValue);
        this.cache.set(key, { value, timestamp: Date.now() });
        return value;
    }

    /**
     * Update or create a dynamic configuration key (erp.system_config)
     */
    static async set(key: string, value: any, group: 'TAX' | 'LOYALTY' | 'CREDIT' | 'INVENTORY' | 'MARKETING' | 'PAYMENT' | 'GENERAL' = 'GENERAL'): Promise<any> {
        const config = await setConfig(key, value, group);
        this.cache.set(key, { value, timestamp: Date.now() });
        return config;
    }

    /**
     * Read tenant-scoped loyalty settings from the existing SQL key/value configuration table.
     */
    static async getLoyaltyRuleConfig(tenantId: TenantRef): Promise<{ spendPerPoint: number; rupeesPer100Points: number }> {
        const saved = await this.get<LoyaltyRuleConfig | null>(loyaltyKey(tenantId), null);
        const rule = saved?.isActive ? saved : {
            ...defaultLoyaltyRule(),
            spendPerPoint: await this.get<number>('LOYALTY_SPEND_PER_POINT', 100),
            rupeesPer100Points: await this.get<number>('LOYALTY_RUPEES_PER_100_POINTS', 10),
        };
        return { spendPerPoint: rule.spendPerPoint, rupeesPer100Points: rule.rupeesPer100Points };
    }

    static async saveLoyaltyRule(tenantId: TenantRef, input: Partial<LoyaltyRuleConfig>): Promise<LoyaltyRuleConfig> {
        const saved = await this.get<LoyaltyRuleConfig | null>(loyaltyKey(tenantId), null);
        const current = saved ?? {
            ...defaultLoyaltyRule(),
            spendPerPoint: await this.get<number>('LOYALTY_SPEND_PER_POINT', 100),
            rupeesPer100Points: await this.get<number>('LOYALTY_RUPEES_PER_100_POINTS', 10),
        };
        const rule = { ...current, ...input, ruleId: input.ruleId || current.ruleId, isActive: input.isActive ?? true };
        await this.set(loyaltyKey(tenantId), rule, 'LOYALTY');
        return rule;
    }

    /**
     * Get dynamic Tax percentage by tax code (e.g. 'GST_18') from erp.tax_master
     */
    static async getTaxPercentage(_tenantId: string, taxCode: string, fallbackRate: number = 18): Promise<number> {
        return getTaxPercentage(taxCode, fallbackRate);
    }

    /**
     * Read segment thresholds from the existing SQL key/value configuration table.
     */
    static async getSegmentRules(tenantId: string) {
        const saved = await this.get<SegmentRuleConfig[] | null>(segmentKey(tenantId), null);
        if (saved?.some((rule) => rule.isActive)) return saved.filter((rule) => rule.isActive);
        return [
            { ...defaultSegmentRules()[0], inactiveDaysThreshold: await this.get('SEGMENT_INACTIVE_DAYS', 90) },
            { ...defaultSegmentRules()[1], minOrders: await this.get('SEGMENT_HIGH_VALUE_ORDERS', 15), minSpend: await this.get('SEGMENT_HIGH_VALUE_SPEND', 25000) },
            defaultSegmentRules()[2],
            { ...defaultSegmentRules()[3], minOrders: await this.get('SEGMENT_REGULAR_ORDERS', 3) },
            { ...defaultSegmentRules()[4], minOrders: await this.get('SEGMENT_OCCASIONAL_ORDERS', 1) },
            defaultSegmentRules()[5],
        ];
    }

    static async saveSegmentRule(tenantId: string, input: Partial<SegmentRuleConfig> & Pick<SegmentRuleConfig, 'segmentName'>): Promise<SegmentRuleConfig> {
        const rules = await this.getSegmentRules(tenantId);
        const previous = rules.find((rule) => rule.segmentName === input.segmentName);
        const rule: SegmentRuleConfig = {
            segmentName: input.segmentName,
            minSpend: input.minSpend ?? previous?.minSpend ?? 0,
            minOrders: input.minOrders ?? previous?.minOrders ?? 0,
            inactiveDaysThreshold: input.inactiveDaysThreshold ?? previous?.inactiveDaysThreshold ?? 90,
            isActive: input.isActive ?? previous?.isActive ?? true,
        };
        await this.set(segmentKey(tenantId), [...rules.filter((entry) => entry.segmentName !== input.segmentName), rule], 'LOYALTY');
        return rule;
    }
}

export default ConfigService;
